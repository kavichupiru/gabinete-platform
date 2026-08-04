"""Perfil demográfico por local de votación: sexo, edad y procedencia,
San Pedro del Ycuamandyyú (DEPART=2, DISTRITO=0), corte CONTRASTE.

Campos usados de regciv.dbf (streaming desde el ZIP, sin extraer, igual
patrón que 10_electores_por_distrito.py / 12_electores_y_mesas_por_local.py):
- SEXO: 'M'/'F', poblado en el 100% de las filas.
- EDAD: campo numérico nuevo del padrón "definitivo" (no existía en el corte
  dic/2025), poblado en el 100% de las filas.

Procedencia rural/urbana no es un campo de la fuente (el candidato más
cercano, DIRECC, está vacío en las 25.921 filas del distrito). Se aplica una
clasificación MANUAL por local, confirmada por el usuario el 04/08/2026:
locales 1, 2 y 3 (Col. Nac. de San Pedro, Centro Formación Docente, Esc.
4118 San Rafael) son URBANO; el resto (501-509, compañías) es RURAL. No es
un dato oficial del TSJE — es un criterio operativo del equipo político.
"""
import os
import zipfile
from collections import Counter
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

from dbf_reader import find_entry, iter_dbf_filtered, iter_dbf_records

ROOT = Path(__file__).resolve().parent.parent
RUN_SUFFIX = os.environ.get("PADRON_RUN_SUFFIX", "")
CONTRASTE_LABEL = os.environ.get("PADRON_CONTRASTE_LABEL", "dic2025")
INPUT_CONTRASTE = Path(os.environ.get("PADRON_CONTRASTE_DIR", str(ROOT / "input" / "contraste_dic2025")))
OUTPUT_REPORTES = ROOT / "output" / f"reportes{RUN_SUFFIX}"
OUT_PATH = OUTPUT_REPORTES / f"perfil_demografico_por_local_{CONTRASTE_LABEL}.xlsx"

DEPART_SAN_PEDRO = "2"
DISTRITO_YCUAMANDYYU = "0"

# Confirmado por el usuario el 04/08/2026 (no es un dato oficial del TSJE).
LOCALES_URBANO = {"1", "2", "3"}

EDAD_BUCKETS = [
    ("18-30", 18, 30),
    ("31-40", 31, 40),
    ("41-50", 41, 50),
    ("51-60", 51, 60),
    ("61 y más", 61, None),
]

COLOR_NAVY = "#1F3B57"
COLOR_GOLD = "#C9A227"
COLOR_RURAL = "#6E8B96"
COLOR_EDAD = ["#B9CBDA", "#8FACC3", "#5E85A8", "#3A5F82", "#1F3B57"]

GRAFICOS_DIR_NAME = "graficos_perfil_demografico"


def bucket_edad(edad: int) -> str:
    for label, lo, hi in EDAD_BUCKETS:
        if edad >= lo and (hi is None or edad <= hi):
            return label
    return "sin edad válida (<18)"


def find_rcp_zip() -> Path:
    zips = list(INPUT_CONTRASTE.glob("*.zip"))
    if len(zips) != 1:
        raise RuntimeError(f"Esperaba exactamente un .zip en {INPUT_CONTRASTE}, encontré {len(zips)}")
    return zips[0]


def _short_label(row) -> str:
    desc = row["local_desc"]
    if len(desc) > 26:
        desc = desc[:24] + "…"
    return f"{row['local_cod']} · {desc}"


def generar_graficos(df: pd.DataFrame, df_procedencia: pd.DataFrame, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    plt.rcParams.update({"font.size": 10, "axes.edgecolor": "#BFBFBF"})

    df_orden_total = df.sort_values("total_electores", ascending=True)
    labels_total = df_orden_total.apply(_short_label, axis=1)
    colores_proc = [COLOR_NAVY if p == "URBANO" else COLOR_RURAL for p in df_orden_total["procedencia"]]

    # 1. Electores por local (ordenado por tamaño, coloreado por procedencia)
    fig, ax = plt.subplots(figsize=(9, 5.5))
    bars = ax.barh(labels_total, df_orden_total["total_electores"], color=colores_proc)
    for b, v in zip(bars, df_orden_total["total_electores"]):
        ax.text(b.get_width() + 60, b.get_y() + b.get_height() / 2, f"{v:,}".replace(",", "."), va="center", fontsize=9)
    ax.set_xlabel("Electores habilitados")
    ax.set_title("Electores por local de votación")
    from matplotlib.patches import Patch
    ax.legend(handles=[Patch(color=COLOR_NAVY, label="Urbano"), Patch(color=COLOR_RURAL, label="Rural")], loc="lower right")
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    fig.savefig(out_dir / "electores_por_local.png", dpi=150)
    plt.close(fig)

    # 2. Sexo por local (% Varón/Mujer, ordenado por local_cod)
    df_orden_cod = df.sort_values("local_cod", key=lambda s: s.astype(int), ascending=False)
    labels_cod = df_orden_cod.apply(_short_label, axis=1)
    pct_v = df_orden_cod["varones"] / df_orden_cod["total_electores"] * 100
    pct_m = df_orden_cod["mujeres"] / df_orden_cod["total_electores"] * 100

    fig, ax = plt.subplots(figsize=(9, 5.5))
    ax.barh(labels_cod, pct_v, color=COLOR_NAVY, label="Varón")
    ax.barh(labels_cod, pct_m, left=pct_v, color=COLOR_GOLD, label="Mujer")
    for i, (v, m) in enumerate(zip(pct_v, pct_m)):
        ax.text(v / 2, i, f"{v:.0f}%", va="center", ha="center", fontsize=8, color="white")
        ax.text(v + m / 2, i, f"{m:.0f}%", va="center", ha="center", fontsize=8, color="#3a2f00")
    ax.set_xlabel("% de electores")
    ax.set_xlim(0, 100)
    ax.set_title("Composición por sexo, por local (%)")
    ax.legend(loc="upper center", bbox_to_anchor=(0.5, -0.08), ncol=2)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    fig.savefig(out_dir / "sexo_por_local.png", dpi=150)
    plt.close(fig)

    # 3. Distribución etaria por local (conteo absoluto, apilado)
    fig, ax = plt.subplots(figsize=(9, 5.5))
    izq = [0.0] * len(df_orden_cod)
    for label, color in zip([l for l, _, _ in EDAD_BUCKETS], COLOR_EDAD):
        vals = df_orden_cod[label].tolist()
        ax.barh(labels_cod, vals, left=izq, color=color, label=label)
        izq = [a + b for a, b in zip(izq, vals)]
    ax.set_xlabel("Electores habilitados")
    ax.set_title("Distribución etaria por local")
    ax.legend(loc="upper center", bbox_to_anchor=(0.5, -0.08), ncol=5, fontsize=8)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    fig.savefig(out_dir / "edad_por_local.png", dpi=150)
    plt.close(fig)

    # 4. Resumen urbano vs. rural
    fig, ax = plt.subplots(figsize=(5.5, 4.5))
    colores = [COLOR_NAVY if p == "URBANO" else COLOR_RURAL for p in df_procedencia["procedencia"]]
    total_general = df_procedencia["total_electores"].sum()
    bars = ax.bar(df_procedencia["procedencia"].str.capitalize(), df_procedencia["total_electores"], color=colores, width=0.55)
    for b, v in zip(bars, df_procedencia["total_electores"]):
        pct = v / total_general * 100
        ax.text(b.get_x() + b.get_width() / 2, b.get_height() + 250, f"{v:,}".replace(",", ".") + f"\n({pct:.0f}%)", ha="center", fontsize=10)
    ax.set_ylabel("Electores habilitados")
    ax.set_title("Electores por procedencia")
    ax.set_ylim(0, df_procedencia["total_electores"].max() * 1.22)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    fig.savefig(out_dir / "procedencia_resumen.png", dpi=150)
    plt.close(fig)

    print(f"Gráficos escritos en {out_dir}")


def main() -> None:
    zip_path = find_rcp_zip()

    with zipfile.ZipFile(zip_path) as zf:
        regciv_entry = find_entry(zf, "regciv.dbf")
        loc_entry = find_entry(zf, "loc.dbf")

        locales_desc = {
            r["LOCAL"]: r["DESCRIP"]
            for r in iter_dbf_records(zf, loc_entry)
            if r["DPTO"] == DEPART_SAN_PEDRO and r["DISTRITO"] == DISTRITO_YCUAMANDYYU
        }

        def es_san_pedro_ycuamandyyu(row: dict) -> bool:
            return row["DEPART"] == DEPART_SAN_PEDRO and row["DISTRITO"] == DISTRITO_YCUAMANDYYU

        por_local: dict[str, Counter] = {}
        edad_invalida = 0
        total = 0

        print("Leyendo regciv.dbf en streaming desde el zip (puede tardar unos minutos)...")
        for row in iter_dbf_filtered(zf, regciv_entry, es_san_pedro_ycuamandyyu):
            local = row["LOCAL"]
            c = por_local.setdefault(local, Counter())
            c["total"] += 1
            sexo = row.get("SEXO", "")
            if sexo == "M":
                c["varones"] += 1
            elif sexo == "F":
                c["mujeres"] += 1
            else:
                c["sexo_sin_dato"] += 1

            try:
                edad = int(row.get("EDAD", "").strip() or -1)
            except ValueError:
                edad = -1
            if edad < 18:
                c["edad_sin_dato_valido"] += 1
                edad_invalida += 1
            else:
                c[bucket_edad(edad)] += 1

            total += 1
            if total % 5000 == 0:
                print(f"  ...{total} electores procesados")

    filas = []
    for local, c in por_local.items():
        fila = {
            "local_cod": local,
            "local_desc": locales_desc.get(local, "(sin descripción)"),
            "procedencia": "URBANO" if local in LOCALES_URBANO else "RURAL",
            "total_electores": c["total"],
            "varones": c["varones"],
            "mujeres": c["mujeres"],
        }
        for label, _, _ in EDAD_BUCKETS:
            fila[label] = c.get(label, 0)
        fila["edad_sin_dato_valido"] = c.get("edad_sin_dato_valido", 0)
        filas.append(fila)

    df = pd.DataFrame(filas).sort_values("local_cod", key=lambda s: s.astype(int)).reset_index(drop=True)

    fila_total = {
        "local_cod": "", "local_desc": "TOTAL DISTRITO", "procedencia": "",
        "total_electores": df["total_electores"].sum(),
        "varones": df["varones"].sum(),
        "mujeres": df["mujeres"].sum(),
    }
    for label, _, _ in EDAD_BUCKETS:
        fila_total[label] = df[label].sum()
    fila_total["edad_sin_dato_valido"] = df["edad_sin_dato_valido"].sum()
    df_con_total = pd.concat([df, pd.DataFrame([fila_total])], ignore_index=True)

    # Resumen por procedencia (urbano vs. rural)
    df_procedencia = df.groupby("procedencia").agg(
        locales=("local_cod", "count"),
        total_electores=("total_electores", "sum"),
        varones=("varones", "sum"),
        mujeres=("mujeres", "sum"),
        **{label: (label, "sum") for label, _, _ in EDAD_BUCKETS},
    ).reset_index()

    OUTPUT_REPORTES.mkdir(parents=True, exist_ok=True)
    with pd.ExcelWriter(OUT_PATH, engine="openpyxl") as writer:
        df_con_total.to_excel(writer, sheet_name="Por_Local", index=False)
        df_procedencia.to_excel(writer, sheet_name="Por_Procedencia", index=False)

    print(f"\n{len(df)} locales, {total} electores -> {OUT_PATH}")
    print(df.to_string(index=False))
    print(f"\nElectores con EDAD inválida (<18 o vacía): {edad_invalida}")

    generar_graficos(df, df_procedencia, OUTPUT_REPORTES / GRAFICOS_DIR_NAME)


if __name__ == "__main__":
    main()
