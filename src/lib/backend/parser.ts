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

/**
 * Suppress noisy warnings from unpdf/pdfjs internals during PDF parsing.
 */
async function withSuppressedPdfWarnings<T>(callback: () => Promise<T>): Promise<T> {
  const originalWarn = console.warn;
  console.warn = (...args: Parameters<typeof console.warn>) => {
    const message = args.map(String).join(" ");
    if (
      message.includes("Indexing all PDF objects") ||
      message.includes("Unknown command") ||
      message.includes("Please use the `legacy` build") ||
      message.includes('Cannot load "@napi-rs/canvas"') ||
      message.includes("Cannot polyfill")
    ) {
      return;
    }
    originalWarn(...args);
  };

  try {
    return await callback();
  } finally {
    console.warn = originalWarn;
  }
}

/**
 * Parse PDF using `unpdf` — a Node.js-native PDF text extractor that doesn't
 * rely on browser globals (DOMMatrix, Path2D) or web workers, avoiding the
 * Turbopack bundling issues that plague pdfjs-dist in Next.js server routes.
 */
async function parsePdf(buffer: Buffer): Promise<string> {
  const { extractText } = await import("unpdf");

  const result = await withSuppressedPdfWarnings(async () => {
    return extractText(new Uint8Array(buffer));
  });

  // unpdf returns an array of strings (one per page)
  const pages = Array.isArray(result.text) ? result.text : [result.text];

  const fullText = pages
    .map((pageText: string) =>
      pageText
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
    )
    .filter(Boolean)
    .join("\n\n");

  console.log(`[Parser] unpdf extracted ${fullText.length} chars from ${result.totalPages} page(s).`);
  return fullText;
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
      console.error("[Parser] PDF parsing failed:", error);
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
