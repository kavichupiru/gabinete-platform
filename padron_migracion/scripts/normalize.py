"""Normalización compartida por todos los scripts del pipeline (cédula, nombre, fechas)."""
import re
import unicodedata
from datetime import date, datetime
from typing import Optional


def normalize_cedula(raw: str) -> str:
    """Deja solo dígitos y quita ceros a la izquierda. Cadena vacía si no hay dígitos."""
    digits = re.sub(r"\D", "", raw or "")
    stripped = digits.lstrip("0")
    if stripped:
        return stripped
    return "0" if digits else ""  # todo-ceros ("00000000") es inválido, no vacío


def normalize_name(raw: str) -> str:
    """Mayúsculas, sin tildes, espacios colapsados — para matches de nombre+fecha."""
    if not raw:
        return ""
    nfkd = unicodedata.normalize("NFKD", raw)
    sin_tildes = "".join(c for c in nfkd if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", sin_tildes.upper()).strip()


def parse_date_ddmmyyyy(raw: str) -> Optional[str]:
    """Fechas paraguayas D/M/YYYY (como en los PDF del TSJE) a ISO YYYY-MM-DD."""
    if not raw or not raw.strip():
        return None
    try:
        d, m, y = raw.strip().split("/")
        return date(int(y), int(m), int(d)).isoformat()
    except (ValueError, AttributeError):
        return None


def parse_date_yyyymmdd(raw: str) -> Optional[str]:
    """Fechas de campos tipo D en .dbf FoxPro, formato YYYYMMDD sin separadores."""
    if not raw or not raw.strip() or raw.strip() == "0" * len(raw.strip()):
        return None
    raw = raw.strip()
    if len(raw) != 8:
        return None
    try:
        return date(int(raw[0:4]), int(raw[4:6]), int(raw[6:8])).isoformat()
    except ValueError:
        return None


def calc_edad(fecha_nac_iso: Optional[str], corte_iso: str) -> Optional[float]:
    """Edad en años (con fracción) a la fecha de corte dada."""
    if not fecha_nac_iso:
        return None
    nac = datetime.fromisoformat(fecha_nac_iso).date()
    corte = datetime.fromisoformat(corte_iso).date()
    return (corte - nac).days / 365.25
