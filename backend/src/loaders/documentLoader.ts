import pdf from "pdf-parse";
import mammoth from "mammoth";
import type { LoadedDocument, LoadedSection } from "../types/domain.js";
import { AppError } from "../middleware/errors.js";
import type { SupportedFileType } from "./fileTypes.js";

export async function loadDocumentText(
  buffer: Buffer,
  fileType: SupportedFileType
): Promise<LoadedDocument> {
  try {
    if (fileType === "pdf") return loadPdf(buffer);
    if (fileType === "docx") return loadDocx(buffer);
    return loadPlainText(buffer, fileType);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      422,
      "The file could not be parsed. It may be encrypted, corrupted, or unsupported.",
      "DOCUMENT_PARSE_FAILED",
      error instanceof Error ? error.message : undefined
    );
  }
}

async function loadPdf(buffer: Buffer): Promise<LoadedDocument> {
  const pages: string[] = [];
  let pageNumber = 0;

  const result = await pdf(buffer, {
    pagerender: async (pageData: {
      getTextContent: () => Promise<{ items: Array<{ str?: string }> }>;
    }) => {
      pageNumber += 1;
      const content = await pageData.getTextContent();
      const text = content.items
        .map((item) => item.str ?? "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      pages[pageNumber - 1] = text;
      return text;
    }
  });

  const pageTexts = pages.filter(Boolean);
  const text = (pageTexts.length ? pageTexts.join("\n\n") : result.text).trim();
  assertHasText(text);

  return {
    text,
    pageCount: result.numpages,
    sections: pageTexts.length
      ? pageTexts.map((pageText, index) => ({
          text: pageText,
          pageNumber: index + 1
        }))
      : [{ text }]
  };
}

async function loadDocx(buffer: Buffer): Promise<LoadedDocument> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value.trim();
  assertHasText(text);
  return {
    text,
    sections: detectSections(text, "docx")
  };
}

function loadPlainText(buffer: Buffer, fileType: "txt" | "md"): LoadedDocument {
  const text = buffer.toString("utf8").trim();
  assertHasText(text);
  return {
    text,
    sections: detectSections(text, fileType)
  };
}

function assertHasText(text: string) {
  if (!text.replace(/\s+/g, "").length) {
    throw new AppError(
      422,
      "No readable text was found in this file.",
      "EMPTY_DOCUMENT_TEXT"
    );
  }
}

function detectSections(text: string, fileType: SupportedFileType): LoadedSection[] {
  const lines = text.split(/\r?\n/);
  const sections: LoadedSection[] = [];
  let currentHeading: string | undefined;
  let buffer: string[] = [];

  const flush = () => {
    const body = buffer.join("\n").trim();
    if (body) sections.push({ text: body, heading: currentHeading });
    buffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const markdownHeading = /^#{1,6}\s+(.+)$/.exec(trimmed);
    const plainHeading =
      fileType !== "md" && trimmed.length >= 4 && trimmed.length <= 90 && /^[A-Z][A-Za-z0-9 ,:()/-]+$/.test(trimmed);

    if (markdownHeading || plainHeading) {
      flush();
      currentHeading = markdownHeading ? markdownHeading[1].trim() : trimmed;
      buffer.push(line);
    } else {
      buffer.push(line);
    }
  }

  flush();
  return sections.length ? sections : [{ text }];
}
