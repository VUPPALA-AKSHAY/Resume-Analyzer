import { createRequire } from "node:module";
import mammoth from "mammoth";

const require = createRequire(import.meta.url);

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

  if (wordCount < 60) {
    return false;
  }

  if (!hasContactSignal) {
    return false;
  }

  return (
    (coreSectionMatches.length >= 2 && (sectionMatches.length >= 3 || hasTimelineSignal)) ||
    (coreSectionMatches.length >= 1 && bulletCount >= 3 && hasTimelineSignal && roleKeywordMatch)
  );
}

type PdfParseInstance = {
  destroy(): Promise<void>;
  getText(): Promise<{ text?: string }>;
};

type PdfParseConstructor = new (options: { data: Buffer | Uint8Array }) => PdfParseInstance;

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

  private multiplyValues(values: [number, number, number, number, number, number]) {
    const [a, b, c, d, e, f] = values;
    const nextA = this.a * a + this.c * b;
    const nextB = this.b * a + this.d * b;
    const nextC = this.a * c + this.c * d;
    const nextD = this.b * c + this.d * d;
    const nextE = this.a * e + this.c * f + this.e;
    const nextF = this.b * e + this.d * f + this.f;

    this.a = nextA;
    this.b = nextB;
    this.c = nextC;
    this.d = nextD;
    this.e = nextE;
    this.f = nextF;
  }

  multiplySelf(other: MinimalDOMMatrix) {
    this.multiplyValues([other.a, other.b, other.c, other.d, other.e, other.f]);
    return this;
  }

  preMultiplySelf(other: MinimalDOMMatrix) {
    const current: [number, number, number, number, number, number] = [
      this.a,
      this.b,
      this.c,
      this.d,
      this.e,
      this.f,
    ];
    this.a = other.a;
    this.b = other.b;
    this.c = other.c;
    this.d = other.d;
    this.e = other.e;
    this.f = other.f;
    this.multiplyValues(current);
    return this;
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

    const nextA = this.d / determinant;
    const nextB = -this.b / determinant;
    const nextC = -this.c / determinant;
    const nextD = this.a / determinant;
    const nextE = (this.c * this.f - this.d * this.e) / determinant;
    const nextF = (this.b * this.e - this.a * this.f) / determinant;

    this.a = nextA;
    this.b = nextB;
    this.c = nextC;
    this.d = nextD;
    this.e = nextE;
    this.f = nextF;
    return this;
  }
}

function getPdfParseConstructor(): PdfParseConstructor {
  if (!globalThis.DOMMatrix) {
    globalThis.DOMMatrix = MinimalDOMMatrix as typeof globalThis.DOMMatrix;
  }

  const pdfParseModule = require("pdf-parse") as { PDFParse: PdfParseConstructor };
  return pdfParseModule.PDFParse;
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
      const PDFParse = getPdfParseConstructor();
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      await parser.destroy();
      return textResult.text || "";
    } catch (error) {
      console.error("Error parsing PDF file:", error);
      throw new Error("Failed to parse PDF file. Make sure it is a valid, unencrypted PDF.");
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
      console.error("Error parsing DOCX file:", error);
      throw new Error("Failed to parse DOCX file. Make sure it is a valid Word document.");
    }
  }

  throw new Error("Please upload correct resume.");
}
