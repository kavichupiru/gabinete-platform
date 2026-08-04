const fs = require("fs");
const path = require("path");
const { Document, Packer, AlignmentType } = require("docx");
const {
  COLOR_MUTED, COLOR_WARN, COLOR_BAD, NUMBERING_CONFIG,
  countTable, hr, h1, h2, body, bullet, step, noteBox,
  letterPageSection, brandHeader,
} = require("./_docx_common");

const OUT = path.resolve(__dirname, "..", "output", "reportes", "instructivo_operador_campo.docx");

const R = { align: AlignmentType.RIGHT };

const locales = [
  ["1", "COL.NAC.DE SAN PEDRO"],
  ["2", "CENTRO FORMACION DOCENTE"],
  ["3", "ESC.BASICA NRO 4118 SAN RAFAEL"],
  ["501", "ESC. DE NARANJATY NRO.1688"],
  ["502", "ESC.DE LA COL. BARBERO NRO.2265"],
  ["503", "ESC.GRDA.506 DE CORREA RUGUA"],
  ["504", "ESC. GRDA. DE PTO. YVAPOBO"],
  ["505", "ESC. DE LA CPÑIA. SAN JUAN"],
  ["506", "ESCUELA Nº2282 NTRA. SRA DE GUADALUPE"],
  ["507", "ESC. BASICA NRO 1689 PIRI PUCU"],
  ["508", "ESCUELA BASICA N° 4962 SAN RAFAEL (nuevo, sin datos de julio/2025)"],
  ["509", "COL.NAC. DR. ANDRES BARBERO (nuevo, sin datos de julio/2025)"],
];

const doc = new Document({
  numbering: { config: NUMBERING_CONFIG },
  sections: [
    letterPageSection([
      ...brandHeader(
        "Instructivo para el operador de campo",
        "Cómo leer resumen_migracion.xlsx — Cruce de padrones TSJE",
        "Departamento 2 – San Pedro  ·  Distrito 0 – San Pedro del Ycuamandyyú"
      ),

      h1("¿Qué es este archivo?"),
      body(
        "resumen_migracion.xlsx compara el padrón electoral de dos fechas — julio de 2025 y diciembre de 2025 — para el distrito San Pedro del Ycuamandyyú. Muestra, local por local, quién sigue votando igual que antes, quién cambió de local, quién ya no aparece, quién es nuevo, y detecta posibles cédulas duplicadas. Este instructivo explica cómo encontrar y leer esa información sin necesidad de conocimientos técnicos."
      ),

      h1("Cómo está organizado el archivo"),
      body("El archivo tiene 74 pestañas (hojas). No hace falta mirarlas todas — se agrupan así:"),
      countTable(
        ["Grupo de hojas", "Qué muestra"],
        [
          [{ text: "Resumen" }, { text: "Totales generales de todo el distrito, de un vistazo." }],
          [{ text: "8 hojas de categoría\n(sin_cambio, alta_en_distrito, etc.)" }, { text: "El detalle completo de cada categoría, con TODOS los locales mezclados." }],
          [{ text: "Indice_Por_Local" }, { text: "Una tabla con una fila por local y cuántos casos tiene de cada categoría." }],
          [{ text: "Hojas por local\n(L1_SinCambio, L507_Baja, etc.)" }, { text: "El detalle de UN SOLO local, separado por categoría — la que más le sirve al operador de campo." }],
        ],
        [3400, 6240]
      ),

      h1("Paso a paso: cómo encontrar la información de tu local"),
      step("Abrí resumen_migracion.xlsx en Excel.", {}),
      step("Andá a la pestaña Indice_Por_Local (después de las 8 hojas de categoría). Ahí vas a ver, en una sola fila, cuántos casos de cada categoría tiene tu local.", {}),
      step("Para ver los nombres y cédulas de esos casos, buscá las pestañas que empiezan con “L” + el código de tu local, por ejemplo L507_Baja o L2_Alta. Cada una es una categoría distinta (ver el glosario más abajo).", {}),
      step("Si tu local no tiene una pestaña para alguna categoría, es porque no tuvo ningún caso de ese tipo — no es un error.", {}),

      h2("Códigos de local del distrito"),
      countTable(
        ["Código", "Local"],
        locales.map(([c, d]) => [{ text: c }, { text: d }]),
        [1600, 8040]
      ),

      h1("Glosario: qué significa cada categoría"),
      countTable(
        ["Categoría", "Qué significa", "¿Requiere acción?"],
        [
          [
            { text: "Sin cambio" },
            { text: "Sigue votando en el mismo local, sin cambios." },
            { text: "Ninguna — es la situación normal de la mayoría." },
          ],
          [
            { text: "Cambio de local\n(Salidas / Llegadas)" },
            { text: "Sigue en el distrito pero vota en OTRO local. “Salidas” = se fue de tu local; “Llegadas” = llegó a tu local desde otro." },
            { text: "Informativo — útil para prever cuánta gente esperar en cada mesa." },
          ],
          [
            { text: "Baja del distrito" },
            { text: "Ya no aparece en el padrón. La columna causa_probable puede decir FALLECIDO, INHABILITADO o DESCONOCIDA." },
            { text: "Solo revisar si causa_probable = DESCONOCIDA." },
          ],
          [
            { text: "Emigración confirmada" },
            { text: "Se fue a votar a otro distrito o departamento (la hoja dice a cuál)." },
            { text: "Ninguna — ya no vota en San Pedro." },
          ],
          [
            { text: "Alta en el distrito" },
            { text: "Persona nueva en el padrón de ese local. subcategoria_probable indica si probablemente cumplió 18 años o si es una transferencia — es una ESTIMACIÓN, no una certeza." },
            { text: "Si dice “transferencia”, puede convenir verificar si la persona es conocida en el local." },
          ],
          [
            { text: "Duplicados probables" },
            { text: "Dos cédulas distintas con el mismo nombre completo y la misma fecha de nacimiento." },
            { text: "Verificar manualmente antes de sacar conclusiones — puede ser coincidencia de nombre." },
          ],
          [
            { text: "Cédulas repetidas" },
            { text: "La misma cédula aparece más de una vez — error de carga de datos. (Hoy: 0 casos en todo el distrito)." },
            { text: "Reportar si aparece algún caso." },
          ],
          [
            { text: "Sin clasificar" },
            { text: "Cédula vacía, fecha inválida u otro dato incompleto que no se pudo evaluar. (Hoy: 0 casos)." },
            { text: "Reportar si aparece algún caso." },
          ],
        ],
        [2000, 5040, 2600]
      ),

      h1("Columnas más comunes dentro de cada hoja"),
      countTable(
        ["Columna", "Qué es"],
        [
          [{ text: "numero_ced" }, { text: "Número de cédula del elector." }],
          [{ text: "apellido_nombre" }, { text: "Apellido y nombre, tal como figura en el padrón." }],
          [{ text: "fecha_nacimiento" }, { text: "Fecha de nacimiento (año-mes-día)." }],
          [{ text: "tipo_inscripcion" }, { text: "AUTOMATICA (inscripción automática al cumplir 18) o TRADICIONAL." }],
          [{ text: "causa_probable" }, { text: "Solo en “Baja del distrito”: FALLECIDO, INHABILITADO o DESCONOCIDA." }],
          [{ text: "subcategoria_probable" }, { text: "Solo en “Alta en el distrito”: estimación de por qué apareció (18 años o transferencia)." }],
          [{ text: "destino_local / destino_distrito / destino_departamento" }, { text: "A dónde se mudó la persona (cambio de local o emigración)." }],
          [{ text: "origen_local" }, { text: "De dónde vino la persona (en las hojas “Llegadas”)." }],
        ],
        [3200, 6440]
      ),

      h1("Advertencias importantes"),
      noteBox(
        [
          { text: "Leé esto antes de usar la información en el terreno:", bold: true, color: COLOR_BAD },
        ],
        { fill: "FDEDEC", borderColor: COLOR_BAD }
      ),
      bullet(
        "no son hechos confirmados, son estimaciones estadísticas. Nunca usarlas para acusar, confrontar a alguien o tomar una decisión definitiva sin verificar antes por otro medio.",
        { lead: "Todo lo que dice “_probable” o “probable”" }
      ),
      bullet(
        "significa que no encontramos una razón en los datos disponibles — no que no exista una razón legítima. Puede deberse a depuración administrativa u otros motivos que estos datos no muestran.",
        { lead: "“DESCONOCIDA” en causa_probable" }
      ),
      bullet(
        "cédula, nombre completo y fecha de nacimiento de electores reales. Es información confidencial: no imprimir, fotografiar ni compartir fuera del equipo de trabajo autorizado.",
        { lead: "Este archivo contiene datos personales reales:" }
      ),
      bullet(
        "por lo tanto los números son una foto aproximada del padrón, no un dato exacto verificado al día de hoy.",
        { lead: "La fecha de corte del padrón de diciembre no está 100% confirmada," }
      ),

      hr(),
      h1("¿Dudas?"),
      body(
        "Ante cualquier duda sobre cómo leer un caso puntual, o si encontrás algo que no coincide con lo que ves en el terreno, consultá con el equipo que preparó este cruce antes de tomar cualquier decisión — sobre todo en los casos marcados como “_probable” o “DESCONOCIDA”.",
        { italics: true, color: COLOR_MUTED }
      ),
    ]),
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("Escrito:", OUT);
});
