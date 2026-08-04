"""Paso 6: vuelca los resultados del cruce a CSV + resumen_ejecutivo.md."""
import os
import pickle
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
RUN_SUFFIX = os.environ.get("PADRON_RUN_SUFFIX", "")
OUTPUT_EXTRACTED = ROOT / "output" / f"extracted{RUN_SUFFIX}"
OUTPUT_REPORTES = ROOT / "output" / f"reportes{RUN_SUFFIX}"
CONTRASTE_DESC = os.environ.get(
    "PADRON_CONTRASTE_DESC",
    "RCP2008 nacional, carpeta \"al 2025-12-30\" (fecha de corte real no confirmada dentro de los datos — ver `formato_sip.md`)",
)
CORTE_CONTRASTE_ASUMIDO = os.environ.get("PADRON_CORTE_FECHA", "2025-12-31")

CASOS_DUPLICADO_CONOCIDOS = [
    "AMARAL GONZALEZ, ADRIANA SOLEDAD",
    "MOREL CABANA, MIRTA DIANA",
    "SANABRIA CHILAVERT, DIEGO ANTONIO",
]

ARCHIVOS = {
    "sin_cambio": "sin_cambio.csv",
    "cambio_local_intradistrito": "cambio_local_intradistrito.csv",
    "baja_del_distrito": "baja_del_distrito.csv",
    "emigracion_confirmada": "emigracion_confirmada.csv",
    "alta_en_distrito": "alta_en_distrito.csv",
    "duplicados_probables": "duplicados_probables.csv",
    "cedulas_repetidas": "cedulas_repetidas.csv",
    "sin_clasificar": "sin_clasificar.csv",
}


def main() -> None:
    pickle_path = OUTPUT_EXTRACTED / "_resultados_cruce.pkl"
    if not pickle_path.exists():
        raise FileNotFoundError(f"Falta {pickle_path} — corré primero 05_cruzar_padrones.py")

    with pickle_path.open("rb") as f:
        resultados: dict[str, pd.DataFrame] = pickle.load(f)

    OUTPUT_REPORTES.mkdir(parents=True, exist_ok=True)
    conteos = {}
    for nombre, archivo in ARCHIVOS.items():
        df = resultados[nombre].drop(columns=["_merge"], errors="ignore")
        out_path = OUTPUT_REPORTES / archivo
        df.to_csv(out_path, index=False, encoding="utf-8")
        conteos[nombre] = len(df)
        print(f"{nombre}: {len(df)} filas -> {out_path}")

    # Subcategorías de alta_en_distrito
    alta = resultados["alta_en_distrito"]
    sub_conteos = alta["subcategoria"].value_counts().to_dict() if len(alta) else {}

    # Verificación de duplicados conocidos
    dup = resultados["duplicados_probables"]
    encontrados = set(dup["apellido_nombre_norm"]) if len(dup) else set()

    lineas = []
    lineas.append("# Resumen ejecutivo — Cruce de padrones TSJE, San Pedro de Ycuamandyyú\n")
    lineas.append(f"BASE: corte 31/07/2025 (20 PDF del TSJE). "
                   f"CONTRASTE: {CONTRASTE_DESC}.\n")

    lineas.append("## Conteo por categoría\n")
    lineas.append("| Categoría | Cantidad |")
    lineas.append("|---|---|")
    for nombre, cantidad in conteos.items():
        lineas.append(f"| {nombre} | {cantidad} |")
    lineas.append("")

    if sub_conteos:
        lineas.append("### Subcategorías de ALTA_EN_DISTRITO (heurística por edad, no certeza)\n")
        lineas.append("| Subcategoría | Cantidad |")
        lineas.append("|---|---|")
        for sub, cantidad in sub_conteos.items():
            lineas.append(f"| {sub} | {cantidad} |")
        lineas.append("")

    if len(resultados["baja_del_distrito"]):
        causa_conteos = resultados["baja_del_distrito"]["causa_probable"].value_counts().to_dict()
        lineas.append("### Causa probable de BAJA_DEL_DISTRITO (solo cuando hay evidencia directa)\n")
        lineas.append("| Causa probable | Cantidad |")
        lineas.append("|---|---|")
        for causa, cantidad in causa_conteos.items():
            lineas.append(f"| {causa} | {cantidad} |")
        lineas.append("")

    lineas.append("## Verificación: casos de duplicado ya conocidos (sanity check)\n")
    for caso in CASOS_DUPLICADO_CONOCIDOS:
        estado = "✅ encontrado" if caso in encontrados else "❌ NO encontrado — revisar"
        lineas.append(f"- {caso}: {estado}")
    lineas.append("")

    lineas.append("## Filas sin clasificar\n")
    n_sc = conteos.get("sin_clasificar", 0)
    lineas.append(f"{n_sc} filas no se pudieron clasificar (cédula vacía/inválida, fecha de "
                   f"nacimiento inválida, u otro problema de datos). Ver `sin_clasificar.csv` "
                   f"— nunca se descartan en silencio.\n")

    lineas.append("## Limitaciones documentadas\n")
    lineas.append(
        "- **Fecha de corte real de CONTRASTE no confirmada.** El header interno de "
        "`regciv.dbf` refleja la fecha de reindexado del sistema, no necesariamente la "
        f"fecha de corte de los datos. Se asumió {CORTE_CONTRASTE_ASUMIDO} (del nombre de "
        "carpeta/archivo del RCP) solo para la heurística de edad de `ALTA_EN_DISTRITO` "
        "— es un supuesto, no un hecho verificado."
    )
    lineas.append(
        "- **La subclasificación de ALTA_EN_DISTRITO por edad (17.5–18.5 años vs. "
        "transferencia) es una heurística probabilística**, reflejada en el sufijo "
        "`_probable`, nunca afirmada como hecho."
    )
    lineas.append(
        "- **`causa_probable=DESCONOCIDA` en BAJA_DEL_DISTRITO** significa que la cédula "
        "no aparece en ningún distrito del padrón nacional activo ni en `inhabilitados.dbf` "
        "— no se inventa una causa; puede deberse a depuración administrativa u otras "
        "razones no visibles en estos datos."
    )
    lineas.append(
        "- Los locales 508, 509 y 999 (\"sin descripción\") existen en el RCP nacional "
        "pero no estaban en los PDF de BASE entregados — no se puede evaluar migración "
        "hacia/desde ellos en el corte BASE."
    )

    out_path = OUTPUT_REPORTES / "resumen_ejecutivo.md"
    out_path.write_text("\n".join(lineas), encoding="utf-8")
    print(f"\nResumen ejecutivo escrito en {out_path}")


if __name__ == "__main__":
    main()
