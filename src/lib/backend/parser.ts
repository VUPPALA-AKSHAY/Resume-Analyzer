import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import "pdfjs-dist/legacy/build/pdf.worker.mjs";

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

export async function parseFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const normalizedMime = mimeType.toLowerCase();
  const normalizedName = fileName.toLowerCase();

  if (normalizedMime === "application/pdf" || normalizedName.endsWith(".pdf")) {
    try {
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
