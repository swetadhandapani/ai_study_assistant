const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const textract = require('textract');

async function extractTextFromPDF(path) {
  const dataBuffer = fs.readFileSync(path);

  // Temporarily silence pdf-parse warnings
  const originalWarn = console.warn;
  console.warn = () => {};

  try {
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (err) {
    throw err;
  } finally {
    // Restore console.warn after parsing
    console.warn = originalWarn;
  }
}

// ✅ DOCX Extraction
async function extractTextFromDocx(path) {
  try {
    const result = await mammoth.extractRawText({ path });
    return result.value || '';
  } catch (err) {
    console.error('DOCX extraction failed:', err);
    throw err;
  }
}

// ✅ PPT / PPTX Extraction
async function extractTextFromPpt(path) {
  return new Promise((resolve, reject) => {
    textract.fromFileWithPath(path, (err, text) => {
      if (err) {
        console.error('PPT extraction failed:', err);
        return reject(err);
      }
      resolve(text || '');
    });
  });
}


module.exports = { extractTextFromPDF, extractTextFromDocx, extractTextFromPpt };
