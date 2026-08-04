"""Lector de streaming para tablas .dbf (Visual FoxPro) dentro de un ZIP, sin extraer.

El RCP2008 del TSJE es un ZIP de ~500MB con tablas .dbf de hasta 1.3GB sin
comprimir. Este módulo lee cada entry directamente desde el ZIP con
zipfile.ZipFile.open() (streaming, decodificación incremental), sin volcar
nada a disco. Codificación confirmada por inspección: Windows-1252
(lang_driver=0x03).
"""
import struct
import zipfile
from typing import Callable, Iterator, Optional

from normalize import normalize_cedula

Field = tuple[str, str, int, int]  # (nombre, tipo, longitud, decimales)


def _read_field_descriptors(rest: bytes) -> list[Field]:
    fields: list[Field] = []
    pos = 0
    while pos < len(rest) and rest[pos] != 0x0D:
        fname = rest[pos:pos + 11].split(b"\x00")[0].decode("latin-1")
        ftype = chr(rest[pos + 11])
        flen = rest[pos + 16]
        fdec = rest[pos + 17]
        fields.append((fname, ftype, flen, fdec))
        pos += 32
    return fields


def find_entry(zf: zipfile.ZipFile, basename: str) -> str:
    """Encuentra el path completo dentro del zip para un nombre de archivo dado."""
    basename_lower = basename.lower()
    for name in zf.namelist():
        if name.lower().split("/")[-1] == basename_lower:
            return name
    raise FileNotFoundError(f"No se encontró '{basename}' dentro del zip")


def get_dbf_schema(zf: zipfile.ZipFile, entry_name: str) -> tuple[int, list[Field]]:
    """Devuelve (n_registros, campos) leyendo solo el header, sin recorrer filas."""
    with zf.open(entry_name) as f:
        header = f.read(32)
        n_records = struct.unpack("<I", header[4:8])[0]
        header_size = struct.unpack("<H", header[8:10])[0]
        rest = f.read(header_size - 32)
        return n_records, _read_field_descriptors(rest)


def iter_dbf_records(
    zf: zipfile.ZipFile, entry_name: str, encoding: str = "cp1252"
) -> Iterator[dict[str, str]]:
    """Yield-ea cada registro no borrado de un .dbf, leyendo el entry en streaming."""
    with zf.open(entry_name) as f:
        header = f.read(32)
        n_records = struct.unpack("<I", header[4:8])[0]
        header_size = struct.unpack("<H", header[8:10])[0]
        record_size = struct.unpack("<H", header[10:12])[0]
        rest = f.read(header_size - 32)
        fields = _read_field_descriptors(rest)

        for _ in range(n_records):
            rec = f.read(record_size)
            if len(rec) < record_size:
                break
            if rec[0:1] == b"*":
                continue  # registro marcado como borrado
            off = 1
            row: dict[str, str] = {}
            for fname, ftype, flen, _fdec in fields:
                raw = rec[off : off + flen]
                off += flen
                if ftype == "0":
                    continue  # bitmap de nulls de FoxPro, no es dato de negocio
                text = raw.decode(encoding, errors="replace")
                row[fname] = text.rstrip() if ftype == "C" else text.strip()
            yield row


def iter_dbf_filtered(
    zf: zipfile.ZipFile,
    entry_name: str,
    predicate: Callable[[dict[str, str]], bool],
    encoding: str = "cp1252",
) -> Iterator[dict[str, str]]:
    """Como iter_dbf_records, pero solo yield-ea filas que cumplen predicate."""
    for row in iter_dbf_records(zf, entry_name, encoding=encoding):
        if predicate(row):
            yield row


def iter_dbf_by_cedulas(
    zf: zipfile.ZipFile,
    entry_name: str,
    cedulas: set[str],
    cedula_field: str = "CEDULA",
    encoding: str = "cp1252",
) -> Iterator[dict[str, str]]:
    """Un solo pase de streaming, quedándose solo con filas cuya cédula está en el set objetivo."""
    if not cedulas:
        return
    for row in iter_dbf_records(zf, entry_name, encoding=encoding):
        if normalize_cedula(row.get(cedula_field, "")) in cedulas:
            yield row
