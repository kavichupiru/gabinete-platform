"""Total de electores habilitados y cantidad de mesas por local electoral,
San Pedro del Ycuamandyyú (DEPART=2, DISTRITO=0), corte CONTRASTE.

Lee regciv.dbf en streaming directamente desde el ZIP (sin extraer), igual
que 03_extraer_contraste.py / 10_electores_por_distrito.py, agregando por
LOCAL y por (LOCAL, MESA).

NOTA sobre afiliación a partido/movimiento: regciv.dbf (padrón general del
sistema consregciv.exe) no trae ningún campo de afiliación política — ver
esquema completo en formato_sip.md. El padrón paraguayo no es de inscripción
por partido; esa información, si existe, vive en un padrón de afiliados que
cada partido/movimiento presenta por separado al TSJE y no forma parte de
este ZIP. Este script NO produce ese desglose porque el dato no está
disponible en la fuente.
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
OUT_PATH = OUTPUT_REPORTES / f"electores_y_mesas_por_local_{CONTRASTE_LABEL}.xlsx"

DEPART_SAN_PEDRO = "2"
DISTRITO_YCUAMANDYYU = "0"


def find_rcp_zip() -> Path:
    zips = list(INPUT_CONTRASTE.glob("*.zip"))
    if len(zips) != 1:
        raise RuntimeError(f"Esperaba exactamente un .zip en {INPUT_CONTRASTE}, encontré {len(zips)}")
    return zips[0]


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

        electores_por_local = Counter()
        mesas_por_local: dict[str, set[str]] = {}
        electores_por_mesa = Counter()  # (local, mesa) -> cantidad
        total = 0

        print("Leyendo regciv.dbf en streaming desde el zip (puede tardar unos minutos)...")
        for row in iter_dbf_filtered(zf, regciv_entry, es_san_pedro_ycuamandyyu):
            local = row["LOCAL"]
            mesa = row["MESA"]
            electores_por_local[local] += 1
            mesas_por_local.setdefault(local, set()).add(mesa)
            electores_por_mesa[(local, mesa)] += 1
            total += 1
            if total % 5000 == 0:
                print(f"  ...{total} electores encontrados")

    # Hoja 1: resumen por local
    filas_local = []
    for local, cantidad in electores_por_local.items():
        filas_local.append({
            "local_cod": local,
            "local_desc": locales_desc.get(local, "(sin descripción)"),
            "total_electores_habilitados": cantidad,
            "cantidad_mesas": len(mesas_por_local[local]),
        })
    df_local = pd.DataFrame(filas_local).sort_values("local_cod", key=lambda s: s.astype(int)).reset_index(drop=True)

    fila_total = pd.DataFrame([{
        "local_cod": "",
        "local_desc": "TOTAL DISTRITO",
        "total_electores_habilitados": df_local["total_electores_habilitados"].sum(),
        "cantidad_mesas": df_local["cantidad_mesas"].sum(),
    }])
    df_local_con_total = pd.concat([df_local, fila_total], ignore_index=True)

    # Hoja 2: detalle por mesa
    filas_mesa = []
    for (local, mesa), cantidad in electores_por_mesa.items():
        filas_mesa.append({
            "local_cod": local,
            "local_desc": locales_desc.get(local, "(sin descripción)"),
            "mesa": mesa,
            "electores_habilitados": cantidad,
        })
    df_mesa = pd.DataFrame(filas_mesa).sort_values(
        ["local_cod", "mesa"], key=lambda s: s.astype(int)
    ).reset_index(drop=True)

    OUTPUT_REPORTES.mkdir(parents=True, exist_ok=True)
    with pd.ExcelWriter(OUT_PATH, engine="openpyxl") as writer:
        df_local_con_total.to_excel(writer, sheet_name="Resumen_Por_Local", index=False)
        df_mesa.to_excel(writer, sheet_name="Detalle_Por_Mesa", index=False)

    print(f"\n{len(df_local)} locales, {df_mesa.shape[0]} mesas, {total} electores -> {OUT_PATH}")
    for _, r in df_local.iterrows():
        print(f"  local {r['local_cod']:>3} {r['local_desc']:<38} {r['total_electores_habilitados']:>6} electores  {r['cantidad_mesas']:>3} mesas")

    print(
        "\nNOTA: no se incluye desglose por afiliación a partido/movimiento — "
        "regciv.dbf no trae ese campo (ver formato_sip.md); el padrón general "
        "no registra afiliación política."
    )


if __name__ == "__main__":
    main()
