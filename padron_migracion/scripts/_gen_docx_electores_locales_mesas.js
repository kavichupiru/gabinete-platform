// Reporte ejecutivo: total de electores habilitados, locales electorales y mesas
// por local, corte definitivo oct/2026. Datos de 12_electores_y_mesas_por_local.py.
const fs = require("fs");
const path = require("path");
const { Document, Packer, AlignmentType } = require("docx");
const {
  COLOR_MUTED, COLOR_WARN, NUMBERING_CONFIG,
  countTable, hr, h1, body, bullet, noteBox, letterPageSection, brandHeader,
} = require("./_docx_common");

const OUT = path.resolve(
  __dirname, "..", "output", "reportes_definitivo_oct2026",
  "electores_habilitados_locales_y_mesas.docx"
);

const R = AlignmentType.RIGHT;

const LOCALES = [
  ["1", "Col. Nac. de San Pedro", "3.825", "11"],
  ["2", "Centro Formación Docente", "9.733", "28"],
  ["3", "Esc. Básica Nro 4118 San Rafael", "801", "3"],
  ["501", "Esc. de Naranjaty Nro. 1688", "1.487", "4"],
  ["502", "Esc. de la Col. Barbero Nro. 2265", "4.734", "14"],
  ["503", "Esc. Grda. 506 de Correa Rugua", "2.251", "7"],
  ["504", "Esc. Grda. de Pto. Yvapobo", "1.020", "3"],
  ["505", "Esc. de la Cpñia. San Juan", "830", "3"],
  ["506", "Escuela Nº 2282 Ntra. Sra. de Guadalupe", "727", "2"],
  ["507", "Esc. Básica Nro 1689 Piri Pucu", "247", "1"],
  ["508", "Escuela Básica N° 4962 San Rafael", "160", "1"],
  ["509", "Col. Nac. Dr. Andrés Barbero", "106", "1"],
];

const doc = new Document({
  numbering: { config: NUMBERING_CONFIG },
  sections: [
    letterPageSection([
      ...brandHeader(
        "Electores habilitados, locales y mesas",
        "San Pedro del Ycuamandyyú — corte definitivo oct/2026",
        "Departamento 2 – San Pedro  ·  Distrito 0 – San Pedro del Ycuamandyyú  ·  Fuente: regciv.dbf (RCP2008, consregciv.exe)"
      ),

      h1("Afiliación a partido / movimiento"),
      noteBox([
        { text: "No disponible en esta fuente.", bold: true, color: COLOR_WARN },
        {
          text: "regciv.dbf (el padrón general del sistema consregciv.exe, ver esquema completo en formato_sip.md) no trae ningún campo de afiliación política. El padrón paraguayo no es de inscripción por partido: esa información, si se necesita, vive en un padrón de afiliados que cada partido o movimiento presenta por separado al TSJE, y no forma parte de este archivo. No se puede generar ese desglose sin esa fuente adicional.",
        },
      ]),

      h1("Total de electores habilitados"),
      body(
        "25.921 electores habilitados en el distrito (corte definitivo oct/2026) — coincide exacto con el total ya validado del corte CONTRASTE en el reporte de verificación del pipeline."
      ),

      h1("Electores y mesas por local electoral"),
      countTable(
        ["Local", "Descripción", "Electores", "Mesas"],
        LOCALES.map(([cod, desc, el, mesas]) => [
          { text: cod },
          { text: desc },
          { text: el, opts: { align: R } },
          { text: mesas, opts: { align: R } },
        ]).concat([[
          { text: "", opts: { bold: true } },
          { text: "TOTAL DISTRITO", opts: { bold: true } },
          { text: "25.921", opts: { align: R, bold: true } },
          { text: "78", opts: { align: R, bold: true } },
        ]]),
        [900, 5100, 1900, 1360]
      ),
      body(
        "Los locales 508 y 509 no estaban en los 20 PDF del corte BASE (jul/2025) entregados por el TSJE — existen en el padrón nacional pero no se pudo evaluar migración hacia/desde ellos en ese corte (ver formato_sip.md).",
        { italics: true, color: COLOR_MUTED }
      ),

      hr(),
      body(
        "Datos generados en streaming desde regciv.dbf (dentro del ZIP del RCP2008, sin extraer) agregando por LOCAL y por (LOCAL, MESA); detalle elector-por-mesa disponible en electores_y_mesas_por_local_oct2026_definitivo.xlsx (hoja Detalle_Por_Mesa).",
        { italics: true, color: COLOR_MUTED }
      ),
    ]),
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("Escrito:", OUT);
});
