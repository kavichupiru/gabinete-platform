const fs = require("fs");
const path = require("path");
const { Document, Packer, AlignmentType } = require("docx");
const {
  COLOR_MUTED, COLOR_GOOD, COLOR_WARN, NUMBERING_CONFIG,
  countTable, hr, h1, body, bullet, letterPageSection, brandHeader,
} = require("./_docx_common");

const OUT = path.resolve(__dirname, "..", "output", "reportes", "formato_sip.docx");

const R = { align: AlignmentType.RIGHT };
const si = { color: COLOR_GOOD };
const no = { color: COLOR_WARN, bold: true };

const tablasDbf = [
  ["FOXUSER.DBF", "3", "7"],
  ["boletas_deshabilitadas.dbf", "16.878", "22"],
  ["ciudades.dbf", "318.467", "5"],
  ["comunidad_indigena.dbf", "717", "3"],
  ["dep.dbf", "19", "4"],
  ["desafiliaciones.dbf", "7.538", "14"],
  ["desh_exte.dbf", "8.910", "22"],
  ["dis.dbf", "267", "4"],
  ["discapacidad.dbf", "8", "2"],
  ["dobles.dbf", "1.498.204", "17"],
  ["inhabilitados.dbf", "681.923", "26"],
  ["loc.dbf", "1.513", "5"],
  ["nacionalidades.dbf", "206", "4"],
  ["part.DBF", "0", "14"],
  ["pueblo_indigena.dbf", "35", "2"],
  ["regciv.dbf", "5.056.524", "26"],
  ["regciv_exte.dbf", "57.276", "19"],
  ["tgen.DBF", "8", "5"],
  ["tipoins.dbf", "7", "2"],
  ["tiporeg.dbf", "7", "2"],
  ["zon.dbf", "304", "5"],
];

const esquemaRegciv = [
  ["DEPART", "N", "2", "0"], ["DISTRITO", "N", "2", "0"], ["ZONA", "N", "2", "0"],
  ["LOCAL", "N", "3", "0"], ["TALON", "N", "10", "0"], ["BOLETA", "N", "7", "0"],
  ["CEDULA", "N", "8", "0"], ["NOMBRE", "C", "35", "0"], ["APELLIDO", "C", "35", "0"],
  ["SEXO", "C", "1", "0"], ["FEC_NAC", "D", "8", "0"], ["FEC_INSCRI", "D", "8", "0"],
  ["TIPO", "C", "1", "0"], ["ID_NACION", "N", "3", "0"], ["MENORES", "C", "1", "0"],
  ["INTERDICTO", "C", "1", "0"], ["POL_MIL", "C", "1", "0"], ["FISCALES", "C", "1", "0"],
  ["ES_INDIGEN", "C", "1", "0"], ["COD_PUEBLO", "N", "3", "0"], ["COD_COMUNI", "N", "3", "0"],
  ["TIENE_DISC", "C", "1", "0"], ["COD_DISCAP", "N", "3", "0"], ["REF_DISCAP", "C", "120", "0"],
  ["DIRECC", "C", "1", "0"], ["_NullFlags", "0", "2", "0"],
];

const locales = [
  ["1", "COL.NAC.DE SAN PEDRO", "sí", si],
  ["2", "CENTRO FORMACION DOCENTE", "sí", si],
  ["3", "ESC.BASICA NRO 4118 SAN RAFAEL", "sí", si],
  ["501", "ESC. DE NARANJATY NRO.1688", "sí", si],
  ["502", "ESC.DE LA COL. BARBERO NRO.2265", "sí", si],
  ["503", "ESC.GRDA.506 DE CORREA RUGUA", "sí", si],
  ["504", "ESC. GRDA. DE PTO. YVAPOBO", "sí", si],
  ["505", "ESC. DE LA CPÑIA. SAN JUAN", "sí", si],
  ["506", "ESCUELA Nº2282 NTRA. SRA DE GUADALUPE", "sí", si],
  ["507", "ESC. BASICA NRO 1689 PIRI PUCU", "sí", si],
  ["508", "ESCUELA BASICA N° 4962 SAN RAFAEL", "NO — falta en BASE", no],
  ["509", "COL.NAC. DR. ANDRES BARBERO", "NO — falta en BASE", no],
  ["999 (zona 0)", "SIN DESCRIPCION", "NO — falta en BASE", no],
  ["999 (zona 1)", "SIN DESCRIPCION", "NO — falta en BASE", no],
];

const doc = new Document({
  numbering: { config: NUMBERING_CONFIG },
  sections: [
    letterPageSection([
      ...brandHeader(
        "Inspección del archivo CONTRASTE (“sip”)",
        "Cruce de padrones TSJE — San Pedro de Ycuamandyyú",
        "Departamento 2 – San Pedro  ·  Distrito 0 – San Pedro del Ycuamandyyú"
      ),

      body(
        "Archivo: RCP al 2025-12-30 DVD consulta (zip).zip  (523,1 MB comprimido)",
        { bold: true }
      ),
      body(
        "Conclusión: no es un CSV/TXT/PDF suelto. Es el ZIP completo del sistema consregciv.exe (RCP2008) de la Justicia Electoral: una base Visual FoxPro (.dbf/.cdx) con el padrón nacional, no solo San Pedro. Esto habilita la categoría EMIGRACION_CONFIRMADA_A_OTRO_DISTRITO (ver spec, sección Limitaciones) y permite cruzar contra inhabilitados.dbf para distinguir fallecidos de bajas sin causa conocida."
      ),

      h1("Tablas .dbf encontradas"),
      countTable(
        ["Tabla", "Registros", "Campos"],
        tablasDbf.map(([t, r, c]) => [{ text: t }, { text: r, opts: R }, { text: c, opts: R }]),
        [5200, 2760, 1760]
      ),

      h1("Esquema de regciv.dbf (padrón activo nacional)"),
      countTable(
        ["Campo", "Tipo", "Long", "Dec"],
        esquemaRegciv.map(([f, t, l, d]) => [{ text: f }, { text: t, opts: R }, { text: l, opts: R }, { text: d, opts: R }]),
        [3960, 1920, 1920, 1920]
      ),
      body("Total registros nacionales: 5.056.524", { bold: true }),

      h1("Confirmación de códigos DEPART / DISTRITO"),
      bullet("→ SAN PEDRO", { lead: "DEPART = 2" }),
      bullet("(dentro de DEPART = 2) → SAN PEDRO DEL YCUAMANDYYU", { lead: "DISTRITO = 0" }),
      body(
        "Otros distritos del departamento SAN PEDRO (no son nuestro foco): 33=San José del Rosario, 21=San Estanislao, 27=Unión, 1=25 de Diciembre, 3=Antequera, 5=Capiivary, 7=Choré, 9=Gral. Elizardo Aquino, 11=Gral. F. Resquín, 13=Guajayvi, 15=Itacurubí del Rosario, 17=Lima, 19=Nueva Germania, 23=San Pablo, 25=Tacuatí, 29=Villa del Rosario, 31=Yataity del Norte, 24=Santa Rosa del Aguaray, 32=Yrybucuá, 22=San Vicente Pancholo, 16=Liberación.",
        { italics: true, color: COLOR_MUTED }
      ),

      h1("Locales del distrito foco (RCP nacional) vs. locales en los PDF de BASE"),
      countTable(
        ["Local", "Descripción (RCP)", "¿En PDFs de BASE?"],
        locales.map(([loc, desc, flag, opts]) => [{ text: loc }, { text: desc }, { text: flag, opts }]),
        [1500, 5300, 2860]
      ),
      body(
        "El local 999 aparece dos veces en el RCP nacional porque existe con zona 0 y zona 1 — no es un local físico real, es un código genérico (“SIN DESCRIPCION”) probablemente para cédulas sin local asignado.",
        { italics: true, color: COLOR_MUTED }
      ),

      h1("Limitaciones y notas"),
      bullet(
        "marca última actualización el 2026-03-24 (fecha de reindexado del sistema FoxPro), no la fecha de corte real de los datos. La carpeta se llama “al 2025-12-30” pero eso no está confirmado dentro del propio dato — se documenta como supuesto, no como hecho verificado.",
        { lead: "El header interno de regciv.dbf" }
      ),
      bullet(
        "Windows-1252 (cp1252), consistente con nombres con tildes/ñ.",
        { lead: "Codificación confirmada por el byte lang_driver del header DBF:" }
      ),
      bullet(
        "(1.498.204 registros nacionales) parece ser inscripciones dobles ya detectadas por el propio TSJE — se usa como QA cruzado, no como fuente principal.",
        { lead: "dobles.dbf" }
      ),
      bullet(
        "(681.923 registros nacionales, con FEC_DEFUNC) se usa para distinguir fallecidos de bajas sin causa conocida en BAJA_DEL_DISTRITO.",
        { lead: "inhabilitados.dbf" }
      ),

      hr(),
      body(
        "Ver output/reportes/resumen_ejecutivo.md para los resultados del cruce sobre esta misma base de datos.",
        { italics: true, color: COLOR_MUTED }
      ),
    ]),
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("Escrito:", OUT);
});
