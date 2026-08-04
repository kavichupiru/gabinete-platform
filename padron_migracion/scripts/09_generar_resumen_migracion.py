"""Paso 9 (opcional): un único resumen_migracion.xlsx con TODO en un solo
archivo — los CSV de output/reportes/ (una hoja por categoría, con los datos
completos) más el desglose por local de votación (planillas_por_local/).

Hojas, en orden:
  1. Resumen               — conteo por categoría (igual a resumen_ejecutivo.md)
  2. <categoria>            — una por cada CSV de output/reportes/, datos completos
  3. Indice_Por_Local       — matriz local x categoría
  4. L<código>_<categoría>  — una por cada combinación local+categoría con datos

No modifica los CSV originales — el xlsx es un archivo nuevo aparte.
"""
import os
from pathlib import Path

import pandas as pd

from planillas_comun import (
    cargar_resultados, construir_catalogo_locales, construir_indice_por_local,
    hojas_de_local, listar_locales,
)

ROOT = Path(__file__).resolve().parent.parent
RUN_SUFFIX = os.environ.get("PADRON_RUN_SUFFIX", "")
OUTPUT_REPORTES = ROOT / "output" / f"reportes{RUN_SUFFIX}"
OUT_PATH = OUTPUT_REPORTES / "resumen_migracion.xlsx"

# Orden preferido (el de las categorías del spec); cualquier otro CSV que
# aparezca en output/reportes/ se agrega al final, alfabéticamente.
ORDEN_CATEGORIAS = [
    "sin_cambio", "cambio_local_intradistrito", "baja_del_distrito",
    "emigracion_confirmada", "alta_en_distrito", "duplicados_probables",
    "cedulas_repetidas", "sin_clasificar",
]

# Nombre de hoja Excel: máx. 31 caracteres, sin : \ / ? * [ ]
ABREVIATURA = {
    "Sin_Cambio": "SinCambio",
    "Cambio_Local_Salidas": "CambioSal",
    "Cambio_Local_Llegadas": "CambioLleg",
    "Baja_Del_Distrito": "Baja",
    "Emigracion_Confirmada": "Emigracion",
    "Alta_En_Distrito": "Alta",
    "Duplicados_Probables": "Duplicados",
    "Cedulas_Repetidas": "CedRepetidas",
    "Sin_Clasificar": "SinClasificar",
}


def listar_csv_en_orden() -> list[Path]:
    csvs = {p.stem: p for p in OUTPUT_REPORTES.glob("*.csv")}
    ordenados = [csvs.pop(nombre) for nombre in ORDEN_CATEGORIAS if nombre in csvs]
    ordenados.extend(csvs[nombre] for nombre in sorted(csvs))
    return ordenados


def main() -> None:
    csv_paths = listar_csv_en_orden()
    if not csv_paths:
        raise FileNotFoundError(f"No hay CSV en {OUTPUT_REPORTES} — corré primero 06_generar_reportes.py")

    conteos = []
    dataframes: dict[str, pd.DataFrame] = {}
    for path in csv_paths:
        df = pd.read_csv(path, dtype=str, keep_default_na=False)
        dataframes[path.stem] = df
        conteos.append({"categoria": path.stem, "cantidad": len(df)})
    resumen = pd.DataFrame(conteos)

    # --- Desglose por local (mismos datos que planillas_por_local/) ---
    r = cargar_resultados()
    locales = listar_locales(r)
    catalogo = construir_catalogo_locales(r)

    hojas_por_local = {local: hojas_de_local(r, local) for local in locales}
    indice = construir_indice_por_local(r, locales, catalogo)

    with pd.ExcelWriter(OUT_PATH, engine="openpyxl") as writer:
        resumen.to_excel(writer, sheet_name="Resumen", index=False)
        for nombre, df in dataframes.items():
            df.to_excel(writer, sheet_name=nombre[:31], index=False)

        indice.to_excel(writer, sheet_name="Indice_Por_Local", index=False)

        hojas_local_escritas = 0
        for local, hojas in hojas_por_local.items():
            for nombre_categoria, df_hoja in hojas.items():
                if len(df_hoja) == 0:
                    continue
                nombre_hoja = f"L{local}_{ABREVIATURA[nombre_categoria]}"
                df_hoja.to_excel(writer, sheet_name=nombre_hoja, index=False)
                hojas_local_escritas += 1

    print(f"{len(dataframes)} hojas de categoría + Resumen + Indice_Por_Local + "
          f"{hojas_local_escritas} hojas por local -> {OUT_PATH}")
    for fila in conteos:
        print(f"  {fila['categoria']}: {fila['cantidad']} filas")


if __name__ == "__main__":
    main()
