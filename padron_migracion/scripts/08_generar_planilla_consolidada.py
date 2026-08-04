"""Paso 8 (opcional): consolida todo el cruce en un único .xlsx descargable.

A diferencia de 07 (un archivo por local), este script arma un solo workbook:
- `Resumen_Global`: los mismos conteos de resumen_ejecutivo.md.
- `Indice_Por_Local`: matriz local x categoría con la cantidad de filas.
- Una hoja por local+categoría (`L<código>_<categoría>`), omitiendo las que
  quedan en 0 filas para ese local (el índice ya deja esas 0 a la vista).
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
OUT_PATH = OUTPUT_REPORTES / "padron_san_pedro_ycuamandyyu_consolidado.xlsx"

CASOS_DUPLICADO_CONOCIDOS = [
    "AMARAL GONZALEZ, ADRIANA SOLEDAD",
    "MOREL CABANA, MIRTA DIANA",
    "SANABRIA CHILAVERT, DIEGO ANTONIO",
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


def construir_resumen_global(r: dict[str, pd.DataFrame]) -> list[pd.DataFrame]:
    conteos = pd.DataFrame([{"categoria": nombre, "cantidad": len(df)} for nombre, df in r.items()])

    alta = r["alta_en_distrito"]
    sub_conteos = (
        alta["subcategoria"].value_counts().rename_axis("subcategoria_alta_en_distrito").reset_index(name="cantidad")
        if len(alta) else pd.DataFrame(columns=["subcategoria_alta_en_distrito", "cantidad"])
    )

    baja = r["baja_del_distrito"]
    causa_conteos = (
        baja["causa_probable"].value_counts().rename_axis("causa_probable_baja_del_distrito").reset_index(name="cantidad")
        if len(baja) else pd.DataFrame(columns=["causa_probable_baja_del_distrito", "cantidad"])
    )

    dup = r["duplicados_probables"]
    encontrados = set(dup["apellido_nombre_norm"]) if len(dup) else set()
    sanity = pd.DataFrame([
        {"caso_conocido": caso, "encontrado": caso in encontrados}
        for caso in CASOS_DUPLICADO_CONOCIDOS
    ])

    nota = pd.DataFrame({"nota": [
        "BASE: corte 31/07/2025 (20 PDF del TSJE). CONTRASTE: RCP2008 nacional, "
        "carpeta \"al 2025-12-30\" (fecha de corte real no confirmada en los datos, "
        "ver output/reportes/formato_sip.md para el detalle completo).",
        "ALTA_EN_DISTRITO se subclasifica por edad de forma heurística (sufijo _probable), no como hecho.",
        "causa_probable=DESCONOCIDA en BAJA_DEL_DISTRITO significa que no hay evidencia, no que no tenga causa.",
    ]})

    return [nota, conteos, sub_conteos, causa_conteos, sanity]


def main() -> None:
    r = cargar_resultados()
    catalogo = construir_catalogo_locales(r)
    locales = listar_locales(r)

    OUTPUT_REPORTES.mkdir(parents=True, exist_ok=True)
    print(f"Armando planilla consolidada para {len(locales)} locales...")

    resumen_bloques = construir_resumen_global(r)
    indice = construir_indice_por_local(r, locales, catalogo)

    with pd.ExcelWriter(OUT_PATH, engine="openpyxl") as writer:
        fila = 0
        for bloque in resumen_bloques:
            bloque.to_excel(writer, sheet_name="Resumen_Global", index=False, startrow=fila)
            fila += len(bloque) + 2

        indice.to_excel(writer, sheet_name="Indice_Por_Local", index=False)

        hojas_escritas = 0
        for local in locales:
            hojas = hojas_de_local(r, local)
            for nombre_categoria, df_hoja in hojas.items():
                if len(df_hoja) == 0:
                    continue
                nombre_hoja = f"L{local}_{ABREVIATURA[nombre_categoria]}"
                df_hoja.to_excel(writer, sheet_name=nombre_hoja, index=False)
                hojas_escritas += 1

    print(f"{len(locales)} locales, {hojas_escritas} hojas de detalle + Resumen_Global + Indice_Por_Local")
    print(f"Escrito en {OUT_PATH}")


if __name__ == "__main__":
    main()
