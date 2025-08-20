import * as pdfjsLib from 'pdfjs-dist/webpack';

// Set up the worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extract text content from a PDF file
 * @param {File} file - The PDF file to extract text from
 * @returns {Promise<string>} - The extracted text content
 */
async function extractTextFromPDF(file) {
  try {
    console.log('📄 Starting PDF text extraction for:', file.name);
    
    // Read the file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log('📄 PDF loaded, pages:', pdf.numPages);
    
    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 20); // Limit to first 20 pages for performance
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine all text items from the page
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ')
          .trim();
        
        if (pageText) {
          fullText += `\n\n--- Page ${pageNum} ---\n${pageText}`;
        }
        
        console.log(`📄 Extracted text from page ${pageNum}: ${pageText.length} characters`);
      } catch (pageError) {
        console.warn(`📄 Failed to extract text from page ${pageNum}:`, pageError);
        fullText += `\n\n--- Page ${pageNum} ---\n[Text extraction failed for this page]`;
      }
    }
    
    if (pdf.numPages > maxPages) {
      fullText += `\n\n--- Note ---\nThis PDF has ${pdf.numPages} pages, but only the first ${maxPages} pages were processed for performance reasons.`;
    }
    
    // Clean up the text
    const cleanedText = fullText
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n\n')  // Clean up multiple newlines
      .trim();
    
    console.log('📄 PDF text extraction completed:', cleanedText.length, 'characters');
    
    // If the text is too long (over 100000 characters), provide a summary
    if (cleanedText.length > 100000) {
      const truncatedText = cleanedText.substring(0, 100000);
      return `${truncatedText}...\n\n[Document truncated - Full document has ${cleanedText.length} characters from ${pdf.numPages} pages]`;
    }
    
    return cleanedText || '[No text could be extracted from this PDF]';
    
  } catch (error) {
    console.error('📄 PDF text extraction failed:', error);
    return `[PDF text extraction failed: ${error.message}]`;
  }
}

/**
 * Extract text content from a TXT file
 * @param {File} file - The TXT file to extract text from
 * @returns {Promise<string>} - The extracted text content
 */
async function extractTextFromTXT(file) {
  try {
    console.log('📝 Starting TXT text extraction for:', file.name);
    const text = await file.text();
    console.log('📝 TXT text extraction completed:', text.length, 'characters');
    
    // Truncate if too long
    if (text.length > 100000) {
      const truncatedText = text.substring(0, 100000);
      return `${truncatedText}...\n\n[Document truncated - Full document has ${text.length} characters]`;
    }
    
    return text || '[No text found in this TXT file]';
  } catch (error) {
    console.error('📝 TXT text extraction failed:', error);
    return `[TXT text extraction failed: ${error.message}]`;
  }
}

/**
 * Extract text content from a CSV file
 * @param {File} file - The CSV file to extract text from
 * @returns {Promise<string>} - The extracted text content
 */
async function extractTextFromCSV(file) {
  try {
    console.log('📊 Starting CSV text extraction for:', file.name);
    const text = await file.text();
    
    // Add some basic formatting to make CSV more readable
    const lines = text.split('\n');
    let formattedText = `CSV File: ${file.name}\n\n`;
    
    if (lines.length > 0) {
      // First line is usually headers
      formattedText += `Headers: ${lines[0]}\n\n`;
      formattedText += `Data (${lines.length - 1} rows):\n`;
      formattedText += text;
    } else {
      formattedText += text;
    }
    
    console.log('📊 CSV text extraction completed:', formattedText.length, 'characters');
    
    // Truncate if too long
    if (formattedText.length > 100000) {
      const truncatedText = formattedText.substring(0, 100000);
      return `${truncatedText}...\n\n[Document truncated - Full CSV has ${formattedText.length} characters]`;
    }
    
    return formattedText || '[No text found in this CSV file]';
  } catch (error) {
    console.error('📊 CSV text extraction failed:', error);
    return `[CSV text extraction failed: ${error.message}]`;
  }
}

/**
 * Extract text content from a Markdown file
 * @param {File} file - The Markdown file to extract text from
 * @returns {Promise<string>} - The extracted text content
 */
async function extractTextFromMarkdown(file) {
  try {
    console.log('📝 Starting Markdown text extraction for:', file.name);
    const text = await file.text();
    
    // Markdown is already readable as plain text, but add a header
    let formattedText = `Markdown File: ${file.name}\n\n${text}`;
    
    console.log('📝 Markdown text extraction completed:', formattedText.length, 'characters');
    
    // Truncate if too long
    if (formattedText.length > 100000) {
      const truncatedText = formattedText.substring(0, 100000);
      return `${truncatedText}...\n\n[Document truncated - Full Markdown has ${formattedText.length} characters]`;
    }
    
    return formattedText || '[No text found in this Markdown file]';
  } catch (error) {
    console.error('📝 Markdown text extraction failed:', error);
    return `[Markdown text extraction failed: ${error.message}]`;
  }
}

/**
 * Extract text from DOC/DOCX files
 * Note: Full DOC/DOCX extraction requires a library like mammoth.js
 * For now, we'll provide a message that the file was uploaded but needs manual review
 * @param {File} file - The DOC/DOCX file
 * @returns {Promise<string>} - A message about the file
 */
async function extractTextFromDOC(file) {
  console.log('📃 DOC/DOCX file detected:', file.name);
  
  // Basic metadata extraction
  const fileSize = (file.size / 1024).toFixed(2); // Size in KB
  const lastModified = new Date(file.lastModified).toLocaleDateString();
  
  return `[Document Information]
File Name: ${file.name}
File Type: ${file.type || 'Microsoft Word Document'}
File Size: ${fileSize} KB
Last Modified: ${lastModified}

Note: This is a Microsoft Word document. The file has been successfully uploaded and stored. 
For full text extraction from DOC/DOCX files, the content will need to be reviewed manually or converted to PDF/TXT format.

To enable full DOC/DOCX text extraction, consider using a document conversion service or library like mammoth.js.`;
}

/**
 * Main function to extract text from various document types
 * @param {File} file - The document file to extract text from
 * @returns {Promise<string>} - The extracted text content
 */
export async function extractTextFromDocument(file) {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();
  
  // Check file type and route to appropriate extractor
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return await extractTextFromPDF(file);
  } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
    return await extractTextFromTXT(file);
  } else if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
    return await extractTextFromCSV(file);
  } else if (fileType === 'text/markdown' || fileName.endsWith('.md') || fileName.endsWith('.markdown')) {
    return await extractTextFromMarkdown(file);
  } else if (
    fileType === 'application/msword' || 
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.doc') || 
    fileName.endsWith('.docx')
  ) {
    return await extractTextFromDOC(file);
  } else {
    return `[Unsupported file type: ${fileType || 'Unknown'}. Supported formats: PDF, TXT, CSV, MD, DOC, DOCX]`;
  }
}

/**
 * Check if a file is a supported document type
 * @param {File} file - The file to check
 * @returns {boolean} - True if the file is a supported document type
 */
export function isSupportedDocument(file) {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();
  
  const supportedTypes = [
    'application/pdf',
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  const supportedExtensions = ['.pdf', '.txt', '.csv', '.md', '.markdown', '.doc', '.docx'];
  
  return supportedTypes.includes(fileType) || 
         supportedExtensions.some(ext => fileName.endsWith(ext));
}

/**
 * Get the document type from a file
 * @param {File} file - The file to check
 * @returns {string} - The document type (PDF, TXT, DOC, DOCX, or Unknown)
 */
export function getDocumentType(file) {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();
  
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return 'PDF';
  } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
    return 'TXT';
  } else if (fileType === 'application/msword' || fileName.endsWith('.doc')) {
    return 'DOC';
  } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
    return 'DOCX';
  } else {
    return 'Unknown';
  }
}

// Export for backward compatibility
export { extractTextFromPDF };
export function isPDFFile(file) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}