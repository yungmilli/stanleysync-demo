import fs from "node:fs";
import path from "node:path";

type PdfTable = {
  headers: string[];
  rows: string[][];
  widths?: number[];
};

type PdfSection = {
  title: string;
  lines?: string[];
  table?: PdfTable;
};

export type ProfessionalPdfInput = {
  title: string;
  documentNumber: string;
  status?: string | null;
  customerBlock: string[];
  meta: Array<[string, string]>;
  sections: PdfSection[];
  totals?: Array<[string, string]>;
  footer?: string;
  contactBlock?: string[];
  terms?: string[];
  signatureLabel?: string;
  logoUrl?: string | null;
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BOTTOM_MARGIN = 62;
const BRAND_LOGO_PATH = path.join("public", "brand", "stanleysync-ai-logo.jpg");

function escapePdfText(value: string) {
  return value
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function formatLine(value: string | null | undefined) {
  const trimmed = String(value ?? "").replace(/\s+/g, " ").trim();
  return trimmed.length > 0 ? trimmed : "Not provided";
}

function resolvePublicAsset(relativePath: string) {
  const candidates = [
    path.join(process.cwd(), relativePath),
    path.join(process.cwd(), "apps", "quoteflow", relativePath),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function getJpegSize(buffer: Buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return null;
}

function loadLogo(logoUrl?: string | null) {
  const relativeLogoPath = logoUrl?.startsWith("/")
    ? logoUrl.slice(1)
    : logoUrl;
  const logoPath = resolvePublicAsset(relativeLogoPath || BRAND_LOGO_PATH) ?? resolvePublicAsset(BRAND_LOGO_PATH);
  if (!logoPath) return null;
  const buffer = fs.readFileSync(logoPath);
  const size = getJpegSize(buffer);
  if (!size) return null;
  return { buffer, ...size };
}

function rgb(r: number, g: number, b: number) {
  return `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)}`;
}

function textCommand(text: string, x: number, y: number, size = 10, font = "F1", color = rgb(20, 31, 43)) {
  return `BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escapePdfText(text)}) Tj ET`;
}

function lineCommand(x1: number, y1: number, x2: number, y2: number, color = rgb(205, 214, 222), width = 0.8) {
  return `q ${color} RG ${width} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S Q`;
}

function rectCommand(x: number, y: number, width: number, height: number, fill: string, stroke?: string) {
  const draw = stroke ? `${stroke} RG ${fill} rg ${x} ${y} ${width} ${height} re B` : `${fill} rg ${x} ${y} ${width} ${height} re f`;
  return `q ${draw} Q`;
}

function imageCommand(x: number, y: number, width: number, height: number) {
  return `q ${width.toFixed(2)} 0 0 ${height.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im1 Do Q`;
}

function wrapText(value: string, maxWidth: number, size = 10) {
  const maxChars = Math.max(18, Math.floor(maxWidth / (size * 0.52)));
  const words = formatLine(value).split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function fitImage(width: number, height: number, maxWidth: number, maxHeight: number) {
  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return { width: width * ratio, height: height * ratio };
}

function buildPageAwareContent(input: ProfessionalPdfInput, logo: ReturnType<typeof loadLogo>) {
  const pages: string[][] = [[]];
  let y = PAGE_HEIGHT - 50;

  const current = () => pages[pages.length - 1];
  const ensureSpace = (height: number) => {
    if (y - height >= BOTTOM_MARGIN) return;
    pages.push([]);
    y = PAGE_HEIGHT - 54;
  };
  const addText = (value: string, x: number, size = 10, font = "F1", color = rgb(20, 31, 43), width = CONTENT_WIDTH) => {
    const lines = wrapText(value, width, size);
    ensureSpace(lines.length * (size + 4) + 2);
    for (const line of lines) {
      current().push(textCommand(line, x, y, size, font, color));
      y -= size + 4;
    }
  };
  const addLabelValue = (label: string, value: string, x: number) => {
    ensureSpace(18);
    current().push(textCommand(label.toUpperCase(), x, y, 7, "F2", rgb(103, 113, 124)));
    const lines = wrapText(formatLine(value), 146, 8).slice(0, 2);
    lines.forEach((line, index) => current().push(textCommand(line, x + 98, y - index * 10, 8, "F1", rgb(20, 31, 43))));
    y -= Math.max(16, lines.length * 10 + 6);
  };
  const addSectionTitle = (title: string) => {
    ensureSpace(32);
    y -= 10;
    current().push(textCommand(title.toUpperCase(), MARGIN, y, 9, "F2", rgb(8, 80, 115)));
    y -= 8;
    current().push(lineCommand(MARGIN, y, PAGE_WIDTH - MARGIN, y, rgb(187, 205, 216), 0.8));
    y -= 14;
  };
  const addTable = (table: PdfTable) => {
    const widths = table.widths ?? table.headers.map(() => CONTENT_WIDTH / table.headers.length);
    const normalizedWidths = widths.map((width) => width * (CONTENT_WIDTH / widths.reduce((sum, item) => sum + item, 0)));
    ensureSpace(56);
    let x = MARGIN;
    current().push(rectCommand(MARGIN, y - 16, CONTENT_WIDTH, 22, rgb(235, 241, 245)));
    for (const [index, header] of table.headers.entries()) {
      current().push(textCommand(header, x + 6, y - 8, 8, "F2", rgb(40, 52, 64)));
      x += normalizedWidths[index];
    }
    y -= 25;
    for (const row of table.rows) {
      const cellLines = row.map((cell, index) => wrapText(cell, normalizedWidths[index] - 12, 8).slice(0, 4));
      const rowHeight = Math.max(24, Math.max(...cellLines.map((lines) => lines.length)) * 10 + 14);
      ensureSpace(rowHeight + 6);
      x = MARGIN;
      current().push(lineCommand(MARGIN, y + 7, PAGE_WIDTH - MARGIN, y + 7, rgb(226, 232, 237), 0.5));
      for (const [index, lines] of cellLines.entries()) {
        lines.forEach((line, lineIndex) => {
          current().push(textCommand(line, x + 6, y - lineIndex * 10, lineIndex === 0 ? 8 : 7, "F1", lineIndex === 0 ? rgb(20, 31, 43) : rgb(89, 101, 113)));
        });
        x += normalizedWidths[index];
      }
      y -= rowHeight;
    }
    y -= 6;
  };

  current().push(rectCommand(0, PAGE_HEIGHT - 118, PAGE_WIDTH, 118, rgb(12, 22, 33)));
  current().push(rectCommand(0, PAGE_HEIGHT - 122, PAGE_WIDTH, 4, rgb(16, 163, 206)));
  if (logo) {
    const logoBox = fitImage(logo.width, logo.height, 72, 54);
    current().push(imageCommand(MARGIN, PAGE_HEIGHT - 95, logoBox.width, logoBox.height));
  } else {
    current().push(textCommand("StanleySync", MARGIN, PAGE_HEIGHT - 72, 18, "F2", rgb(255, 255, 255)));
  }
  current().push(textCommand("STANLEYSYNC APP", MARGIN + 88, PAGE_HEIGHT - 58, 8, "F2", rgb(125, 214, 242)));
  current().push(textCommand("Quote. Track. Invoice. All in one place.", MARGIN + 88, PAGE_HEIGHT - 76, 10, "F1", rgb(230, 237, 243)));
  current().push(textCommand(input.title.toUpperCase(), PAGE_WIDTH - 230, PAGE_HEIGHT - 60, 23, "F2", rgb(255, 255, 255)));
  current().push(textCommand(input.documentNumber, PAGE_WIDTH - 230, PAGE_HEIGHT - 83, 11, "F1", rgb(205, 218, 229)));
  if (input.status) {
    current().push(rectCommand(PAGE_WIDTH - 230, PAGE_HEIGHT - 108, 120, 17, rgb(14, 121, 152)));
    current().push(textCommand(input.status.toUpperCase(), PAGE_WIDTH - 222, PAGE_HEIGHT - 103, 8, "F2", rgb(255, 255, 255)));
  }

  y = PAGE_HEIGHT - 148;
  current().push(textCommand("BILL TO / CUSTOMER", MARGIN, y, 8, "F2", rgb(8, 80, 115)));
  current().push(textCommand("BUSINESS / CONTACT", 332, y, 8, "F2", rgb(8, 80, 115)));
  y -= 18;
  const customerLines = input.customerBlock.map(formatLine);
  const contactLines = (input.contactBlock?.length ? input.contactBlock : ["StanleySync App", "hello@stanleysync.app", "Company profile not configured"]).map(formatLine);
  const blockStartY = y;
  const customerWrapped = customerLines.flatMap((line) => wrapText(line, 238, 9)).slice(0, 7);
  const contactWrapped = contactLines.flatMap((line) => wrapText(line, 210, 9)).slice(0, 7);
  customerWrapped.forEach((line, index) => current().push(textCommand(line, MARGIN, blockStartY - index * 13, 9)));
  contactWrapped.forEach((line, index) => current().push(textCommand(line, 332, blockStartY - index * 13, 9)));
  y -= Math.max(customerWrapped.length, contactWrapped.length, 3) * 13 + 18;

  addSectionTitle("Document Details");
  for (let index = 0; index < input.meta.length; index += 2) {
    const [leftLabel, leftValue] = input.meta[index];
    const right = input.meta[index + 1];
    addLabelValue(leftLabel, leftValue, MARGIN);
    if (right) {
      y += 16;
      addLabelValue(right[0], right[1], 332);
    }
  }

  for (const section of input.sections) {
    addSectionTitle(section.title);
    if (section.table) addTable(section.table);
    for (const line of section.lines ?? []) addText(line, MARGIN, 9, "F1", rgb(20, 31, 43), CONTENT_WIDTH);
  }

  if (input.totals?.length) {
    addSectionTitle("Totals");
    const boxWidth = 240;
    const boxX = PAGE_WIDTH - MARGIN - boxWidth;
    ensureSpace(input.totals.length * 20 + 24);
    current().push(rectCommand(boxX, y - input.totals.length * 20 - 8, boxWidth, input.totals.length * 20 + 22, rgb(245, 248, 250), rgb(210, 220, 228)));
    for (const [index, [label, value]] of input.totals.entries()) {
      const isLast = index === input.totals.length - 1;
      current().push(textCommand(label, boxX + 12, y - index * 20, isLast ? 11 : 9, isLast ? "F2" : "F1"));
      current().push(textCommand(value, boxX + 138, y - index * 20, isLast ? 11 : 9, isLast ? "F2" : "F1"));
    }
    y -= input.totals.length * 20 + 24;
  }

  addSectionTitle("Terms and Approval");
  for (const term of input.terms ?? ["This document is subject to final scope confirmation, schedule availability, and written approval."]) {
    addText(term, MARGIN, 8, "F1", rgb(62, 74, 86), CONTENT_WIDTH);
  }
  ensureSpace(70);
  y -= 10;
  current().push(lineCommand(MARGIN, y, MARGIN + 190, y, rgb(84, 99, 112), 0.8));
  current().push(lineCommand(330, y, 520, y, rgb(84, 99, 112), 0.8));
  current().push(textCommand(input.signatureLabel ?? "Authorized signature", MARGIN, y - 13, 8, "F1", rgb(85, 97, 109)));
  current().push(textCommand("Printed name / date", 330, y - 13, 8, "F1", rgb(85, 97, 109)));

  const pageCount = pages.length;
  pages.forEach((page, index) => {
    page.push(lineCommand(MARGIN, 42, PAGE_WIDTH - MARGIN, 42, rgb(211, 220, 228), 0.6));
    page.push(textCommand(wrapText(input.footer ?? "Generated by StanleySync App.", 390, 7)[0] ?? "", MARGIN, 28, 7, "F1", rgb(103, 113, 124)));
    page.push(textCommand(`Page ${index + 1} of ${pageCount}`, PAGE_WIDTH - 110, 28, 7, "F1", rgb(103, 113, 124)));
  });

  return pages.map((page) => page.join("\n"));
}

function objectBuffer(id: number, content: Buffer | string) {
  const body = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");
  return Buffer.concat([Buffer.from(`${id} 0 obj\n`, "utf8"), body, Buffer.from("\nendobj\n", "utf8")]);
}

function buildPdf(objects: Array<Buffer | string>) {
  const header = Buffer.from("%PDF-1.4\n", "utf8");
  const bodyParts: Buffer[] = [];
  const offsets = [0];
  let cursor = header.length;
  for (const [index, object] of objects.entries()) {
    offsets.push(cursor);
    const buffer = objectBuffer(index + 1, object);
    bodyParts.push(buffer);
    cursor += buffer.length;
  }
  const body = Buffer.concat(bodyParts);
  const xrefStart = header.length + body.length;
  const xref = [
    "xref",
    `0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    "startxref",
    String(xrefStart),
    "%%EOF",
  ].join("\n");
  return Buffer.concat([header, body, Buffer.from(xref, "utf8")]);
}

export function createSimplePdf(title: string, lines: string[]) {
  return createProfessionalPdf({
    title,
    documentNumber: title,
    customerBlock: ["StanleySync customer"],
    meta: [["Issue date", new Date().toLocaleDateString("en-US")]],
    sections: [{ title: "Details", lines }],
  });
}

export function createProfessionalPdf(input: ProfessionalPdfInput) {
  const logo = loadLogo(input.logoUrl);
  const pageStreams = buildPageAwareContent(input, logo);
  const hasLogo = Boolean(logo);
  const imageId = hasLogo ? 5 : null;
  const firstPageId = hasLogo ? 6 : 5;
  const firstContentId = firstPageId + pageStreams.length;
  const pageIds = pageStreams.map((_, index) => firstPageId + index);
  const contentIds = pageStreams.map((_, index) => firstContentId + index);
  const resources = `<< /Font << /F1 3 0 R /F2 4 0 R >>${hasLogo ? ` /XObject << /Im1 ${imageId} 0 R >>` : ""} >>`;
  const objects: Array<Buffer | string> = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];

  if (logo) {
    const imageHeader = `<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.buffer.length} >>\nstream\n`;
    objects.push(Buffer.concat([Buffer.from(imageHeader, "utf8"), logo.buffer, Buffer.from("\nendstream", "utf8")]));
  }

  for (const [index] of pageStreams.entries()) {
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources ${resources} /Contents ${contentIds[index]} 0 R >>`);
  }
  for (const stream of pageStreams) {
    objects.push(`<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`);
  }

  return buildPdf(objects);
}

export function pdfResponse(fileName: string, buffer: Buffer) {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
