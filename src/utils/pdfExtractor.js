import * as pdfjsLib from 'pdfjs-dist/webpack';

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extract text content from a PDF file
 * @param {File} file - The PDF file to extract text from
 * @returns {Promise<string>} - The extracted text content
 */
export async function extractTextFromPDF(file) {
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
    
    // If the text is too long (over 10000 characters), provide a summary
    if (cleanedText.length > 10000) {
      const truncatedText = cleanedText.substring(0, 10000);
      return `${truncatedText}...\n\n[Document truncated - Full document has ${cleanedText.length} characters from ${pdf.numPages} pages]`;
    }
    
    return cleanedText || '[No text could be extracted from this PDF]';
    
  } catch (error) {
    console.error('📄 PDF text extraction failed:', error);
    return `[PDF text extraction failed: ${error.message}]`;
  }
}

/**
 * Check if a file is a valid PDF
 * @param {File} file - The file to check
 * @returns {boolean} - True if the file appears to be a PDF
 */
export function isPDFFile(file) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}