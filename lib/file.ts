import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

export async function ensureUploadDir() {
  await fs.mkdir(uploadDir, { recursive: true });
}

export async function persistUploadedFile(file: File, prefix = '') {
  await ensureUploadDir();
  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = `${Date.now()}-${prefix}-${file.name}`.replace(/\s+/g, '-');
  const fullPath = path.join(uploadDir, safeName);
  await fs.writeFile(fullPath, buffer);
  return { fullPath, fileName: safeName, buffer };
}

export async function extractTextFromFile(fileName: string, mimeType: string, buffer: Buffer) {
  const lowerName = fileName.toLowerCase();

  if (mimeType.includes('pdf') || lowerName.endsWith('.pdf')) {
    const parsed = await pdfParse(buffer);
    return parsed.text;
  }

  if (
    mimeType.includes('word') ||
    mimeType.includes('officedocument.wordprocessingml') ||
    lowerName.endsWith('.docx')
  ) {
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value;
  }

  return buffer.toString('utf8');
}
