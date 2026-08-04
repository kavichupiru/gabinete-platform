const fs = require("fs");
const path = require("path");
const { Document, Packer, Paragraph, TextRun, AlignmentType } = require("docx");
const {
  COLOR_MUTED, COLOR_GOOD, NUMBERING_CONFIG,
  countTable, hr, h1, h2, body, bullet, letterPageSection, brandHeader,
} = require("./_docx_common");

const OUT = path.resolve(__dirname, "..", "output", "reportes", "resumen_ejecutivo.docx");

const doc = new Document({
  numbering: { config: NUMBERING_CONFIG },
  sections: [
    letterPageSection([
      ...brandHeader(
        "Resumen ejecutivo",
        "Cruce de padrones TSJE — San Pedro de Ycuamandyyú",
        "Departamento 2 – San Pedro  ·  Distrito 0 – San Pedro del Ycuamandyyú"
      ),

      h1("Contexto"),
      body(
        "Se cruzaron dos cortes del padrón electoral para detectar migración entre locales de votación e inscripciones duplicadas dentro del distrito."
      ),
      countTable(
        ["Corte", "Fuente", "Fecha"],
        [
          [{ text: "BASE" }, { text: "20 PDF del TSJE, uno por local/tipo de inscripción" }, { text: "31/07/2025" }],
          [{ text: "CONTRASTE" }, { text: "RCP2008 nacional (consregciv.exe), padrón activo completo" }, { text: '"al 2025-12-30" (no confirmada en los datos)' }],
        ],
        [1600, 5600, 2440]
      ),
      body(
        "El archivo CONTRASTE no es un CSV/TXT suelto: es la base Visual FoxPro completa del sistema de consulta del Registro Cívico Permanente, con cobertura nacional (5.056.524 registros), no solo del distrito. Eso permitió confirmar destino real de las migraciones y cruzar contra el registro de fallecidos/inhabilitados en vez de quedar con un simple \"ausente\".",
        { italics: true, color: COLOR_MUTED }
      ),

      h1("Conteo por categoría"),
      countTable(
        ["Categoría", "Cantidad"],
        [
          [{ text: "Sin cambio" }, { text: "25.052", opts: { align: AlignmentType.RIGHT } }],
          [{ text: "Cambio de local intradistrito" }, { text: "385", opts: { align: AlignmentType.RIGHT } }],
          [{ text: "Baja del distrito" }, { text: "165", opts: { align: AlignmentType.RIGHT } }],
          [{ text: "Emigración confirmada a otro distrito" }, { text: "220", opts: { align: AlignmentType.RIGHT } }],
          [{ text: "Alta en el distrito" }, { text: "585", opts: { align: AlignmentType.RIGHT } }],
          [{ text: "Duplicados probables" }, { text: "124", opts: { align: AlignmentType.RIGHT } }],
          [{ text: "Cédulas repetidas" }, { text: "0", opts: { align: AlignmentType.RIGHT } }],
          [{ text: "Sin clasificar" }, { text: "0", opts: { align: AlignmentType.RIGHT } }],
        ],
        [6520, 3120]
      ),

      h2("Subcategorías de “Alta en el distrito” (heurística por edad, no certeza)"),
      countTable(
        ["Subcategoría", "Cantidad"],
        [
          [{ text: "Probable transferencia (edad > 18.5 años)" }, { text: "535", opts: { align: AlignmentType.RIGHT } }],
          [{ text: "Probable alta por 18 años (17.5–18.5 años)" }, { text: "50", opts: { align: AlignmentType.RIGHT } }],
        ],
        [6520, 3120]
      ),

      h2("Causa probable de “Baja del distrito” (solo con evidencia directa)"),
      countTable(
        ["Causa probable", "Cantidad"],
        [
          [{ text: "Fallecido" }, { text: "157", opts: { align: AlignmentType.RIGHT } }],
          [{ text: "Inhabilitado" }, { text: "5", opts: { align: AlignmentType.RIGHT } }],
          [{ text: "Desconocida" }, { text: "3", opts: { align: AlignmentType.RIGHT } }],
        ],
        [6520, 3120]
      ),

      h1("Verificación: casos de duplicado ya conocidos"),
      body("Sanity check contra los tres casos de duplicado identificados previamente en una muestra chica de los datos:"),
      ...[
        "AMARAL GONZALEZ, ADRIANA SOLEDAD",
        "MOREL CABAÑA, MIRTA DIANA",
        "SANABRIA CHILAVERT, DIEGO ANTONIO",
      ].map((n) => new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 90 },
        children: [
          new TextRun({ text: "✓ ", bold: true, color: COLOR_GOOD }),
          new TextRun({ text: n }),
          new TextRun({ text: "  —  encontrado", italics: true, color: COLOR_GOOD }),
        ],
      })),

      h1("Filas sin clasificar"),
      body(
        "0 filas no se pudieron clasificar (cédula vacía/inválida, fecha de nacimiento inválida u otro problema de datos). Ninguna fila se descarta en silencio: las que no se puedan evaluar quedan documentadas en sin_clasificar.csv."
      ),

      h1("Limitaciones documentadas"),
      bullet(
        "El header interno de regciv.dbf refleja la fecha de reindexado del sistema (2026-03-24), no la fecha de corte de los datos. Se asumió 2025-12-31 (del nombre de carpeta del RCP) solo para la heurística de edad de “Alta en el distrito” — es un supuesto, no un hecho verificado.",
        { lead: "Fecha de corte real de CONTRASTE no confirmada." }
      ),
      bullet(
        "reflejada en el sufijo “_probable” en los datos de origen, nunca afirmada como hecho.",
        { lead: "La subclasificación de “Alta en el distrito” por edad (17.5–18.5 años vs. transferencia) es una heurística probabilística," }
      ),
      bullet(
        "significa que la cédula no aparece en ningún distrito del padrón nacional activo ni en el registro de inhabilitados — no se inventa una causa; puede deberse a depuración administrativa u otras razones no visibles en estos datos.",
        { lead: "“Causa probable: desconocida” en Baja del distrito" }
      ),
      bullet(
        "existen en el RCP nacional pero no estaban en los PDF de BASE entregados — no se puede evaluar migración hacia/desde ellos en el corte BASE.",
        { lead: "Los locales 508, 509 y 999 (“sin descripción”)" }
      ),

      hr(),
      body(
        "Datos completos, desglose por local de votación y trazabilidad fila por fila: ver output/reportes/ (CSV por categoría, planillas por local y resumen_migracion.xlsx) en el repositorio del pipeline.",
        { italics: true, color: COLOR_MUTED }
      ),
    ]),
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("Escrito:", OUT);
});
