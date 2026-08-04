"""Paso 5: cruza BASE vs CONTRASTE (ambos ya normalizados, filtrados a San Pedro
de Ycuamandyyú) y clasifica cada elector según el spec.

Categorías: SIN_CAMBIO, CAMBIO_LOCAL_INTRADISTRITO, BAJA_DEL_DISTRITO (con
causa_probable si se puede inferir), EMIGRACION_CONFIRMADA_A_OTRO_DISTRITO,
ALTA_EN_DISTRITO (con subclasificación _probable por edad), DUPLICADO_PROBABLE,
CEDULA_REPETIDA, y sin_clasificar para lo que no se pueda evaluar.

IMPORTANTE: la fecha real de corte de CONTRASTE no está confirmada dentro de
los datos (ver formato_sip.md) — se usa CORTE_CONTRASTE_ASUMIDO solo para la
heurística de edad, dejándolo explícito en el nombre de la columna.
"""
import os
import zipfile
from pathlib import Path

import pandas as pd

from dbf_reader import find_entry, iter_dbf_by_cedulas, iter_dbf_records
from normalize import calc_edad, normalize_cedula

ROOT = Path(__file__).resolve().parent.parent
RUN_SUFFIX = os.environ.get("PADRON_RUN_SUFFIX", "")
CONTRASTE_LABEL = os.environ.get("PADRON_CONTRASTE_LABEL", "dic2025")
OUTPUT_EXTRACTED = ROOT / "output" / f"extracted{RUN_SUFFIX}"
INPUT_CONTRASTE = Path(os.environ.get("PADRON_CONTRASTE_DIR", str(ROOT / "input" / "contraste_dic2025")))

DEPART_SAN_PEDRO = "2"
DISTRITO_YCUAMANDYYU = "0"
CORTE_CONTRASTE_ASUMIDO = os.environ.get("PADRON_CORTE_FECHA", "2025-12-31")  # asumido, no confirmado en los datos

# Casos de prueba conocidos del spec — deben aparecer en duplicados_probables
# (formato "APELLIDO, NOMBRE" tal cual queda en apellido_nombre_norm)
CASOS_DUPLICADO_CONOCIDOS = [
    "AMARAL GONZALEZ, ADRIANA SOLEDAD",
    "MOREL CABANA, MIRTA DIANA",
    "SANABRIA CHILAVERT, DIEGO ANTONIO",
]


def find_rcp_zip() -> Path:
    zips = list(INPUT_CONTRASTE.glob("*.zip"))
    if len(zips) != 1:
        raise RuntimeError(f"Esperaba exactamente un .zip en {INPUT_CONTRASTE}, encontré {len(zips)}")
    return zips[0]


def cargar(nombre: str) -> pd.DataFrame:
    path = OUTPUT_EXTRACTED / nombre
    if not path.exists():
        raise FileNotFoundError(f"Falta {path} — corré primero 04_normalizar.py")
    return pd.read_csv(path, dtype=str, keep_default_na=False)


def separar_invalidos(df: pd.DataFrame, corte: str) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Separa filas con cédula vacía/inválida ('' o '0') — van a sin_clasificar."""
    invalidas = df[df["numero_ced"].isin(["", "0"])].copy()
    invalidas["motivo_sin_clasificar"] = "numero_ced vacío o inválido"
    invalidas["corte"] = corte
    validas = df[~df["numero_ced"].isin(["", "0"])].copy()
    return validas, invalidas


def separar_repetidas(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Separa cédulas que aparecen más de una vez dentro del mismo corte."""
    counts = df["numero_ced"].value_counts()
    repetidas_ced = set(counts[counts > 1].index)
    repetidas = df[df["numero_ced"].isin(repetidas_ced)].copy()
    unicas = df[~df["numero_ced"].isin(repetidas_ced)].copy()
    return unicas, repetidas


def detectar_duplicados_probables(df: pd.DataFrame, corte: str) -> pd.DataFrame:
    """Mismo apellido_nombre_norm + fecha_nac, cédulas DISTINTAS, dentro del mismo corte."""
    con_datos = df[(df["apellido_nombre_norm"] != "") & (df["fecha_nac"] != "")]
    grupos = con_datos.groupby(["apellido_nombre_norm", "fecha_nac"])["numero_ced"].nunique()
    claves_dup = grupos[grupos > 1].index
    if len(claves_dup) == 0:
        return con_datos.iloc[0:0].assign(corte=corte)
    mask = con_datos.set_index(["apellido_nombre_norm", "fecha_nac"]).index.isin(claves_dup)
    resultado = con_datos[mask].copy()
    resultado["corte"] = corte
    return resultado.sort_values(["apellido_nombre_norm", "fecha_nac"])


def main() -> None:
    base_raw = cargar("base_31jul2025_normalizado.csv")
    contraste_raw = cargar(f"contraste_{CONTRASTE_LABEL}_normalizado.csv")

    base_validas, base_invalidas = separar_invalidos(base_raw, "BASE")
    contraste_validas, contraste_invalidas = separar_invalidos(contraste_raw, "CONTRASTE")

    base_unicas, base_repetidas = separar_repetidas(base_validas)
    contraste_unicas, contraste_repetidas = separar_repetidas(contraste_validas)

    print(f"BASE: {len(base_raw)} filas -> {len(base_unicas)} válidas y únicas, "
          f"{len(base_repetidas)} en cédulas repetidas, {len(base_invalidas)} sin cédula válida")
    print(f"CONTRASTE: {len(contraste_raw)} filas -> {len(contraste_unicas)} válidas y únicas, "
          f"{len(contraste_repetidas)} en cédulas repetidas, {len(contraste_invalidas)} sin cédula válida")

    # --- Duplicados probables (dentro de cada corte, por separado) ---
    dup_base = detectar_duplicados_probables(base_unicas, "BASE")
    dup_contraste = detectar_duplicados_probables(contraste_unicas, "CONTRASTE")
    duplicados_probables = pd.concat([dup_base, dup_contraste], ignore_index=True)

    # --- Merge principal BASE vs CONTRASTE por cédula ---
    merged = base_unicas.merge(
        contraste_unicas, on="numero_ced", how="outer",
        suffixes=("_base", "_contraste"), indicator=True,
    )

    sin_cambio = merged[
        (merged["_merge"] == "both")
        & (merged["zona_cod_base"] == merged["zona_cod_contraste"])
        & (merged["local_cod_base"] == merged["local_cod_contraste"])
    ].copy()

    cambio_local = merged[
        (merged["_merge"] == "both")
        & ~((merged["zona_cod_base"] == merged["zona_cod_contraste"]) & (merged["local_cod_base"] == merged["local_cod_contraste"]))
    ].copy()

    baja_candidatos = merged[merged["_merge"] == "left_only"].copy()
    alta = merged[merged["_merge"] == "right_only"].copy()

    # --- ALTA_EN_DISTRITO: subclasificar por edad al corte CONTRASTE ---
    alta["edad_al_corte_probable"] = alta["fecha_nac_contraste"].apply(
        lambda f: calc_edad(f, CORTE_CONTRASTE_ASUMIDO) if f else None
    )
    def subcat_alta(edad):
        if edad is None:
            return "ALTA_SIN_FECHA_NAC"
        if 17.5 <= edad <= 18.5:
            return "ALTA_PROBABLE_18_ANOS"
        return "ALTA_PROBABLE_TRANSFERENCIA"
    alta["subcategoria"] = alta["edad_al_corte_probable"].apply(subcat_alta)

    # --- BAJA_DEL_DISTRITO: segundo pase nacional sobre regciv.dbf + inhabilitados.dbf ---
    cedulas_baja = set(baja_candidatos["numero_ced"])
    zip_path = find_rcp_zip()

    emigracion_rows = []
    baja_confirmada_rows = []

    with zipfile.ZipFile(zip_path) as zf:
        regciv_entry = find_entry(zf, "regciv.dbf")
        inhabilitados_entry = find_entry(zf, "inhabilitados.dbf")
        dep_entry = find_entry(zf, "dep.dbf")
        dis_entry = find_entry(zf, "dis.dbf")

        dep_desc_all = {r["DEPART"]: r["DESCRIP"] for r in iter_dbf_records(zf, dep_entry)}
        dis_desc_all = {
            (r["DEPART"], r["DISTRITO"]): r["DESCRIP"] for r in iter_dbf_records(zf, dis_entry)
        }

        print(f"\nBuscando {len(cedulas_baja)} cédulas de baja en el padrón nacional (streaming, puede tardar)...")
        encontradas_nacional: dict[str, dict] = {}
        for row in iter_dbf_by_cedulas(zf, regciv_entry, cedulas_baja):
            ced = normalize_cedula(row["CEDULA"])
            if (row["DEPART"], row["DISTRITO"]) == (DEPART_SAN_PEDRO, DISTRITO_YCUAMANDYYU):
                continue  # sigue en San Pedro Ycuamandyyú, no debería pasar (ya estaría en 'both'), se ignora
            encontradas_nacional[ced] = row

        cedulas_restantes = cedulas_baja - set(encontradas_nacional.keys())
        print(f"  {len(encontradas_nacional)} emigraron a otro distrito; buscando el resto "
              f"({len(cedulas_restantes)}) en inhabilitados.dbf...")

        fallecidos_o_inhabilitados: dict[str, dict] = {}
        for row in iter_dbf_by_cedulas(zf, inhabilitados_entry, cedulas_restantes):
            ced = normalize_cedula(row["CEDULA"])
            fallecidos_o_inhabilitados[ced] = row

    for _, base_row in baja_candidatos.iterrows():
        ced = base_row["numero_ced"]
        if ced in encontradas_nacional:
            destino = encontradas_nacional[ced]
            emigracion_rows.append({
                **base_row.to_dict(),
                "destino_departamento_cod": destino["DEPART"],
                "destino_departamento_desc": dep_desc_all.get(destino["DEPART"], ""),
                "destino_distrito_cod": destino["DISTRITO"],
                "destino_distrito_desc": dis_desc_all.get((destino["DEPART"], destino["DISTRITO"]), ""),
            })
        elif ced in fallecidos_o_inhabilitados:
            inhab = fallecidos_o_inhabilitados[ced]
            causa = "FALLECIDO" if inhab.get("FEC_DEFUNC", "").strip("0 ") else "INHABILITADO"
            baja_confirmada_rows.append({
                **base_row.to_dict(),
                "causa_probable": causa,
                "fecha_defuncion": inhab.get("FEC_DEFUNC", ""),
                "descripcion_estado": inhab.get("DESCRI_EST", ""),
            })
        else:
            baja_confirmada_rows.append({
                **base_row.to_dict(),
                "causa_probable": "DESCONOCIDA",
                "fecha_defuncion": "",
                "descripcion_estado": "",
            })

    emigracion_confirmada = pd.DataFrame(emigracion_rows)
    baja_del_distrito = pd.DataFrame(baja_confirmada_rows)

    # --- sin_clasificar: inválidos de ambos cortes, más ALTA sin fecha de nacimiento ---
    sin_clasificar = pd.concat([
        base_invalidas,
        contraste_invalidas,
        alta[alta["subcategoria"] == "ALTA_SIN_FECHA_NAC"].assign(
            motivo_sin_clasificar="ALTA_EN_DISTRITO sin fecha de nacimiento válida para subclasificar", corte="CONTRASTE"
        ),
    ], ignore_index=True)

    # Guardamos todo en un solo objeto de resultados para que 06_generar_reportes.py lo consuma
    import pickle
    resultados = {
        "sin_cambio": sin_cambio,
        "cambio_local_intradistrito": cambio_local,
        "baja_del_distrito": baja_del_distrito,
        "emigracion_confirmada": emigracion_confirmada,
        "alta_en_distrito": alta[alta["subcategoria"] != "ALTA_SIN_FECHA_NAC"],
        "duplicados_probables": duplicados_probables,
        "cedulas_repetidas": pd.concat([base_repetidas.assign(corte="BASE"), contraste_repetidas.assign(corte="CONTRASTE")], ignore_index=True),
        "sin_clasificar": sin_clasificar,
    }
    pickle_path = OUTPUT_EXTRACTED / "_resultados_cruce.pkl"
    with pickle_path.open("wb") as f:
        pickle.dump(resultados, f)

    print("\nResumen del cruce:")
    for nombre, df in resultados.items():
        print(f"  {nombre}: {len(df)} filas")

    # Sanity check de los 3 casos de duplicado conocidos
    encontrados = set(duplicados_probables["apellido_nombre_norm"]) if len(duplicados_probables) else set()
    print("\nVerificación de casos de duplicado conocidos:")
    for caso in CASOS_DUPLICADO_CONOCIDOS:
        estado = "OK, encontrado" if caso in encontrados else "NO encontrado"
        print(f"  {caso}: {estado}")

    print(f"\nResultados intermedios guardados en {pickle_path}")


if __name__ == "__main__":
    main()
