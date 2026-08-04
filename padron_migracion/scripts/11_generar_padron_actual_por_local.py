"""Paso 11 (opcional): un .xlsx por local con el padrón REAL/ACTUAL de
electores al corte CONTRASTE (diciembre 2025) — no el cruce de migración,
sino la lista lisa y llana de quién vota en cada local hoy.

Columnas: numero_ced, apellido_nombre, fecha_nacimiento,
tipo_inscripcion_base_31jul2025 (vacío si la persona no estaba en el corte
BASE de julio), tipo_inscripcion (la vigente, del corte CONTRASTE).

Un local = Sin_Cambio + Cambio_Local_Llegadas + Alta_En_Distrito para ese
local (ver README, sección "Indice_Por_Local — cómo leer sus columnas").
"""
import os
from pathlib import Path

import pandas as pd

from planillas_comun import cargar_resultados, construir_catalogo_locales, listar_locales, padron_actual_de_local, slug

ROOT = Path(__file__).resolve().parent.parent
RUN_SUFFIX = os.environ.get("PADRON_RUN_SUFFIX", "")
CONTRASTE_LABEL = os.environ.get("PADRON_CONTRASTE_LABEL", "dic2025")
OUTPUT_PADRON_ACTUAL = ROOT / "output" / f"reportes{RUN_SUFFIX}" / "padron_actual_por_local"


def main() -> None:
    r = cargar_resultados()
    catalogo = construir_catalogo_locales(r)
    locales = listar_locales(r)

    OUTPUT_PADRON_ACTUAL.mkdir(parents=True, exist_ok=True)
    print(f"Generando el padrón actual ({CONTRASTE_LABEL}) de {len(locales)} locales en {OUTPUT_PADRON_ACTUAL}\n")

    total_general = 0
    for local in locales:
        desc = catalogo.get(local, "(sin descripción)")
        df = padron_actual_de_local(r, local)

        nombre_archivo = f"local_{int(local):03d}_{slug(desc)}.xlsx"
        out_path = OUTPUT_PADRON_ACTUAL / nombre_archivo
        with pd.ExcelWriter(out_path, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name=f"Padron_Actual_{CONTRASTE_LABEL.capitalize()}"[:31], index=False)

        total_general += len(df)
        print(f"  Local {local} ({desc}): {len(df)} electores -> {nombre_archivo}")

    print(f"\n{len(locales)} planillas, {total_general} electores en total")


if __name__ == "__main__":
    main()
