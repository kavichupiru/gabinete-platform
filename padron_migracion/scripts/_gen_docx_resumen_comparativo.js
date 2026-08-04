const fs = require("fs");
const path = require("path");
const { Document, Packer, AlignmentType } = require("docx");
const {
  COLOR_MUTED, COLOR_GOOD, COLOR_BAD, NUMBERING_CONFIG,
  countTable, hr, h1, h2, body, bullet, noteBox, letterPageSection, brandHeader,
} = require("./_docx_common");

const OUT = path.resolve(
  __dirname, "..", "output", "reportes_definitivo_oct2026",
  "resumen_ejecutivo_comparativo_dic2025_vs_oct2026.docx"
);

const R = AlignmentType.RIGHT;

const doc = new Document({
  numbering: { config: NUMBERING_CONFIG },
  sections: [
    letterPageSection([
      ...brandHeader(
        "Resumen ejecutivo comparativo",
        "Cruce de padrones TSJE — San Pedro de Ycuamandyyú",
        "Departamento 2 – San Pedro  ·  Distrito 0 – San Pedro del Ycuamandyyú  ·  Corte dic/2025 vs. corte definitivo oct/2026"
      ),

      h1("Contexto"),
      body(
        "Se compararon dos fotos del padrón nacional (RCP2008) contra la misma BASE de julio/2025, para ver cómo evolucionó San Pedro del Ycuamandyyú entre el corte de diciembre/2025 (ya reportado) y el padrón “definitivo” de octubre/2026."
      ),
      countTable(
        ["Corte", "Fuente", "Fecha"],
        [
          [{ text: "BASE" }, { text: "20 PDF del TSJE, uno por local/tipo de inscripción" }, { text: "31/07/2025" }],
          [{ text: "CONTRASTE (anterior)" }, { text: "RCP2008 nacional, carpeta “al 2025-12-30”" }, { text: "asumida 2025-12-31, no confirmada en los datos" }],
          [{ text: "CONTRASTE (definitivo)" }, { text: "RCP2008 nacional, “RCP 2026-10-04 Padron.zip”" }, { text: "asumida 2026-10-04, no confirmada en los datos" }],
        ],
        [2200, 4800, 2640]
      ),
      body(
        "Ambos archivos CONTRASTE tienen la misma estructura (base Visual FoxPro completa del sistema consregciv.exe, cobertura nacional). El padrón definitivo trae 5 campos nuevos en regciv.dbf (MESA, ORDEN, TIPO_VOTO, EDAD, DES_VOTO) que no existían en el corte anterior; no afectan esta comparación.",
        { italics: true, color: COLOR_MUTED }
      ),

      h1("Total de electores en el distrito"),
      countTable(
        ["Corte", "Total electores"],
        [
          [{ text: "Diciembre 2025" }, { text: "26.022", opts: { align: R } }],
          [{ text: "Octubre 2026 (definitivo)" }, { text: "25.921", opts: { align: R } }],
          [{ text: "Diferencia", opts: { bold: true } }, { text: "-101", opts: { align: R, bold: true, color: COLOR_BAD } }],
        ],
        [6520, 3120]
      ),
      body(
        "El equipo político había estimado una diferencia de aproximadamente 105 electores; el cálculo exacto a partir del cruce es -101, consistente con esa estimación."
      ),

      h1("Explicación por categoría de migración"),
      body(
        "Ambos cortes se comparan contra la misma BASE (31/07/2025, 25.822 electores), lo que permite descomponer la diferencia categoría por categoría en vez de reportar solo el número neto."
      ),
      countTable(
        ["Categoría", "Dic/2025", "Oct/2026", "Diferencia"],
        [
          [{ text: "Sin cambio" }, { text: "25.052", opts: { align: R } }, { text: "24.900", opts: { align: R } }, { text: "-152", opts: { align: R } }],
          [{ text: "Cambio de local intradistrito" }, { text: "385", opts: { align: R } }, { text: "385", opts: { align: R } }, { text: "0", opts: { align: R } }],
          [{ text: "Baja del distrito" }, { text: "165", opts: { align: R } }, { text: "318", opts: { align: R } }, { text: "+153", opts: { align: R, bold: true, color: COLOR_BAD } }],
          [{ text: "Emigración confirmada a otro distrito" }, { text: "220", opts: { align: R } }, { text: "219", opts: { align: R } }, { text: "-1", opts: { align: R } }],
          [{ text: "Alta en el distrito" }, { text: "585", opts: { align: R } }, { text: "636", opts: { align: R } }, { text: "+51", opts: { align: R, bold: true, color: COLOR_GOOD } }],
          [{ text: "Duplicados probables" }, { text: "124", opts: { align: R } }, { text: "120", opts: { align: R } }, { text: "-4", opts: { align: R } }],
          [{ text: "Cédulas repetidas" }, { text: "0", opts: { align: R } }, { text: "0", opts: { align: R } }, { text: "0", opts: { align: R } }],
          [{ text: "Sin clasificar" }, { text: "0", opts: { align: R } }, { text: "0", opts: { align: R } }, { text: "0", opts: { align: R } }],
        ],
        [3520, 2000, 2000, 2120]
      ),
      body(
        "La cuenta cierra exacto: -153 (más bajas) + 51 (más altas) + 1 (emigración casi sin cambio) = -101.",
        { bold: true }
      ),

      h2("Causa probable de “Baja del distrito”"),
      countTable(
        ["Causa probable", "Dic/2025", "Oct/2026", "Diferencia"],
        [
          [{ text: "Fallecido" }, { text: "157", opts: { align: R } }, { text: "224", opts: { align: R } }, { text: "+67", opts: { align: R } }],
          [{ text: "Desconocida" }, { text: "3", opts: { align: R } }, { text: "87", opts: { align: R } }, { text: "+84", opts: { align: R, bold: true, color: COLOR_BAD } }],
          [{ text: "Inhabilitado" }, { text: "5", opts: { align: R } }, { text: "7", opts: { align: R } }, { text: "+2", opts: { align: R } }],
        ],
        [3520, 2000, 2000, 2120]
      ),

      h2("Subcategorías de “Alta en el distrito” (heurística por edad)"),
      countTable(
        ["Subcategoría", "Dic/2025", "Oct/2026", "Diferencia"],
        [
          [{ text: "Probable alta por 18 años" }, { text: "50", opts: { align: R } }, { text: "73", opts: { align: R } }, { text: "+23", opts: { align: R } }],
          [{ text: "Probable transferencia" }, { text: "535", opts: { align: R } }, { text: "563", opts: { align: R } }, { text: "+28", opts: { align: R } }],
        ],
        [3520, 2000, 2000, 2120]
      ),

      h1("Cómo se explica la caída de 101 electores"),
      body(
        "El motor de la caída es el crecimiento de las bajas del distrito (+153), solo parcialmente compensado por más altas (+51); la emigración a otros distritos se mantuvo prácticamente igual. Dentro de las bajas, los fallecidos confirmados subieron +67 (esperable: pasaron unos 10 meses entre cortes), y las altas subieron por la combinación normal de más cumpleaños de 18 años (+23) y más transferencias entrantes acumuladas (+28)."
      ),
      noteBox([
        { text: "Punto a seguir: la categoría “baja, causa desconocida” saltó de 3 a 87 casos.", bold: true, color: COLOR_BAD },
        { text: "Son personas que ya no aparecen ni en San Pedro Ycuamandyyú, ni en ningún otro distrito del padrón nacional activo, ni en el registro de inhabilitados/fallecidos. No hay evidencia en estos datos para afirmar una causa: es compatible con una depuración administrativa del TSJE de cara al padrón “definitivo” (a diferencia del corte de diciembre, que era una foto de rutina), pero también podría tratarse de fallecidos aún no cargados en inhabilitados.dbf, o bajas por otro motivo administrativo. No se debe presentar como fraude, error ni ninguna causa específica sin evidencia adicional." },
      ]),

      h1("Limitaciones documentadas"),
      bullet(
        "en ninguno de los dos cortes el header interno de regciv.dbf confirma la fecha real de corte de los datos (refleja la fecha de reindexado del sistema). Se usó la fecha del nombre de carpeta/archivo del RCP en cada caso, solo para la heurística de edad de “Alta en el distrito”.",
        { lead: "Fecha de corte real no confirmada en ninguno de los dos cortes:" }
      ),
      bullet(
        "esta comparación se arma triangulando ambos cortes contra la misma BASE, no cruzando directamente CONTRASTE-dic2025 contra CONTRASTE-oct2026 persona por persona. Es una explicación por categoría agregada, no una lista nominal de quién pasó de qué categoría a cuál entre ambos cortes.",
        { lead: "No es un diff directo entre los dos cortes CONTRASTE:" }
      ),
      bullet(
        "reflejada en el sufijo “_probable”, nunca afirmada como hecho, en ambos cortes.",
        { lead: "La subclasificación de “Alta en el distrito” por edad es una heurística probabilística," }
      ),

      hr(),
      body(
        "Datos completos, desglose por local de votación y trazabilidad fila por fila del corte definitivo: ver output/reportes_definitivo_oct2026/ (CSV por categoría, planillas por local, padrón actual por local y resumen_migracion.xlsx). El corte de diciembre/2025 sigue disponible sin cambios en output/reportes/.",
        { italics: true, color: COLOR_MUTED }
      ),
    ]),
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("Escrito:", OUT);
});
