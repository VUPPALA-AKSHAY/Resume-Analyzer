import mammoth from "mammoth";

const RESUME_SECTION_MARKERS = [
  "experience",
  "education",
  "skills",
  "projects",
  "summary",
  "professional summary",
  "work history",
  "employment",
  "certifications",
  "technical skills",
];

export function looksLikeResume(text: string): boolean {
  const quickText = text.toLowerCase();
  const quickWordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const quickCharacterCount = text.trim().length;
  const quickSignalCount = [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text),
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/.test(text),
    /(linkedin\.com\/|github\.com\/|portfolio|behance|dribbble)/i.test(text),
    RESUME_SECTION_MARKERS.some((marker) => quickText.includes(marker)),
    /\b(?:19|20)\d{2}\b|\bpresent\b/i.test(text),
    /(engineer|developer|designer|manager|analyst|intern|consultant|specialist|lead|student)/i.test(text),
    /(university|college|bachelor|master|degree|b\.?tech|m\.?tech|cgpa|gpa)/i.test(text),
    /(javascript|typescript|react|next\.?js|node\.?js|python|java|sql|aws|azure|docker|api|machine learning|ai)/i.test(text),
  ].filter(Boolean).length;

  if (quickWordCount >= 25 && quickCharacterCount >= 100 && quickSignalCount >= 2) {
    return true;
  }

  const normalizedText = text.toLowerCase();
  const sectionMatches = RESUME_SECTION_MARKERS.filter((marker) =>
    normalizedText.includes(marker)
  );
  const coreSectionMatches = ["experience", "education", "skills", "projects"].filter(
    (marker) => normalizedText.includes(marker)
  );

  const emailMatch = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text);
  const phoneMatch =
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/.test(text);
  const profileLinkMatch = /(linkedin\.com\/|github\.com\/|portfolio|behance|dribbble)/i.test(text);
  const bulletCount = (text.match(/^\s*[-*•]\s+/gm) || []).length;
  const yearCount = (text.match(/\b(?:19|20)\d{2}\b/g) || []).length;
  const roleKeywordMatch =
    /(engineer|developer|designer|manager|analyst|intern|consultant|specialist|lead|student)/i.test(text);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const hasContactSignal = emailMatch || phoneMatch || profileLinkMatch;
  const hasTimelineSignal = yearCount >= 2 || /\bpresent\b/i.test(text);
  const hasResumeSections = coreSectionMatches.length >= 2 && sectionMatches.length >= 3;

  if (wordCount < 60) {
    return false;
  }

  return (
    (hasContactSignal && coreSectionMatches.length >= 2 && (sectionMatches.length >= 3 || hasTimelineSignal)) ||
    (hasResumeSections && hasTimelineSignal && roleKeywordMatch) ||
    (coreSectionMatches.length >= 1 && bulletCount >= 3 && hasTimelineSignal && roleKeywordMatch)
  );
}

class MinimalDOMMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;

  constructor(init?: number[]) {
    const values = Array.isArray(init) ? init : [];
    this.a = values[0] ?? 1;
    this.b = values[1] ?? 0;
    this.c = values[2] ?? 0;
    this.d = values[3] ?? 1;
    this.e = values[4] ?? 0;
    this.f = values[5] ?? 0;
  }

  multiplySelf(other: MinimalDOMMatrix) {
    const [a, b, c, d, e, f] = [this.a, this.b, this.c, this.d, this.e, this.f];
    this.a = a * other.a + c * other.b;
    this.b = b * other.a + d * other.b;
    this.c = a * other.c + c * other.d;
    this.d = b * other.c + d * other.d;
    this.e = a * other.e + c * other.f + e;
    this.f = b * other.e + d * other.f + f;
    return this;
  }

  preMultiplySelf(other: MinimalDOMMatrix) {
    const current = new MinimalDOMMatrix([this.a, this.b, this.c, this.d, this.e, this.f]);
    this.a = other.a;
    this.b = other.b;
    this.c = other.c;
    this.d = other.d;
    this.e = other.e;
    this.f = other.f;
    return this.multiplySelf(current);
  }

  translate(tx = 0, ty = 0) {
    return new MinimalDOMMatrix([this.a, this.b, this.c, this.d, this.e, this.f]).translateSelf(tx, ty);
  }

  translateSelf(tx = 0, ty = 0) {
    this.e += tx;
    this.f += ty;
    return this;
  }

  scale(scaleX = 1, scaleY = scaleX) {
    return new MinimalDOMMatrix([this.a, this.b, this.c, this.d, this.e, this.f]).scaleSelf(scaleX, scaleY);
  }

  scaleSelf(scaleX = 1, scaleY = scaleX) {
    this.a *= scaleX;
    this.b *= scaleX;
    this.c *= scaleY;
    this.d *= scaleY;
    return this;
  }

  invertSelf() {
    const determinant = this.a * this.d - this.b * this.c;

    if (!determinant) {
      this.a = Number.NaN;
      this.b = Number.NaN;
      this.c = Number.NaN;
      this.d = Number.NaN;
      this.e = Number.NaN;
      this.f = Number.NaN;
      return this;
    }

    const [a, b, c, d, e, f] = [this.a, this.b, this.c, this.d, this.e, this.f];
    this.a = d / determinant;
    this.b = -b / determinant;
    this.c = -c / determinant;
    this.d = a / determinant;
    this.e = (c * f - d * e) / determinant;
    this.f = (b * e - a * f) / determinant;
    return this;
  }
}

type PdfTextItem = {
  str?: string;
  hasEOL?: boolean;
};

function installPdfJsShims() {
  const globalScope = globalThis as typeof globalThis & {
    DOMMatrix?: typeof DOMMatrix;
  };

  if (!globalScope.DOMMatrix) {
    globalScope.DOMMatrix = MinimalDOMMatrix as unknown as typeof DOMMatrix;
  }
}

async function parsePdf(buffer: Buffer): Promise<string> {
  installPdfJsShims();

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableAutoFetch: true,
    disableFontFace: true,
    disableRange: true,
    disableStream: true,
    isEvalSupported: false,
    isImageDecoderSupported: false,
    isOffscreenCanvasSupported: false,
    stopAtErrors: false,
    useSystemFonts: false,
    useWasm: false,
    useWorkerFetch: false,
  });

  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent({
        disableNormalization: false,
        includeMarkedContent: false,
      });
      const pageText = content.items
        .map((item) => {
          const textItem = item as PdfTextItem;
          return `${textItem.str ?? ""}${textItem.hasEOL ? "\n" : " "}`;
        })
        .join("")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (pageText) {
        pages.push(pageText);
      }
    }
  } finally {
    await pdf.destroy();
    await loadingTask.destroy();
  }

  return pages.join("\n\n");
}

export async function parseFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const normalizedMime = mimeType.toLowerCase();
  const normalizedName = fileName.toLowerCase();

  if (normalizedMime === "application/pdf" || normalizedName.endsWith(".pdf")) {
    try {
      return await parsePdf(buffer);
    } catch (error) {
      throw new Error("Please upload correct resume.");
    }
  }

  if (
    normalizedMime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    normalizedMime === "application/msword" ||
    normalizedName.endsWith(".doc") ||
    normalizedName.endsWith(".docx")
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "";
    } catch (error) {
      throw new Error("Please upload correct resume.");
    }
  }

  throw new Error("Please upload correct resume.");
}
