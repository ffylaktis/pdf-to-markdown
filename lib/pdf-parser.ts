export interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
}

export interface PageContent {
  pageNumber: number;
  width: number;
  height: number;
  items: TextItem[];
}

export interface ParsedPDF {
  pages: PageContent[];
  totalPages: number;
}

export async function parsePDF(
  data: ArrayBuffer,
  onProgress?: (page: number, total: number) => void
): Promise<ParsedPDF> {
  // Dynamic import to avoid server-side pre-rendering issues (DOMMatrix not defined)
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages: PageContent[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();

    const items: TextItem[] = [];

    for (const item of textContent.items) {
      if (!("str" in item) || !item.str.trim()) continue;

      const tx = item.transform;
      items.push({
        text: item.str,
        x: tx[4],
        y: viewport.height - tx[5],
        width: item.width,
        height: item.height,
        fontSize: Math.abs(tx[0]) || Math.abs(tx[3]) || 12,
        fontName: item.fontName || "",
      });
    }

    pages.push({
      pageNumber: i,
      width: viewport.width,
      height: viewport.height,
      items,
    });

    onProgress?.(i, pdf.numPages);
  }

  return { pages, totalPages: pdf.numPages };
}
