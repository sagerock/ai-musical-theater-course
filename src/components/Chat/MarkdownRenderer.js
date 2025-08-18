import React from 'react';

// Simple markdown renderer without external dependencies
export default function MarkdownRenderer({ children }) {
  if (!children) return null;

  const formatText = (text) => {
    // Convert markdown to HTML-like structure
    let formatted = text;

    // Handle code blocks (```code```)
    formatted = formatted.replace(
      /```([\s\S]*?)```/g,
      '<pre><code>$1</code></pre>'
    );

    // Handle inline code (`code`)
    formatted = formatted.replace(
      /`([^`]+)`/g,
      '<code>$1</code>'
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