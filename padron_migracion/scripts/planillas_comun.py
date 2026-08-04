"""Lógica compartida para generar planillas .xlsx a partir de los resultados
del cruce (05_cruzar_padrones.py). Usado por 07 (un archivo por local) y por
08 (un solo archivo consolidado).
"""
import os
import pickle
import re
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
RUN_SUFFIX = os.environ.get("PADRON_RUN_SUFFIX", "")
CONTRASTE_LABEL = os.environ.get("PADRON_CONTRASTE_LABEL", "dic2025")
OUTPUT_EXTRACTED = ROOT / "output" / f"extracted{RUN_SUFFIX}"
COL_TIPO_INSCRIPCION_CONTRASTE = f"tipo_inscripcion_contraste_{CONTRASTE_LABEL}"
COL_TOTAL_ELECTORES_CONTRASTE = f"total_electores_contraste_{CONTRASTE_LABEL}"

NOTA_LOCAL_999 = (
    "Local 999 = \"SIN DESCRIPCION\" en el RCP nacional: no es un local físico real, "
    "probablemente cédulas sin local asignado o un código de error de carga del sistema."
)

CATEGORIAS = [
    "Sin_Cambio", "Cambio_Local_Salidas", "Cambio_Local_Llegadas",
    "Baja_Del_Distrito", "Emigracion_Confirmada", "Alta_En_Distrito",
    "Duplicados_Probables", "Cedulas_Repetidas", "Sin_Clasificar",
]


def slug(texto: str) -> str:
    texto = re.sub(r"[^\w\s-]", "", texto or "").strip().lower()
    return re.sub(r"[\s-]+", "_", texto)


def coalesce(row: pd.Series, *cols: str) -> str:
    for c in cols:
        v = row.get(c)
        if pd.notna(v) and str(v).strip():
            return str(v)
    return ""


def cargar_resultados() -> dict[str, pd.DataFrame]:
    pickle_path = OUTPUT_EXTRACTED / "_resultados_cruce.pkl"
    if not pickle_path.exists():
        raise FileNotFoundError(f"Falta {pickle_path} — corré primero 05_cruzar_padrones.py")
    with pickle_path.open("rb") as f:
        return pickle.load(f)


def construir_catalogo_locales(r: dict[str, pd.DataFrame]) -> dict[str, str]:
    """Local -> descripción, combinando todas las fuentes disponibles."""
    catalogo: dict[str, str] = {}

    def registrar(df: pd.DataFrame, col_cod: str, col_desc: str):
        if col_cod not in df.columns or col_desc not in df.columns:
            return
        for cod, desc in zip(df[col_cod], df[col_desc]):
            if pd.notna(cod) and str(cod).strip() and str(cod) not in catalogo:
                if pd.notna(desc) and str(desc).strip():
                    catalogo[str(cod)] = str(desc)

    for nombre in ["sin_cambio", "cambio_local_intradistrito", "baja_del_distrito", "emigracion_confirmada"]:
        registrar(r[nombre], "local_cod_base", "local_desc_base")
    for nombre in ["sin_cambio", "cambio_local_intradistrito", "alta_en_distrito"]:
        registrar(r[nombre], "local_cod_contraste", "local_desc_contraste")
    for nombre in ["duplicados_probables", "cedulas_repetidas"]:
        registrar(r[nombre], "local_cod", "local_desc")

    return catalogo


def listar_locales(r: dict[str, pd.DataFrame]) -> list[str]:
    locales_base = set(r["sin_cambio"]["local_cod_base"]) | set(r["cambio_local_intradistrito"]["local_cod_base"]) \
        | set(r["baja_del_distrito"]["local_cod_base"]) | set(r["emigracion_confirmada"]["local_cod_base"])
    locales_contraste = set(r["sin_cambio"]["local_cod_contraste"]) | set(r["cambio_local_intradistrito"]["local_cod_contraste"]) \
        | set(r["alta_en_distrito"]["local_cod_contraste"])
    locales_otros = set(r["duplicados_probables"]["local_cod"]) | set(r["cedulas_repetidas"]["local_cod"])
    return sorted(
        {str(l) for l in (locales_base | locales_contraste | locales_otros) if pd.notna(l) and str(l).strip()},
        key=lambda x: int(x),
    )


# --- Extractores: (dataframe, local relevante) -> filas formateadas para la planilla ---

def hoja_sin_cambio(df: pd.DataFrame, local: str) -> pd.DataFrame:
    sub = df[df["local_cod_base"] == local]
    return pd.DataFrame({
        "numero_ced": sub["numero_ced"],
        "apellido_nombre": sub["apellido_nombre_base"],
        "fecha_nacimiento": sub["fecha_nac_base"],
        "tipo_inscripcion_base_31jul2025": sub["tipo_inscripcion_base"],
        COL_TIPO_INSCRIPCION_CONTRASTE: sub["tipo_inscripcion_contraste"],
        "zona": sub["zona_cod_base"],
    })


def hoja_cambio_local_salidas(df: pd.DataFrame, local: str) -> pd.DataFrame:
    sub = df[df["local_cod_base"] == local]
    return pd.DataFrame({
        "numero_ced": sub["numero_ced"],
        "apellido_nombre": sub["apellido_nombre_base"],
        "fecha_nacimiento": sub["fecha_nac_base"],
        "destino_local_cod": sub["local_cod_contraste"],
        "destino_local_desc": sub["local_desc_contraste"],
        "destino_zona": sub["zona_cod_contraste"],
    })


def hoja_cambio_local_llegadas(df: pd.DataFrame, local: str) -> pd.DataFrame:
    sub = df[df["local_cod_contraste"] == local]
    return pd.DataFrame({
        "numero_ced": sub["numero_ced"],
        "apellido_nombre": sub["apellido_nombre_contraste"],
        "fecha_nacimiento": sub["fecha_nac_contraste"],
        "origen_local_cod": sub["local_cod_base"],
        "origen_local_desc": sub["local_desc_base"],
        "origen_zona": sub["zona_cod_base"],
    })


def hoja_baja(df: pd.DataFrame, local: str) -> pd.DataFrame:
    sub = df[df["local_cod_base"] == local]
    return pd.DataFrame({
        "numero_ced": sub["numero_ced"],
        "apellido_nombre": sub["apellido_nombre_base"],
        "fecha_nacimiento": sub["fecha_nac_base"],
        "tipo_inscripcion": sub["tipo_inscripcion_base"],
        "causa_probable": sub["causa_probable"],
        "fecha_defuncion": sub["fecha_defuncion"],
        "descripcion_estado": sub["descripcion_estado"],
    })


def hoja_emigracion(df: pd.DataFrame, local: str) -> pd.DataFrame:
    sub = df[df["local_cod_base"] == local]
    return pd.DataFrame({
        "numero_ced": sub["numero_ced"],
        "apellido_nombre": sub["apellido_nombre_base"],
        "fecha_nacimiento": sub["fecha_nac_base"],
        "destino_departamento": sub["destino_departamento_desc"],
        "destino_distrito": sub["destino_distrito_desc"],
    })


def hoja_alta(df: pd.DataFrame, local: str) -> pd.DataFrame:
    sub = df[df["local_cod_contraste"] == local]
    return pd.DataFrame({
        "numero_ced": sub["numero_ced"],
        "apellido_nombre": sub["apellido_nombre_contraste"],
        "fecha_nacimiento": sub["fecha_nac_contraste"],
        "tipo_inscripcion": sub["tipo_inscripcion_contraste"],
        "subcategoria_probable": sub["subcategoria"],
        "edad_al_corte_probable": sub["edad_al_corte_probable"].round(1),
    })


def hoja_duplicados(df: pd.DataFrame, local: str) -> pd.DataFrame:
    sub = df[df["local_cod"] == local]
    return pd.DataFrame({
        "numero_ced": sub["numero_ced"],
        "apellido_nombre": sub["apellido_nombre"],
        "fecha_nacimiento": sub["fecha_nac"],
        "corte": sub["corte"],
        "tipo_inscripcion": sub["tipo_inscripcion"],
    })


def hoja_cedulas_repetidas(df: pd.DataFrame, local: str) -> pd.DataFrame:
    sub = df[df["local_cod"] == local] if len(df) else df
    return pd.DataFrame({
        "numero_ced": sub["numero_ced"],
        "apellido_nombre": sub["apellido_nombre"],
        "fecha_nacimiento": sub["fecha_nac"],
        "corte": sub["corte"],
    })


def hoja_sin_clasificar(df: pd.DataFrame, local: str) -> pd.DataFrame:
    if not len(df):
        return pd.DataFrame(columns=["numero_ced", "apellido_nombre", "motivo_sin_clasificar", "corte"])
    local_col = df.apply(lambda row: coalesce(row, "local_cod", "local_cod_base", "local_cod_contraste"), axis=1)
    sub = df[local_col == local]
    return pd.DataFrame({
        "numero_ced": sub["numero_ced"],
        "apellido_nombre": sub.apply(lambda row: coalesce(row, "apellido_nombre", "apellido_nombre_base", "apellido_nombre_contraste"), axis=1),
        "motivo_sin_clasificar": sub.get("motivo_sin_clasificar", ""),
        "corte": sub.apply(lambda row: coalesce(row, "corte", "corte_base", "corte_contraste"), axis=1),
    })


def construir_indice_por_local(r: dict[str, pd.DataFrame], locales: list[str], catalogo: dict[str, str]) -> pd.DataFrame:
    """Matriz local x categoría, más los totales de electores reales por corte.

    "total_filas_todas_categorias" NO es un conteo de electores: suma filas de
    categorías que se solapan a propósito (p.ej. duplicados_probables marca
    filas que YA están contadas en sin_cambio/cambio_local/etc.) y mezcla
    BASE con CONTRASTE. Para el conteo real de electores por local, usar:
      - total_electores_base_31jul2025      = Sin_Cambio + Salidas + Baja + Emigracion
      - total_electores_contraste_dic2025   = Sin_Cambio + Llegadas + Alta
    """
    filas = []
    for local in locales:
        hojas = hojas_de_local(r, local)
        conteos = {nombre: len(df) for nombre, df in hojas.items()}
        fila = {"local_cod": local, "local_desc": catalogo.get(local, "(sin descripción)")}
        fila.update(conteos)
        fila["total_filas_todas_categorias"] = sum(conteos.values())
        fila["total_electores_base_31jul2025"] = (
            conteos["Sin_Cambio"] + conteos["Cambio_Local_Salidas"]
            + conteos["Baja_Del_Distrito"] + conteos["Emigracion_Confirmada"]
        )
        fila[COL_TOTAL_ELECTORES_CONTRASTE] = (
            conteos["Sin_Cambio"] + conteos["Cambio_Local_Llegadas"] + conteos["Alta_En_Distrito"]
        )
        filas.append(fila)
    return pd.DataFrame(filas)


def padron_actual_de_local(r: dict[str, pd.DataFrame], local: str) -> pd.DataFrame:
    """Lista de electores REALES de un local al corte CONTRASTE (dic/2025):
    Sin_Cambio + Cambio_Local_Llegadas + Alta_En_Distrito (ver
    construir_indice_por_local para la fórmula). tipo_inscripcion_base_31jul2025
    queda vacío para los de Alta_En_Distrito (no estaban en BASE)."""
    partes = []
    for nombre in ["sin_cambio", "cambio_local_intradistrito", "alta_en_distrito"]:
        df = r[nombre]
        sub = df[df["local_cod_contraste"] == local]
        partes.append(pd.DataFrame({
            "numero_ced": sub["numero_ced"],
            "apellido_nombre": sub["apellido_nombre_contraste"],
            "fecha_nacimiento": sub["fecha_nac_contraste"],
            "tipo_inscripcion_base_31jul2025": sub["tipo_inscripcion_base"].fillna(""),
            "tipo_inscripcion": sub["tipo_inscripcion_contraste"],
        }))
    resultado = pd.concat(partes, ignore_index=True)
    return resultado.sort_values("apellido_nombre", kind="stable").reset_index(drop=True)


def hojas_de_local(r: dict[str, pd.DataFrame], local: str) -> dict[str, pd.DataFrame]:
    """Las 9 hojas de categoría para un local dado, listas para volcar a Excel."""
    return {
        "Sin_Cambio": hoja_sin_cambio(r["sin_cambio"], local),
        "Cambio_Local_Salidas": hoja_cambio_local_salidas(r["cambio_local_intradistrito"], local),
        "Cambio_Local_Llegadas": hoja_cambio_local_llegadas(r["cambio_local_intradistrito"], local),
        "Baja_Del_Distrito": hoja_baja(r["baja_del_distrito"], local),
        "Emigracion_Confirmada": hoja_emigracion(r["emigracion_confirmada"], local),
        "Alta_En_Distrito": hoja_alta(r["alta_en_distrito"], local),
        "Duplicados_Probables": hoja_duplicados(r["duplicados_probables"], local),
        "Cedulas_Repetidas": hoja_cedulas_repetidas(r["cedulas_repetidas"], local),
        "Sin_Clasificar": hoja_sin_clasificar(r["sin_clasificar"], local),
    }
