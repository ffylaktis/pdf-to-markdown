import type { ParsedPDF, TextItem } from "./pdf-parser";

interface Line {
  y: number;
  items: TextItem[];
  text: string;
  fontSize: number;
  fontName: string;
  x: number;
}

export function convertToMarkdown(pdf: ParsedPDF): string {
  const allLines: Line[][] = pdf.pages.map((page) => assembleLines(page.items));
  const medianFontSize = getMedianFontSize(allLines.flat());

  const markdownPages: string[] = allLines.map((lines) =>
    processPage(lines, medianFontSize)
  );

  return markdownPages.join("\n\n---\n\n").trim();
}

function assembleLines(items: TextItem[]): Line[] {
  if (items.length === 0) return [];

  // Sort by y position (top to bottom), then x (left to right)
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);

  const lines: Line[] = [];
  let currentLine: TextItem[] = [sorted[0]];
  let currentY = sorted[0].y;

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    // Items within 3px vertically are on the same line
    if (Math.abs(item.y - currentY) <= 3) {
      currentLine.push(item);
    } else {
      lines.push(createLine(currentLine));
      currentLine = [item];
      currentY = item.y;
    }
  }
  if (currentLine.length > 0) {
    lines.push(createLine(currentLine));
  }

  return lines;
}

function createLine(items: TextItem[]): Line {
  const sorted = [...items].sort((a, b) => a.x - b.x);
  // Join items with appropriate spacing
  let text = "";
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) {
      const gap = sorted[i].x - (sorted[i - 1].x + sorted[i - 1].width);
      text += gap > sorted[i].fontSize * 0.3 ? " " : "";
    }
    text += sorted[i].text;
  }

  return {
    y: items[0].y,
    items: sorted,
    text: text.trim(),
    fontSize: sorted[0].fontSize,
    fontName: sorted[0].fontName,
    x: sorted[0].x,
  };
}

function getMedianFontSize(lines: Line[]): number {
  if (lines.length === 0) return 12;
  const sizes = lines.map((l) => l.fontSize).sort((a, b) => a - b);
  return sizes[Math.floor(sizes.length / 2)];
}

function processPage(lines: Line[], medianFontSize: number): string {
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Detect tables: 3+ consecutive lines with consistent column structure
    const tableEnd = detectTable(lines, i);
    if (tableEnd > i) {
      blocks.push(buildTable(lines.slice(i, tableEnd)));
      i = tableEnd;
      continue;
    }

    // Detect list items
    const listMatch = line.text.match(
      /^(\s*)([-*\u2022\u2023\u25E6]|\d+[.)]\s|[a-z][.)]\s)/
    );
    if (listMatch) {
      blocks.push(formatListItem(line));
      i++;
      continue;
    }

    // Detect headings by font size
    if (line.fontSize > medianFontSize * 1.3 && line.text.length < 200) {
      const level = getHeadingLevel(line.fontSize, medianFontSize);
      const prefix = "#".repeat(level);
      blocks.push(`${prefix} ${applyInlineFormatting(line)}`);
      i++;
      continue;
    }

    // Regular paragraph - collect consecutive lines with similar font size
    const paraLines: string[] = [];
    while (i < lines.length) {
      const current = lines[i];
      const next = lines[i + 1];

      // Stop if next line looks like a heading, list, or has a large gap
      if (
        current.fontSize > medianFontSize * 1.3 &&
        paraLines.length > 0
      )
        break;
      if (
        current.text.match(
          /^(\s*)([-*\u2022\u2023\u25E6]|\d+[.)]\s|[a-z][.)]\s)/
        ) &&
        paraLines.length > 0
      )
        break;

      paraLines.push(applyInlineFormatting(current));
      i++;

      // Paragraph break: large vertical gap
      if (next) {
        const gap = next.y - current.y;
        const lineHeight = current.fontSize * 1.5;
        if (gap > lineHeight * 1.5) break;
      }
    }

    if (paraLines.length > 0) {
      blocks.push(paraLines.join(" "));
    }
  }

  return blocks.join("\n\n");
}

function getHeadingLevel(fontSize: number, medianFontSize: number): number {
  const ratio = fontSize / medianFontSize;
  if (ratio > 2.0) return 1;
  if (ratio > 1.6) return 2;
  return 3;
}

function applyInlineFormatting(line: Line): string {
  // Check font name for bold/italic indicators
  const fontLower = line.fontName.toLowerCase();
  let text = line.text;

  if (fontLower.includes("bolditalic") || fontLower.includes("bold") && fontLower.includes("italic")) {
    text = `***${text}***`;
  } else if (fontLower.includes("bold")) {
    text = `**${text}**`;
  } else if (fontLower.includes("italic") || fontLower.includes("oblique")) {
    text = `*${text}*`;
  }

  return text;
}

function formatListItem(line: Line): string {
  const match = line.text.match(
    /^(\s*)([-*\u2022\u2023\u25E6]|\d+[.)]\s|[a-z][.)]\s)(.*)/
  );
  if (!match) return line.text;

  const content = match[3].trim();

  // Check if it's a numbered list
  if (/^\d+[.)]/.test(match[2])) {
    return `${match[2]}${content}`;
  }

  return `- ${content}`;
}

function detectTable(lines: Line[], startIdx: number): number {
  if (startIdx + 2 >= lines.length) return startIdx;

  // Check if 3+ consecutive lines have multiple items with similar x-positions (columns)
  const columnPositions = getColumnPositions(lines[startIdx]);
  if (columnPositions.length < 2) return startIdx;

  let endIdx = startIdx + 1;
  while (endIdx < lines.length) {
    const cols = getColumnPositions(lines[endIdx]);
    if (cols.length < 2 || !columnsMatch(columnPositions, cols)) break;
    endIdx++;
  }

  // Need at least 2 rows to be a table
  return endIdx - startIdx >= 2 ? endIdx : startIdx;
}

function getColumnPositions(line: Line): number[] {
  if (line.items.length < 2) return [];

  // Cluster x positions
  const positions: number[] = [];
  let lastX = -Infinity;

  for (const item of line.items) {
    if (item.x - lastX > item.fontSize * 2) {
      positions.push(item.x);
    }
    lastX = item.x + item.width;
  }

  return positions;
}

function columnsMatch(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const tolerance = 20;
  return a.every((pos, i) => Math.abs(pos - b[i]) < tolerance);
}

function buildTable(lines: Line[]): string {
  // Build cells for each row based on column positions
  const colPositions = getColumnPositions(lines[0]);
  const rows: string[][] = lines.map((line) => {
    const cells: string[] = new Array(colPositions.length).fill("");

    for (const item of line.items) {
      // Find which column this item belongs to
      let colIdx = 0;
      let minDist = Infinity;
      for (let c = 0; c < colPositions.length; c++) {
        const dist = Math.abs(item.x - colPositions[c]);
        if (dist < minDist) {
          minDist = dist;
          colIdx = c;
        }
      }
      cells[colIdx] = cells[colIdx]
        ? cells[colIdx] + " " + item.text
        : item.text;
    }

    return cells.map((c) => c.trim());
  });

  // Build markdown table
  const header = `| ${rows[0].join(" | ")} |`;
  const separator = `| ${rows[0].map(() => "---").join(" | ")} |`;
  const body = rows
    .slice(1)
    .map((row) => `| ${row.join(" | ")} |`)
    .join("\n");

  return `${header}\n${separator}\n${body}`;
}
