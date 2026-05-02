import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import pdfWorkerUrl from './pdfWorker';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type PositionedText = {
  str: string;
  x: number;
  y: number;
};

const groupPdfTextIntoLines = (items: PositionedText[]) => {
  const sorted = [...items].sort((a, b) => {
    const verticalDelta = Math.abs(b.y - a.y);
    if (verticalDelta <= 2) {
      return a.x - b.x;
    }

    return b.y - a.y;
  });

  const lines: PositionedText[][] = [];

  sorted.forEach((item) => {
    const currentLine = lines[lines.length - 1];
    if (!currentLine) {
      lines.push([item]);
      return;
    }

    const sameLine = Math.abs(currentLine[0].y - item.y) <= 2;
    if (sameLine) {
      currentLine.push(item);
      return;
    }

    lines.push([item]);
  });

  return lines
    .map((line) =>
      line
        .sort((a, b) => a.x - b.x)
        .map((item) => item.str.trim())
        .filter(Boolean)
        .join(' '),
    )
    .filter(Boolean);
};

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pages: string[] = [];

    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const positionedText = content.items
        .map((item: any) => ({
          str: String(item.str ?? ''),
          x: Number(item.transform?.[4] ?? 0),
          y: Number(item.transform?.[5] ?? 0),
        }))
        .filter((item) => item.str.trim());

      pages.push(groupPdfTextIntoLines(positionedText).join('\n'));
    }

    return pages.join('\n\n').trim();
  } catch (error) {
    console.error('PDF Extraction Error:', error);
    throw new Error('Could not extract text from PDF. The file might be corrupted or encrypted.');
  }
};

export const extractTextFromDOCX = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  } catch (error) {
    console.error('DOCX Extraction Error:', error);
    throw new Error('Could not extract text from DOCX.');
  }
};

export const parseResumeFile = async (file: File): Promise<string> => {
  if (file.type === 'application/pdf') {
    return extractTextFromPDF(file);
  }

  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.endsWith('.docx')
  ) {
    return extractTextFromDOCX(file);
  }

  throw new Error('Unsupported file format. Please upload PDF or DOCX.');
};
