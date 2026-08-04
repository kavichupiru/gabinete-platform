// Reporte ejecutivo: electores habilitados por mesa, corte definitivo oct/2026.
// Datos de 12_electores_y_mesas_por_local.py (hoja Detalle_Por_Mesa del xlsx).
const fs = require("fs");
const path = require("path");
const { Document, Packer, AlignmentType } = require("docx");
const {
  COLOR_MUTED, COLOR_WARN, NUMBERING_CONFIG,
  countTable, hr, h1, h2, body, noteBox, letterPageSection, brandHeader,
} = require("./_docx_common");

const OUT = path.resolve(
  __dirname, "..", "output", "reportes_definitivo_oct2026",
  "electores_por_mesa.docx"
);

const R = AlignmentType.RIGHT;
const TOPE_MESA = 350;

// [local_cod, local_desc, [[mesa, electores], ...]]
const LOCALES = [
  ["1", "Col. Nac. de San Pedro", [[1,350],[2,350],[3,350],[4,350],[5,350],[6,350],[7,350],[8,350],[9,350],[10,350],[11,325]]],
  ["2", "Centro Formación Docente", [[1,350],[2,350],[3,350],[4,350],[5,350],[6,350],[7,350],[8,350],[9,350],[10,350],[11,350],[12,350],[13,350],[14,350],[15,350],[16,350],[17,350],[18,350],[19,350],[20,350],[21,350],[22,350],[23,350],[24,350],[25,350],[26,350],[27,350],[28,283]]],
  ["3", "Esc. Básica Nro 4118 San Rafael", [[1,350],[2,350],[3,101]]],
  ["501", "Esc. de Naranjaty Nro. 1688", [[1,350],[2,350],[3,350],[4,437]]],
  ["502", "Esc. de la Col. Barbero Nro. 2265", [[1,350],[2,350],[3,350],[4,350],[5,350],[6,350],[7,350],[8,350],[9,350],[10,350],[11,350],[12,350],[13,350],[14,184]]],
  ["503", "Esc. Grda. 506 de Correa Rugua", [[1,350],[2,350],[3,350],[4,350],[5,350],[6,350],[7,151]]],
  ["504", "Esc. Grda. de Pto. Yvapobo", [[1,350],[2,350],[3,320]]],
  ["505", "Esc. de la Cpñia. San Juan", [[1,350],[2,350],[3,130]]],
  ["506", "Escuela Nº 2282 Ntra. Sra. de Guadalupe", [[1,350],[2,377]]],
  ["507", "Esc. Básica Nro 1689 Piri Pucú", [[1,247]]],
  ["508", "Escuela Básica N° 4962 San Rafael", [[1,160]]],
  ["509", "Col. Nac. Dr. Andrés Barbero", [[1,106]]],
];

const todasLasMesas = LOCALES.flatMap(([, , mesas]) => mesas.map(([, e]) => e));
const totalMesas = todasLasMesas.length;
const totalElectores = todasLasMesas.reduce((a, b) => a + b, 0);
const promedio = Math.round(totalElectores / totalMesas);
const mediana = [...todasLasMesas].sort((a, b) => a - b)[Math.floor(totalMesas / 2)];
const excedeTope = LOCALES.flatMap(([cod, desc, mesas]) =>
  mesas.filter(([, e]) => e > TOPE_MESA).map(([mesa, e]) => `Local ${cod} (${desc}), mesa ${mesa}: ${e} electores`)
);

const doc = new Document({
  numbering: { config: NUMBERING_CONFIG },
  sections: [
    letterPageSection([
      ...brandHeader(
        "Electores habilitados por mesa",
        "San Pedro del Ycuamandyyú — corte definitivo oct/2026",
        "Departamento 2 – San Pedro  ·  Distrito 0 – San Pedro del Ycuamandyyú  ·  Fuente: regciv.dbf (RCP2008, consregciv.exe)"
      ),

      h1("Resumen"),
      countTable(
        ["Indicador", "Valor"],
        [
          [{ text: "Total de mesas" }, { text: String(totalMesas), opts: { align: R } }],
          [{ text: "Total de electores" }, { text: totalElectores.toLocaleString("es-PY"), opts: { align: R } }],
          [{ text: "Mínimo por mesa" }, { text: String(Math.min(...todasLasMesas)), opts: { align: R } }],
          [{ text: "Máximo por mesa" }, { text: String(Math.max(...todasLasMesas)), opts: { align: R } }],
          [{ text: "Promedio por mesa" }, { text: String(promedio), opts: { align: R } }],
          [{ text: "Mediana por mesa" }, { text: String(mediana), opts: { align: R } }],
        ],
        [6520, 3120]
      ),
      body(
        `La mayoría de las mesas tiene exactamente ${TOPE_MESA} electores (el tope estándar de mesa del TSJE); la última mesa de cada local carga el remanente.`
      ),

      noteBox([
        { text: `${excedeTope.length} mesas superan el tope de ${TOPE_MESA} electores — no es un error de cálculo, está así en la fuente (campo MESA de regciv.dbf).`, bold: true, color: COLOR_WARN },
        { text: excedeTope.join("; ") + ". Vale la pena confirmar con el TSJE si es una decisión administrativa o si corresponde abrir una mesa adicional para el día de la elección." },
      ]),

      h1("Detalle por local y mesa"),
      ...LOCALES.flatMap(([cod, desc, mesas]) => [
        h2(`Local ${cod} — ${desc}`),
        countTable(
          ["Mesa", "Electores habilitados"],
          mesas.map(([mesa, e]) => [
            { text: String(mesa) },
            { text: e.toLocaleString("es-PY"), opts: { align: R, bold: e > TOPE_MESA, color: e > TOPE_MESA ? COLOR_WARN : undefined } },
          ]),
          [4000, 5640]
        ),
      ]),

      hr(),
      body(
        "Mismos datos en detalle en electores_y_mesas_por_local_oct2026_definitivo.xlsx (hoja Detalle_Por_Mesa), misma carpeta.",
        { italics: true, color: COLOR_MUTED }
      ),
    ]),
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("Escrito:", OUT);
});
