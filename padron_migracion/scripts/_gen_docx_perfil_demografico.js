// Reporte ejecutivo: perfil demográfico por local de votación (sexo, edad,
// procedencia), corte definitivo oct/2026. Datos de 13_perfil_demografico_por_local.py.
const fs = require("fs");
const path = require("path");
const { Document, Packer, Paragraph, ImageRun, AlignmentType } = require("docx");
const {
  COLOR_MUTED, COLOR_GOOD, COLOR_WARN, NUMBERING_CONFIG,
  countTable, hr, h1, h2, body, bullet, noteBox, letterPageSection, brandHeader,
} = require("./_docx_common");

const REPORTES = path.resolve(__dirname, "..", "output", "reportes_definitivo_oct2026");
const GRAFICOS = path.join(REPORTES, "graficos_perfil_demografico");
const OUT = path.join(REPORTES, "perfil_demografico_por_local.docx");

const R = AlignmentType.RIGHT;

function img(nombre, widthPx, heightPx) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 240 },
    children: [
      new ImageRun({
        type: "png",
        data: fs.readFileSync(path.join(GRAFICOS, nombre)),
        transformation: { width: widthPx, height: heightPx },
      }),
    ],
  });
}

const LOCALES = [
  ["1", "Col. Nac. de San Pedro", "URBANO", "3.825", "1.962", "1.863", "707", "267", "270", "815", "1.766"],
  ["2", "Centro Formación Docente", "URBANO", "9.733", "4.786", "4.947", "2.969", "2.646", "2.232", "889", "997"],
  ["3", "Esc. Básica Nro 4118 San Rafael", "URBANO", "801", "392", "409", "540", "94", "87", "43", "37"],
  ["501", "Esc. de Naranjaty Nro. 1688", "RURAL", "1.487", "803", "684", "316", "234", "278", "219", "440"],
  ["502", "Esc. de la Col. Barbero Nro. 2265", "RURAL", "4.734", "2.613", "2.121", "1.518", "925", "841", "541", "909"],
  ["503", "Esc. Grda. 506 de Correa Rugua", "RURAL", "2.251", "1.187", "1.064", "615", "391", "427", "296", "522"],
  ["504", "Esc. Grda. de Pto. Yvapobo", "RURAL", "1.020", "527", "493", "363", "187", "166", "136", "168"],
  ["505", "Esc. de la Cpñia. San Juan", "RURAL", "830", "418", "412", "179", "156", "196", "111", "188"],
  ["506", "Escuela Nº 2282 Ntra. Sra. de Guadalupe", "RURAL", "727", "400", "327", "237", "178", "129", "100", "83"],
  ["507", "Esc. Básica Nro 1689 Piri Pucú", "RURAL", "247", "118", "129", "72", "46", "42", "34", "53"],
  ["508", "Escuela Básica N° 4962 San Rafael", "RURAL", "160", "80", "80", "50", "26", "34", "26", "24"],
  ["509", "Col. Nac. Dr. Andrés Barbero", "RURAL", "106", "63", "43", "41", "24", "19", "11", "11"],
];

const doc = new Document({
  numbering: { config: NUMBERING_CONFIG },
  sections: [
    letterPageSection([
      ...brandHeader(
        "Perfil demográfico por local de votación",
        "Sexo · Edad · Procedencia — San Pedro del Ycuamandyyú",
        "Departamento 2 – San Pedro  ·  Distrito 0 – San Pedro del Ycuamandyyú  ·  Corte definitivo oct/2026  ·  25.921 electores"
      ),

      h1("Fuentes y método"),
      bullet("campo SEXO de regciv.dbf, poblado en el 100% de las 25.921 filas del distrito.", { lead: "Sexo:" }),
      bullet(
        "campo EDAD de regciv.dbf (nuevo en el padrón “definitivo”, no existía en el corte dic/2025), poblado en el 100%. Verificado de forma independiente: se recalculó la edad desde la fecha de nacimiento (referencia 04/10/2026) para las 25.921 personas y los conteos por rango coinciden exacto con los del campo EDAD.",
        { lead: "Edad:" }
      ),
      bullet(
        "NO es un campo de la fuente del TSJE — el candidato más cercano (DIRECC) está vacío en el 100% de las filas. Es una clasificación manual por local, confirmada por el equipo el 04/08/2026: los locales 1, 2 y 3 (Col. Nac. de San Pedro, Centro Formación Docente, Esc. 4118 San Rafael) se consideran URBANO; el resto (501–509, escuelas de compañía) se considera RURAL.",
        { lead: "Procedencia:" }
      ),

      h1("Electores por local"),
      img("electores_por_local.png", 600, 367),

      h1("Sexo, edad y procedencia — detalle por local"),
      countTable(
        ["Local", "Descripción", "Proced.", "Total", "Varón", "Mujer"],
        LOCALES.map(([cod, desc, proc, tot, v, m]) => [
          { text: cod }, { text: desc }, { text: proc },
          { text: tot, opts: { align: R } }, { text: v, opts: { align: R } }, { text: m, opts: { align: R } },
        ]),
        [700, 3400, 1100, 1300, 1300, 1300]
      ),
      h2("Composición por sexo (%)"),
      img("sexo_por_local.png", 600, 367),

      h2("Distribución etaria por local"),
      countTable(
        ["Local", "18-30", "31-40", "41-50", "51-60", "61 y más"],
        LOCALES.map(([cod, , , , , , e1, e2, e3, e4, e5]) => [
          { text: cod },
          { text: e1, opts: { align: R } }, { text: e2, opts: { align: R } },
          { text: e3, opts: { align: R } }, { text: e4, opts: { align: R } }, { text: e5, opts: { align: R } },
        ]),
        [900, 1700, 1700, 1700, 1700, 1720]
      ),
      img("edad_por_local.png", 600, 367),

      h1("Resumen por procedencia"),
      countTable(
        ["Procedencia", "Locales", "Total", "Varón", "Mujer", "18-30", "31-40", "41-50", "51-60", "61+"],
        [
          [{ text: "Urbano" }, { text: "3" }, { text: "14.359", opts: { align: R } }, { text: "7.140", opts: { align: R } }, { text: "7.219", opts: { align: R } }, { text: "4.216", opts: { align: R } }, { text: "3.007", opts: { align: R } }, { text: "2.589", opts: { align: R } }, { text: "1.747", opts: { align: R } }, { text: "2.800", opts: { align: R } }],
          [{ text: "Rural" }, { text: "9" }, { text: "11.562", opts: { align: R } }, { text: "6.209", opts: { align: R } }, { text: "5.353", opts: { align: R } }, { text: "3.391", opts: { align: R } }, { text: "2.167", opts: { align: R } }, { text: "2.132", opts: { align: R } }, { text: "1.474", opts: { align: R } }, { text: "2.398", opts: { align: R } }],
        ],
        [1100, 780, 1080, 1000, 1000, 800, 800, 800, 800, 800]
      ),
      img("procedencia_resumen.png", 400, 327),
      body(
        "El 55% de los electores del distrito está en solo 2 locales urbanos (Col. Nac. de San Pedro y Centro Formación Docente, ambos en el pueblo); el 45% restante se reparte en 10 locales rurales, la mayoría escuelas de compañía con menos de 2.300 electores cada una."
      ),

      h1("Observación sobre la distribución etaria"),
      noteBox([
        { text: "El tramo “61 y más” es inusualmente grande en casi todos los locales — no es un error de datos.", bold: true, color: COLOR_WARN },
        { text: "Se verificó cruzando EDAD contra la fecha de nacimiento real: los números coinciden exacto, así que el patrón es genuino. Es consistente con una población rural donde una franja etaria intermedia (31-50) migró y el padrón conserva tanto a los mayores como a la franja más joven que aún no emigró — pero esa es una lectura, no un hecho confirmado por estos datos; no incluyen motivo de migración ni comparación con censos poblacionales." },
      ]),

      hr(),
      body(
        "Datos completos por local (incluyendo el detalle numérico exacto) en perfil_demografico_por_local_oct2026_definitivo.xlsx (hojas Por_Local y Por_Procedencia), misma carpeta.",
        { italics: true, color: COLOR_MUTED }
      ),
    ]),
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("Escrito:", OUT);
});
