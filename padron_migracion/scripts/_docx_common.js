// Estilo compartido para los .docx del pipeline (branding, tablas, helpers).
const {
  Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, LevelFormat,
} = require("docx");

const COLOR_HEADER_BG = "1F3B57";
const COLOR_HEADER_TEXT = "FFFFFF";
const COLOR_ACCENT = "1F3B57";
const COLOR_MUTED = "595959";
const COLOR_GOOD = "1E7B34";
const COLOR_WARN = "8A6D00";
const COLOR_BAD = "B02A2A";

const NUMBERING_CONFIG = [
  {
    reference: "bullets",
    levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 420, hanging: 260 } } } }],
  },
  {
    reference: "steps",
    levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 420, hanging: 260 } } } }],
  },
];

function cellPara(text, opts = {}) {
  // "\n" no genera salto de línea real en un TextRun — se parte en runs con `break`.
  const lineas = String(text).split("\n");
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    children: lineas.map(
      (linea, i) => new TextRun({ text: linea, bold: !!opts.bold, color: opts.color, break: i > 0 ? 1 : 0 })
    ),
  });
}

function headerCell(text, widthDxa) {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: COLOR_HEADER_BG },
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [cellPara(text, { bold: true, color: COLOR_HEADER_TEXT })],
  });
}

function dataCell(text, widthDxa, opts = {}) {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    margins: { top: 90, bottom: 90, left: 120, right: 120 },
    children: [cellPara(text, opts)],
  });
}

function countTable(headers, rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => headerCell(h, widths[i])) }),
      ...rows.map(
        (r) => new TableRow({ children: r.map((c, i) => dataCell(c.text, widths[i], c.opts)) })
      ),
    ],
  });
}

function hr() {
  return new Paragraph({
    border: { bottom: { color: "BFBFBF", space: 4, style: BorderStyle.SINGLE, size: 6 } },
    spacing: { after: 200 },
  });
}

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 140 }, children: [new TextRun({ text, color: COLOR_ACCENT })] });
}

function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 100 }, children: [new TextRun({ text, color: COLOR_ACCENT })] });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({ text, italics: !!opts.italics, bold: !!opts.bold, color: opts.color })],
  });
}

function bullet(text, opts = {}) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 90 },
    children: [
      ...(opts.lead ? [new TextRun({ text: opts.lead, bold: true }), new TextRun({ text: " " })] : []),
      new TextRun({ text }),
    ],
  });
}

function step(text, opts = {}) {
  return new Paragraph({
    numbering: { reference: "steps", level: 0 },
    spacing: { after: 120 },
    children: [
      ...(opts.lead ? [new TextRun({ text: opts.lead, bold: true }), new TextRun({ text: " " })] : []),
      new TextRun({ text }),
    ],
  });
}

function noteBox(lines, opts = {}) {
  const fill = opts.fill || "FFF6E5";
  const borderColor = opts.borderColor || COLOR_WARN;
  return new Table({
    width: { size: 9640, type: WidthType.DXA },
    columnWidths: [9640],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
      left: { style: BorderStyle.SINGLE, size: 12, color: borderColor },
      right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 9640, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill },
            margins: { top: 160, bottom: 160, left: 220, right: 220 },
            children: lines.map(
              (l, i) => new Paragraph({
                spacing: { after: i === lines.length - 1 ? 0 : 80 },
                children: [new TextRun({ text: l.text, bold: !!l.bold, color: l.color })],
              })
            ),
          }),
        ],
      }),
    ],
  });
}

function letterPageSection(children) {
  return {
    properties: {
      page: {
        size: { width: 12240, height: 15840 }, // US Letter
        margin: { top: 1080, bottom: 1080, left: 1260, right: 1260 },
      },
    },
    children,
  };
}

function brandHeader(title, subtitle, meta) {
  const out = [
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: "JUSTICIA ELECTORAL — GABINETE", size: 18, color: COLOR_MUTED, bold: true })],
    }),
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { after: 60 },
      children: [new TextRun({ text: title, color: COLOR_ACCENT })],
    }),
  ];
  if (subtitle) {
    out.push(new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: subtitle, size: 26, color: COLOR_ACCENT })],
    }));
  }
  if (meta) {
    out.push(new Paragraph({
      spacing: { after: 260 },
      children: [new TextRun({ text: meta, size: 20, color: COLOR_MUTED, italics: true })],
    }));
  }
  out.push(hr());
  return out;
}

module.exports = {
  COLOR_HEADER_BG, COLOR_HEADER_TEXT, COLOR_ACCENT, COLOR_MUTED, COLOR_GOOD, COLOR_WARN, COLOR_BAD,
  NUMBERING_CONFIG,
  cellPara, headerCell, dataCell, countTable, hr, h1, h2, body, bullet, step, noteBox,
  letterPageSection, brandHeader,
};
