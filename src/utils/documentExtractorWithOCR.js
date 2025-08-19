import * as pdfjsLib from 'pdfjs-dist/webpack';
import Tesseract from 'tesseract.js';
import * as mammoth from 'mammoth';
import JSZip from 'jszip';

// Set up the worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Convert a PDF page to an image for OCR
 * @param {PDFPageProxy} page - The PDF page object
 * @returns {Promise<string>} - Base64 image data URL
 */
async function convertPageToImage(page) {
  const scale = 2.0; // Higher scale = better OCR quality but slower
  const viewport = page.getViewport({ scale });
  
  // Create canvas
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  // Render PDF page to canvas
  const renderContext = {
    canvasContext: context,
    viewport: viewport
  };
  
  await page.render(renderContext).promise;
  
  // Convert canvas to image data URL
  return canvas.toDataURL('image/png');
}

/**
 * Perform OCR on an image using Tesseract.js
 * @param {string} imageDataUrl - Base64 image data URL
 * @param {number} pageNum - Page number for progress reporting
 * @returns {Promise<string>} - Extracted text
 */
async function performOCR(imageDataUrl, pageNum) {
  try {
    console.log(`🔍 Starting OCR for page ${pageNum}...`);
    
    const result = await Tesseract.recognize(
      imageDataUrl,
      'eng', // English language
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`🔍 OCR Progress for page ${pageNum}: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );
    
    console.log(`🔍 OCR completed for page ${pageNum}: ${result.data.text.length} characters`);
    return result.data.text;
  } catch (error) {
    console.error(`🔍 OCR failed for page ${pageNum}:`, error);
    return `[OCR failed for page ${pageNum}]`;
  }
}

/**
 * Extract text from a PDF with OCR fallback for scanned pages
 * @param {File} file - The PDF file to extract text from
 * @param {boolean} forceOCR - Force OCR even if text is embedded
 * @returns {Promise<string>} - The extracted text content
 */
async function extractTextFromPDFWithOCR(file, forceOCR = false) {
  try {
    console.log('📄 Starting PDF text extraction with OCR support for:', file.name);
    
    // Read the file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log('📄 PDF loaded, pages:', pdf.numPages);
    
    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 10); // Limit pages for OCR (it's slow)
    let needsOCR = false;
    
    // First pass: Try to extract embedded text
    if (!forceOCR) {
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Combine all text items from the page
          const pageText = textContent.items
            .map(item => item.str)
            .join(' ')
            .trim();
          
          if (pageText && pageText.length > 50) {
            // If we found substantial text, use it
            fullText += `\n\n--- Page ${pageNum} ---\n${pageText}`;
            console.log(`📄 Extracted embedded text from page ${pageNum}: ${pageText.length} characters`);
          } else {
            // No text or very little text found, this page needs OCR
            needsOCR = true;
            console.log(`📄 Page ${pageNum} appears to be scanned (no embedded text). Will use OCR.`);
          }
        } catch (pageError) {
          console.warn(`📄 Failed to extract text from page ${pageNum}:`, pageError);
          needsOCR = true;
        }
      }
    }
    
    // Second pass: Use OCR if needed or forced
    if (needsOCR || forceOCR || fullText.length < 100) {
      console.log('🔍 PDF appears to be scanned. Starting OCR process...');
      fullText = ''; // Clear and start fresh with OCR
      
      // Show warning about OCR being slow
      fullText = '[Note: This appears to be a scanned PDF. Using OCR to extract text - this may take a moment...]\n\n';
      
      // Limit OCR to fewer pages due to performance
      const ocrMaxPages = Math.min(pdf.numPages, 5); // OCR is slow, limit to 5 pages
      
      for (let pageNum = 1; pageNum <= ocrMaxPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          
          // Convert page to image
          const imageDataUrl = await convertPageToImage(page);
          
          // Perform OCR
          const ocrText = await performOCR(imageDataUrl, pageNum);
          
          if (ocrText && ocrText.trim()) {
            fullText += `\n\n--- Page ${pageNum} (OCR) ---\n${ocrText}`;
          } else {
            fullText += `\n\n--- Page ${pageNum} ---\n[No text detected on this page]`;
          }
        } catch (pageError) {
          console.error(`🔍 OCR failed for page ${pageNum}:`, pageError);
          fullText += `\n\n--- Page ${pageNum} ---\n[OCR failed for this page]`;
        }
      }
      
      if (pdf.numPages > ocrMaxPages) {
        fullText += `\n\n--- Note ---\nThis scanned PDF has ${pdf.numPages} pages, but only the first ${ocrMaxPages} pages were processed with OCR for performance reasons.`;
      }
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
    if (text.length > 10000) {
      const truncatedText = text.substring(0, 10000);
      return `${truncatedText}...\n\n[Document truncated - Full document has ${text.length} characters]`;
    }
    
    return text || '[No text found in this TXT file]';
  } catch (error) {
    console.error('📝 TXT text extraction failed:', error);
    return `[TXT text extraction failed: ${error.message}]`;
  }
}

/**
 * Extract text from DOC/DOCX files using mammoth.js
 * @param {File} file - The DOC/DOCX file
 * @returns {Promise<string>} - The extracted text content
 */
async function extractTextFromDOC(file) {
  try {
    console.log('📃 Starting Word document text extraction for:', file.name);
    
    const fileName = file.name.toLowerCase();
    const isOldFormat = fileName.endsWith('.doc') && !fileName.endsWith('.docx');
    
    // Check if it's an older .doc format
    if (isOldFormat) {
      console.log('📃 Detected older .doc format - limited support');
      
      // Try to extract with mammoth anyway (sometimes works)
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        
        if (result.value && result.value.trim().length > 0) {
          console.log('📃 Successfully extracted text from .doc file');
          const cleanedText = result.value
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n\n')
            .trim();
          
          if (cleanedText.length > 10000) {
            return cleanedText.substring(0, 10000) + `...\n\n[Document truncated - Full document has ${cleanedText.length} characters]`;
          }
          return cleanedText;
        }
      } catch (docError) {
        console.log('📃 Could not extract text from .doc file:', docError.message);
      }
      
      // If extraction failed, provide helpful message for .doc files
      const fileSize = (file.size / 1024).toFixed(2);
      return `[Legacy Word Document (.doc)]
File Name: ${file.name}
File Size: ${fileSize} KB

This is an older Word document format (.doc). While the file has been successfully uploaded and stored, text extraction is limited for legacy .doc files.

To enable full text extraction and chat capabilities:
1. Open this document in Microsoft Word
2. Save it as a modern Word document (.docx) using "Save As"
3. Re-upload the .docx version

Alternatively, you can:
- Export the document as a PDF for full text extraction
- Copy the text content and save it as a .txt file

The document is still available for download and sharing with students.`;
    }
    
    // For .docx files, proceed with normal extraction
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (result.messages && result.messages.length > 0) {
      console.log('📃 Word extraction messages:', result.messages);
    }
    
    const text = result.value;
    console.log('📃 Word text extraction completed:', text.length, 'characters');
    
    // If no text was extracted
    if (!text || text.trim().length === 0) {
      // Check if it might be a .doc file mislabeled as .docx
      if (file.type === 'application/msword') {
        return `[Legacy Word Document]
This appears to be an older .doc format file. For best results, please:
1. Open in Microsoft Word and save as .docx format
2. Or export as PDF for full text extraction

The file has been uploaded and is available for download.`;
      }
      
      return `[No text could be extracted from this Word document. The file may be corrupted, password-protected, or contain only images/graphics.]`;
    }
    
    // Clean up the text
    const cleanedText = text
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n\n')  // Clean up multiple newlines
      .trim();
    
    // Truncate if too long
    if (cleanedText.length > 10000) {
      const truncatedText = cleanedText.substring(0, 10000);
      return `${truncatedText}...\n\n[Document truncated - Full document has ${cleanedText.length} characters]`;
    }
    
    return cleanedText;
    
  } catch (error) {
    console.error('📃 Word document text extraction failed:', error);
    
    // Check if it's likely a .doc file issue
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.doc') && !fileName.endsWith('.docx')) {
      return `[Legacy Word Document Format]
      
This is an older .doc file format that has limited support for text extraction.

The file has been successfully uploaded and stored. You can:
- Download and open it in Microsoft Word
- Convert it to .docx format for full text extraction
- Export it as PDF for better compatibility

To convert to modern format:
1. Open in Microsoft Word
2. Choose File > Save As
3. Select "Word Document (.docx)" format
4. Re-upload the converted file`;
    }
    
    // Provide helpful error messages
    if (error.message && error.message.includes('password')) {
      return `[This Word document appears to be password-protected and cannot be processed]`;
    } else if (error.message && error.message.includes('corrupt')) {
      return `[This Word document appears to be corrupted and cannot be processed]`;
    } else {
      return `[Word document text extraction failed: ${error.message || 'Unknown error'}. The file is still available for download.]`;
    }
  }
}

/**
 * Extract text from PowerPoint PPTX files
 * @param {File} file - The PPT/PPTX file
 * @returns {Promise<string>} - Extracted text content
 */
async function extractTextFromPowerPoint(file) {
  console.log('📊 PowerPoint file detected:', file.name);
  
  const fileName = file.name.toLowerCase();
  const isOldFormat = fileName.endsWith('.ppt') && !fileName.endsWith('.pptx');
  
  // Check if it's an older .ppt format
  if (isOldFormat) {
    const fileSize = (file.size / 1024).toFixed(2);
    return `[Legacy PowerPoint Format (.ppt)]
File Name: ${file.name}
File Size: ${fileSize} KB

This is an older PowerPoint format (.ppt). Text extraction is only supported for modern .pptx files.

To enable text extraction:
1. Open this presentation in PowerPoint
2. Save it as .pptx format using "Save As"
3. Re-upload the .pptx version

Alternatively, export as PDF for full text extraction.
The presentation is still available for download and sharing.`;
  }
  
  try {
    console.log('📊 Starting PPTX text extraction for:', file.name);
    
    // PPTX files are actually ZIP archives
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // Look for slide files in the ppt/slides/ directory
    const slideFiles = Object.keys(zip.files)
      .filter(path => path.startsWith('ppt/slides/slide') && path.endsWith('.xml'))
      .sort((a, b) => {
        // Sort slides numerically (slide1.xml, slide2.xml, etc.)
        const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
        const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
        return numA - numB;
      });
    
    console.log(`📊 Found ${slideFiles.length} slides in presentation`);
    
    if (slideFiles.length === 0) {
      return `[PowerPoint Presentation]
File Name: ${file.name}
No slides found in presentation or unable to extract text.
The file has been uploaded and is available for download.`;
    }
    
    let allText = `[PowerPoint Presentation: ${file.name}]\n`;
    allText += `Total Slides: ${slideFiles.length}\n\n`;
    
    // Extract text from each slide
    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = slideFiles[i];
      const slideNumber = i + 1;
      
      try {
        const slideContent = await zip.file(slideFile).async('string');
        const slideText = await extractTextFromSlideXML(slideContent);
        
        if (slideText && slideText.trim()) {
          allText += `--- Slide ${slideNumber} ---\n${slideText}\n\n`;
        } else {
          allText += `--- Slide ${slideNumber} ---\n[No text content or only images]\n\n`;
        }
      } catch (slideError) {
        console.warn(`📊 Failed to extract text from slide ${slideNumber}:`, slideError);
        allText += `--- Slide ${slideNumber} ---\n[Could not extract text]\n\n`;
      }
      
      // Limit to first 20 slides for performance
      if (slideNumber >= 20 && slideFiles.length > 20) {
        allText += `\n[Note: Presentation has ${slideFiles.length} slides. Only first 20 slides were processed for text extraction.]`;
        break;
      }
    }
    
    // Also try to extract notes if they exist
    const notesFiles = Object.keys(zip.files)
      .filter(path => path.startsWith('ppt/notesSlides/') && path.endsWith('.xml'));
    
    if (notesFiles.length > 0) {
      console.log(`📊 Found ${notesFiles.length} slides with notes`);
      // Could add notes extraction here if needed
    }
    
    // Clean up and truncate if needed
    const cleanedText = allText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
    
    if (cleanedText.length > 10000) {
      return cleanedText.substring(0, 10000) + `...\n\n[Content truncated - Full presentation has ${cleanedText.length} characters]`;
    }
    
    console.log('📊 PPTX text extraction completed:', cleanedText.length, 'characters');
    return cleanedText;
    
  } catch (error) {
    console.error('📊 PowerPoint text extraction failed:', error);
    
    const fileSize = (file.size / 1024).toFixed(2);
    return `[PowerPoint Presentation]
File Name: ${file.name}
File Size: ${fileSize} KB

Text extraction failed: ${error.message || 'Unknown error'}

The presentation has been uploaded and is available for download.
For better text extraction, try exporting as PDF from PowerPoint.`;
  }
}

/**
 * Helper function to extract text from PowerPoint slide XML using regex
 * @param {string} xmlContent - The slide XML content
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromSlideXML(xmlContent) {
  try {
    // PowerPoint stores text in <a:t> tags
    // Use regex to extract text between these tags
    const textMatches = xmlContent.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || [];
    
    const texts = textMatches.map(match => {
      // Extract just the text content, removing the XML tags
      const text = match.replace(/<a:t[^>]*>/, '').replace(/<\/a:t>/, '');
      // Decode common XML entities
      return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'");
    });
    
    // Join all text with spaces and clean up
    const slideText = texts
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return slideText;
  } catch (error) {
    console.error('Error extracting text from slide XML:', error);
    return '';
  }
}

/**
 * Extract basic metadata from Excel files
 * @param {File} file - The XLS/XLSX file
 * @returns {Promise<string>} - Basic file information
 */
async function extractTextFromExcel(file) {
  console.log('📈 Excel file detected:', file.name);
  
  // Basic metadata extraction
  const fileSize = (file.size / 1024).toFixed(2); // Size in KB
  const lastModified = new Date(file.lastModified).toLocaleDateString();
  
  return `[Excel Spreadsheet]
File Name: ${file.name}
File Type: Excel Spreadsheet
File Size: ${fileSize} KB
Last Modified: ${lastModified}

Note: This is an Excel spreadsheet file. The file has been successfully uploaded and stored.
While full data extraction from Excel files is not yet supported, you can still:
- Share this spreadsheet with students
- Download and work with it in Excel
- Export it as CSV for text-based analysis`;
}

/**
 * Main function to extract text from various document types with OCR support
 * @param {File} file - The document file to extract text from
 * @param {boolean} forceOCR - Force OCR for PDFs even if they have embedded text
 * @returns {Promise<string>} - The extracted text content
 */
export async function extractTextFromDocument(file, forceOCR = false) {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();
  
  // Check file type and route to appropriate extractor
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return await extractTextFromPDFWithOCR(file, forceOCR);
  } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
    return await extractTextFromTXT(file);
  } else if (
    fileType === 'application/msword' || 
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.doc') || 
    fileName.endsWith('.docx')
  ) {
    return await extractTextFromDOC(file);
  } else if (
    fileType === 'application/vnd.ms-powerpoint' ||
    fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    fileName.endsWith('.ppt') ||
    fileName.endsWith('.pptx')
  ) {
    return await extractTextFromPowerPoint(file);
  } else if (
    fileType === 'application/vnd.ms-excel' ||
    fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    fileName.endsWith('.xls') ||
    fileName.endsWith('.xlsx')
  ) {
    return await extractTextFromExcel(file);
  } else {
    return `[Unsupported file type: ${fileType || 'Unknown'}. Supported formats: PDF, TXT, DOC, DOCX, PPT, PPTX, XLS, XLSX]`;
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
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  const supportedExtensions = ['.pdf', '.txt', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'];
  
  return supportedTypes.includes(fileType) || 
         supportedExtensions.some(ext => fileName.endsWith(ext));
}

/**
 * Get the document type from a file
 * @param {File} file - The file to check
 * @returns {string} - The document type (PDF, TXT, DOC, DOCX, PPT, PPTX, XLS, XLSX, or Unknown)
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
  } else if (fileType === 'application/vnd.ms-powerpoint' || fileName.endsWith('.ppt')) {
    return 'PPT';
  } else if (fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || fileName.endsWith('.pptx')) {
    return 'PPTX';
  } else if (fileType === 'application/vnd.ms-excel' || fileName.endsWith('.xls')) {
    return 'XLS';
  } else if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || fileName.endsWith('.xlsx')) {
    return 'XLSX';
  } else {
    return 'Unknown';
  }
}

// Export the enhanced PDF extractor as the default PDF extractor
export { extractTextFromPDFWithOCR as extractTextFromPDF };
export function isPDFFile(file) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}