import React from 'react';

// Simple markdown renderer without external dependencies
export default function MarkdownRenderer({ children }) {
  if (!children) return null;

  const formatTable = (tableBlock) => {
    const rows = tableBlock.trim().split('\n');
    if (rows.length < 2) return tableBlock;

    // Check that the second row is a separator row (e.g., |---|---|)
    const separatorMatch = rows[1].match(/^\|?[\s-:|]+\|?$/);
    if (!separatorMatch) return tableBlock;

    // Parse alignment from separator row
    const separatorCells = rows[1].split('|').filter(c => c.trim() !== '');
    const alignments = separatorCells.map(cell => {
      const trimmed = cell.trim();
      if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
      if (trimmed.endsWith(':')) return 'right';
      return 'left';
    });

    const parseRow = (row) =>
      row.split('|').filter(c => c.trim() !== '').map(c => c.trim());

    const headerCells = parseRow(rows[0]);
    const thead = '<thead><tr>' +
      headerCells.map((c, i) => `<th style="text-align:${alignments[i] || 'left'}">${c}</th>`).join('') +
      '</tr></thead>';

    const bodyRows = rows.slice(2);
    const tbody = '<tbody>' +
      bodyRows.map(row => {
        const cells = parseRow(row);
        return '<tr>' + cells.map((c, i) => `<td style="text-align:${alignments[i] || 'left'}">${c}</td>`).join('') + '</tr>';
      }).join('') +
      '</tbody>';

    return `<table>${thead}${tbody}</table>`;
  };

  const formatText = (text) => {
    let formatted = text;

    // Handle code blocks (```code```) — extract and preserve them
    const codeBlocks = [];
    formatted = formatted.replace(
      /```([\s\S]*?)```/g,
      (_, code) => {
        codeBlocks.push('<pre><code>' + code + '</code></pre>');
        return `%%CODEBLOCK_${codeBlocks.length - 1}%%`;
      }
    );

    // Handle tables (must be before paragraph handling)
    formatted = formatted.replace(
      /(?:^|\n)((?:\|.+\|(?:\n|$))+)/g,
      (match, tableBlock) => '\n' + formatTable(tableBlock) + '\n'
    );

    // Handle inline code (`code`)
    formatted = formatted.replace(
      /`([^`]+)`/g,
      '<code>$1</code>'
    );

    // Handle images (![alt](url)) — must be before links
    formatted = formatted.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" style="max-width:100%" />'
    );

    // Handle links ([text](url))
    formatted = formatted.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Auto-link bare URLs (not already inside an href or src)
    formatted = formatted.replace(
      /(?<!="|'>)(https?:\/\/[^\s<)]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Handle bold (**text** or __text__)
    formatted = formatted.replace(
      /\*\*(.*?)\*\*/g,
      '<strong>$1</strong>'
    );
    formatted = formatted.replace(
      /__(.*?)__/g,
      '<strong>$1</strong>'
    );

    // Handle italic (*text* or _text_)
    formatted = formatted.replace(
      /\*(.*?)\*/g,
      '<em>$1</em>'
    );
    formatted = formatted.replace(
      /_(.*?)_/g,
      '<em>$1</em>'
    );

    // Handle headers (h1-h6)
    formatted = formatted.replace(
      /^###### (.*$)/gm,
      '<h6>$1</h6>'
    );
    formatted = formatted.replace(
      /^##### (.*$)/gm,
      '<h5>$1</h5>'
    );
    formatted = formatted.replace(
      /^#### (.*$)/gm,
      '<h4>$1</h4>'
    );
    formatted = formatted.replace(
      /^### (.*$)/gm,
      '<h3>$1</h3>'
    );
    formatted = formatted.replace(
      /^## (.*$)/gm,
      '<h2>$1</h2>'
    );
    formatted = formatted.replace(
      /^# (.*$)/gm,
      '<h1>$1</h1>'
    );

    // Handle horizontal rules
    formatted = formatted.replace(
      /^(?:---|\*\*\*|___)\s*$/gm,
      '<hr />'
    );

    // Handle blockquotes
    formatted = formatted.replace(
      /^> (.*$)/gm,
      '<blockquote>$1</blockquote>'
    );
    // Merge consecutive blockquotes
    formatted = formatted.replace(
      /<\/blockquote>\n<blockquote>/g,
      '\n'
    );

    // Handle line breaks
    formatted = formatted.replace(/\n\n/g, '</p><p>');
    formatted = '<p>' + formatted + '</p>';

    // Handle unordered lists
    formatted = formatted.replace(
      /^- (.*$)/gm,
      '<li>$1</li>'
    );
    formatted = formatted.replace(
      /(<li>.*<\/li>)/s,
      '<ul>$1</ul>'
    );

    // Handle ordered lists
    formatted = formatted.replace(
      /^\d+\. (.*$)/gm,
      '<li>$1</li>'
    );

    // Clean up empty paragraphs
    formatted = formatted.replace(/<p><\/p>/g, '');
    formatted = formatted.replace(/<p>\s*<\/p>/g, '');

    // Restore code blocks
    codeBlocks.forEach((block, i) => {
      formatted = formatted.replace(`%%CODEBLOCK_${i}%%`, block);
    });

    return formatted;
  };

  const createMarkup = (text) => {
    return { __html: formatText(text) };
  };

  return (
    <div 
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={createMarkup(children)}
    />
  );
}