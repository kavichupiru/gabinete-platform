// Reporte ejecutivo de verificación del pipeline y sus resultados (corte definitivo
// oct/2026). No reemplaza resumen_ejecutivo.docx ni el comparativo: es el reporte de
// cierre de la sesión de verificación del 4 de agosto de 2026 (integridad de datos +
// estado del repositorio git).
const fs = require("fs");
const path = require("path");
const { Document, Packer, AlignmentType } = require("docx");
const {
  COLOR_MUTED, COLOR_GOOD, COLOR_BAD, NUMBERING_CONFIG,
  countTable, hr, h1, h2, body, bullet, noteBox, letterPageSection, brandHeader,
} = require("./_docx_common");

const OUT = path.resolve(
  __dirname, "..", "output", "reportes_definitivo_oct2026",
  "reporte_ejecutivo_pipeline_y_resultados.docx"
);

const R = AlignmentType.RIGHT;

const doc = new Document({
  numbering: { config: NUMBERING_CONFIG },
  sections: [
    letterPageSection([
      ...brandHeader(
        "Reporte ejecutivo",
        "Pipeline y resultados — cruce de padrones TSJE, San Pedro de Ycuamandyyú",
        "Departamento 2 – San Pedro  ·  Distrito 0 – San Pedro del Ycuamandyyú  ·  Corte definitivo oct/2026  ·  Verificado 04/08/2026"
      ),

      h1("Qué hace el pipeline"),
      body(
        "Cruza el corte BASE (20 PDF del TSJE, 31/07/2025) contra un corte CONTRASTE del padrón nacional (RCP2008, sistema consregciv.exe) para detectar migración electoral e inscripciones duplicadas en el distrito. El proceso corre en 11 scripts Python encadenados (extracción → normalización → cruce y clasificación → generación de reportes), cada uno validando la entrada del anterior antes de avanzar. Para este corte, CONTRASTE es el padrón “definitivo” de octubre/2026."
      ),

      h1("Resultado del cruce (BASE jul/2025 vs. CONTRASTE oct/2026)"),
      countTable(
        ["Categoría", "Cantidad"],
        [
          [{ text: "Sin cambio" }, { text: "24.900", opts: { align: R } }],
          [{ text: "Cambio de local intradistrito" }, { text: "385", opts: { align: R } }],
          [{ text: "Baja del distrito" }, { text: "318", opts: { align: R } }],
          [{ text: "Emigración confirmada a otro distrito" }, { text: "219", opts: { align: R } }],
          [{ text: "Alta en el distrito" }, { text: "636", opts: { align: R } }],
          [{ text: "Duplicados probables" }, { text: "120", opts: { align: R } }],
          [{ text: "Cédulas repetidas" }, { text: "0", opts: { align: R } }],
          [{ text: "Sin clasificar" }, { text: "0", opts: { align: R } }],
        ],
        [6520, 3120]
      ),

      h1("Verificación de integridad realizada hoy"),
      body(
        "Además de revisar resumen_ejecutivo.md, se recontaron directamente las filas de los CSV extraídos (no solo se confió en el resumen generado por el pipeline):"
      ),
      bullet(
        "24.900 (sin cambio) + 385 (cambio de local) + 318 (baja) + 219 (emigración) = 25.822 — coincide exacto con las filas de base_31jul2025.csv.",
        { lead: "Total BASE cuadra:" }
      ),
      bullet(
        "24.900 (sin cambio) + 385 (llegadas por cambio de local) + 636 (alta) = 25.921 — coincide exacto con las filas de contraste_oct2026_definitivo.csv.",
        { lead: "Total CONTRASTE cuadra:" }
      ),
      bullet(
        "0 duplicados de cédula, 0 filas sin clasificar — no quedó ningún elector sin evaluar ni ninguna fila descartada en silencio.",
        { lead: "Sin cabos sueltos:" }
      ),

      h1("El número que importa: -101 electores"),
      body(
        "Comparando este corte contra el de diciembre/2025 (ya reportado previamente), el distrito pasó de 26.022 a 25.921 electores."
      ),
      countTable(
        ["Categoría", "Diferencia dic/2025 → oct/2026"],
        [
          [{ text: "Baja del distrito" }, { text: "+153", opts: { align: R, bold: true, color: COLOR_BAD } }],
          [{ text: "Alta en el distrito" }, { text: "+51", opts: { align: R, bold: true, color: COLOR_GOOD } }],
          [{ text: "Emigración a otro distrito" }, { text: "-1", opts: { align: R } }],
          [{ text: "Total", opts: { bold: true } }, { text: "-101", opts: { align: R, bold: true, color: COLOR_BAD } }],
        ],
        [6520, 3120]
      ),
      body(
        "Consistente con la estimación de ~105 del equipo político. Detalle completo por categoría y causa probable en resumen_ejecutivo_comparativo_dic2025_vs_oct2026.docx (misma carpeta)."
      ),
      noteBox([
        { text: "Punto abierto, no una conclusión: “baja, causa desconocida” saltó de 3 a 87 casos.", bold: true, color: COLOR_BAD },
        { text: "No hay evidencia en estos datos para afirmar una causa específica — puede ser depuración administrativa del TSJE, fallecidos aún no cargados en inhabilitados.dbf, u otro motivo. No se debe presentar como fraude ni error sin evidencia adicional." },
      ]),

      h1("Entregables disponibles en output/reportes_definitivo_oct2026/"),
      bullet("8 CSV por categoría (sin_cambio, cambio_local_intradistrito, baja_del_distrito, emigracion_confirmada, alta_en_distrito, duplicados_probables, cedulas_repetidas, sin_clasificar)."),
      bullet("planillas_por_local/ y padron_actual_por_local/ — un .xlsx por local de votación."),
      bullet("resumen_migracion.xlsx — todo lo anterior consolidado en un solo libro."),
      bullet("resumen_ejecutivo.docx y resumen_ejecutivo_comparativo_dic2025_vs_oct2026.docx — versiones Word listas para compartir."),
      bullet("formato_sip.md — documentación técnica del formato del archivo CONTRASTE."),

      h1("Estado del repositorio"),
      bullet("Pipeline completo (scripts 01–11 + README) commiteado y pusheado a develop en 78d09a3.", { lead: "Código:" }),
      bullet("requirements.txt faltante detectado y agregado en 88ba048.", { lead: "Gap cerrado:" }),
      bullet("padron_migracion/input/ y padron_migracion/output/ excluidos vía .gitignore — cédula, nombre y fecha de nacimiento reales nunca llegan al repositorio.", { lead: "PII:" }),
      bullet("carpeta .playwright-mcp/ (capturas de una sesión de julio, sin relación con este trabajo) y padron_migracion/scripts/__pycache__/ eliminadas; reglas agregadas al .gitignore para que no reaparezcan (c0bc2ea, d48da31).", { lead: "Limpieza:" }),
      body("git status queda limpio: no hay cambios pendientes ni archivos sueltos.", { bold: true }),

      hr(),
      body(
        "Conclusión: el pipeline corrió de punta a punta sin filas perdidas ni sin clasificar, los totales cuadran de forma independiente contra los CSV crudos, y el estado del repositorio (código, PII, artefactos) está en orden.",
        { italics: true, color: COLOR_MUTED }
      ),
    ]),
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("Escrito:", OUT);
});
