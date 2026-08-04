"""Total de electores por distrito del departamento de San Pedro (DEPART=2),
corte CONTRASTE (RCP2008 nacional, carpeta "al 2025-12-30").

Lee regciv.dbf en streaming directamente desde el ZIP (sin extraer), igual
que 03_extraer_contraste.py, pero sin filtrar por distrito — cuenta todos
los distritos del departamento, no solo San Pedro del Ycuamandyyú.
"""
import os
import zipfile
from collections import Counter
from pathlib import Path

import pandas as pd

from dbf_reader import find_entry, iter_dbf_filtered, iter_dbf_records

ROOT = Path(__file__).resolve().parent.parent
RUN_SUFFIX = os.environ.get("PADRON_RUN_SUFFIX", "")
CONTRASTE_LABEL = os.environ.get("PADRON_CONTRASTE_LABEL", "dic2025")
INPUT_CONTRASTE = Path(os.environ.get("PADRON_CONTRASTE_DIR", str(ROOT / "input" / "contraste_dic2025")))
OUTPUT_REPORTES = ROOT / "output" / f"reportes{RUN_SUFFIX}"
OUT_PATH = OUTPUT_REPORTES / f"electores_por_distrito_sanpedro_{CONTRASTE_LABEL}.xlsx"

DEPART_SAN_PEDRO = "2"


def find_rcp_zip() -> Path:
    zips = list(INPUT_CONTRASTE.glob("*.zip"))
    if len(zips) != 1:
        raise RuntimeError(f"Esperaba exactamente un .zip en {INPUT_CONTRASTE}, encontré {len(zips)}")
    return zips[0]


def main() -> None:
    zip_path = find_rcp_zip()

    with zipfile.ZipFile(zip_path) as zf:
        regciv_entry = find_entry(zf, "regciv.dbf")
        dep_entry = find_entry(zf, "dep.dbf")
        dis_entry = find_entry(zf, "dis.dbf")

        dep_desc = next(
            r["DESCRIP"] for r in iter_dbf_records(zf, dep_entry) if r["DEPART"] == DEPART_SAN_PEDRO
        )
        distritos_desc = {
            r["DISTRITO"]: r["DESCRIP"]
            for r in iter_dbf_records(zf, dis_entry) if r["DEPART"] == DEPART_SAN_PEDRO
        }

        print(f"Departamento {DEPART_SAN_PEDRO} - {dep_desc}: {len(distritos_desc)} distritos registrados en dis.dbf")
        print("Leyendo regciv.dbf en streaming desde el zip (puede tardar unos minutos)...")

        conteo = Counter()
        total_leidos = 0
        for row in iter_dbf_filtered(zf, regciv_entry, lambda r: r["DEPART"] == DEPART_SAN_PEDRO):
            conteo[row["DISTRITO"]] += 1
            total_leidos += 1
            if total_leidos % 20000 == 0:
                print(f"  ...{total_leidos} electores del departamento contados")

    filas = []
    for cod, cantidad in conteo.items():
        filas.append({
            "departamento_cod": DEPART_SAN_PEDRO,
            "departamento_desc": dep_desc,
            "distrito_cod": cod,
            "distrito_desc": distritos_desc.get(cod, "(no encontrado en dis.dbf)"),
            "total_electores": cantidad,
        })

    df = pd.DataFrame(filas).sort_values("total_electores", ascending=False).reset_index(drop=True)

    total_departamento = df["total_electores"].sum()
    fila_total = pd.DataFrame([{
        "departamento_cod": DEPART_SAN_PEDRO,
        "departamento_desc": dep_desc,
        "distrito_cod": "",
        "distrito_desc": "TOTAL DEPARTAMENTO",
        "total_electores": total_departamento,
    }])
    df_con_total = pd.concat([df, fila_total], ignore_index=True)

    OUTPUT_REPORTES.mkdir(parents=True, exist_ok=True)
    with pd.ExcelWriter(OUT_PATH, engine="openpyxl") as writer:
        df_con_total.to_excel(writer, sheet_name="Electores_Por_Distrito", index=False)

    print(f"\n{len(df)} distritos, {total_departamento} electores en total -> {OUT_PATH}")
    for _, r in df.iterrows():
        print(f"  {r['distrito_cod']:>3} {r['distrito_desc']:<28} {r['total_electores']:>7}")

    distritos_sin_datos = set(distritos_desc) - set(conteo)
    if distritos_sin_datos:
        print(f"\nADVERTENCIA: distritos en dis.dbf sin ningún elector encontrado en regciv.dbf: "
              f"{[(d, distritos_desc[d]) for d in distritos_sin_datos]}")


if __name__ == "__main__":
    main()
