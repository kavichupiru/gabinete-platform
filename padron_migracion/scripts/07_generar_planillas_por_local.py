"""Paso 7 (opcional): genera una planilla .xlsx por local de votación, con una
pestaña por categoría, a partir de los resultados ya calculados por
05_cruzar_padrones.py.

CAMBIO_LOCAL_INTRADISTRITO es la única categoría que involucra dos locales
(origen y destino): cada elector aparece en la pestaña "Cambio_Local_Salidas"
del local de origen y en "Cambio_Local_Llegadas" del local de destino.
"""
import os
from pathlib import Path

import pandas as pd

from planillas_comun import (
    NOTA_LOCAL_999, cargar_resultados, construir_catalogo_locales,
    hojas_de_local, listar_locales, slug,
)

ROOT = Path(__file__).resolve().parent.parent
RUN_SUFFIX = os.environ.get("PADRON_RUN_SUFFIX", "")
OUTPUT_PLANILLAS = ROOT / "output" / f"reportes{RUN_SUFFIX}" / "planillas_por_local"


def main() -> None:
    r = cargar_resultados()
    catalogo = construir_catalogo_locales(r)
    todos_los_locales = listar_locales(r)

    OUTPUT_PLANILLAS.mkdir(parents=True, exist_ok=True)
    print(f"Generando {len(todos_los_locales)} planillas en {OUTPUT_PLANILLAS}\n")

    for local in todos_los_locales:
        desc = catalogo.get(local, "(sin descripción)")
        hojas = hojas_de_local(r, local)

        resumen = pd.DataFrame([{"categoria": nombre, "cantidad": len(df)} for nombre, df in hojas.items()])
        notas = [f"Local {local} - {desc}"]
        if local == "999":
            notas.append(NOTA_LOCAL_999)

        nombre_archivo = f"local_{int(local):03d}_{slug(desc)}.xlsx"
        out_path = OUTPUT_PLANILLAS / nombre_archivo

        with pd.ExcelWriter(out_path, engine="openpyxl") as writer:
            pd.DataFrame({"nota": notas}).to_excel(writer, sheet_name="Resumen", index=False, startrow=0)
            resumen.to_excel(writer, sheet_name="Resumen", index=False, startrow=len(notas) + 2)
            for nombre_hoja, df_hoja in hojas.items():
                df_hoja.to_excel(writer, sheet_name=nombre_hoja, index=False)

        total_filas = sum(len(df) for df in hojas.values())
        print(f"  Local {local} ({desc}): {total_filas} filas en total -> {nombre_archivo}")

    print(f"\n{len(todos_los_locales)} planillas escritas en {OUTPUT_PLANILLAS}")


if __name__ == "__main__":
    main()
