
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { createWorker } from 'tesseract.js';
import { LogContext, makeLogContext } from './logger';

// Supported MIME types
const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif'
];


// Text Extraction Functions
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}

async function extractTextFromWord(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function extractTextFromExcel(buffer: Buffer): Promise<string> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  return workbook.SheetNames.map(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_csv(worksheet);
  }).join('\n\n');
}

async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(buffer);
  await worker.terminate();
  return text;
}



export async function extractText(logContext: LogContext, filename: string, mimetype: string, data: string) {
      // Check supported types
    if (!mimetype || !SUPPORTED_MIME_TYPES.includes(mimetype)) {
      throw new Error(`Unknow or unsupported file mime type: ${mimetype}`);
    }

    // Decode Base64
    const buffer = Buffer.from(data, 'base64');
    let extractedText = '';

    // Process based on file type
    switch (mimetype.toLowerCase()) {
      case 'application/pdf':
        extractedText = await extractTextFromPDF(buffer);
        break;

      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        extractedText = await extractTextFromWord(buffer);
        break;

      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        extractedText = await extractTextFromExcel(buffer);
        break;

      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
        extractedText = await extractTextFromImage(buffer);
        break;

      default:
        throw new Error(`This most likely is a code error. unhandled file type: ${mimetype}`);
    }

    return extractedText;

}
