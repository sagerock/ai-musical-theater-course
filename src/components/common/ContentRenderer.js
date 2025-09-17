import React from 'react';
import YouTubeEmbed from './YouTubeEmbed';
import { extractYouTubeUrls } from '../../utils/youtubeParser';

/**
 * ContentRenderer Component
 * Renders text content with embedded YouTube videos
 */
export default function ContentRenderer({ content, className = '' }) {
  if (!content) return null;

  // Extract YouTube URLs from content
  const youtubeUrls = extractYouTubeUrls(content);

  // If no YouTube URLs, just render the content as-is
  if (youtubeUrls.length === 0) {
    return (
      <div className={`whitespace-pre-wrap ${className}`}>
        {content}
      </div>
    );
  }

  // Split content into segments and render with embedded videos
  const segments = [];
  let lastIndex = 0;

  // Sort URLs by position to process them in order
  const sortedUrls = [...youtubeUrls].sort((a, b) => a.position - b.position);

  sortedUrls.forEach((urlInfo, index) => {
    // Add text segment before the URL
    if (urlInfo.position > lastIndex) {
      const textSegment = content.substring(lastIndex, urlInfo.position);
      if (textSegment.trim()) {
        segments.push({
          type: 'text',
          content: textSegment,
          key: `text-${index}`
        });
      }
    }

    // Add video embed segment
    segments.push({
      type: 'video',
      videoId: urlInfo.videoId,
      url: urlInfo.url,
      key: `video-${urlInfo.videoId}-${index}`
    });

    // Update lastIndex to after the URL
    lastIndex = urlInfo.position + urlInfo.url.length;
  });

  // Add remaining text after the last URL
  if (lastIndex < content.length) {
    const remainingText = content.substring(lastIndex);
    if (remainingText.trim()) {
      segments.push({
        type: 'text',
        content: remainingText,
        key: `text-final`
      });
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {segments.map((segment) => {
        if (segment.type === 'text') {
          return (
            <div key={segment.key} className="whitespace-pre-wrap">
              {segment.content}
            </div>
          );
        }

        if (segment.type === 'video') {
          return (
            <YouTubeEmbed
              key={segment.key}
              videoId={segment.videoId}
              url={segment.url}
              className="my-4"
            />
          );
        }

        return null;
      })}
    </div>
  );
}

/**
 * Check if content has YouTube URLs
 * Useful for conditional rendering or showing video indicators
 */
export function hasVideos(content) {
  if (!content) return false;
  return extractYouTubeUrls(content).length > 0;
}

/**
 * Get count of videos in content
 */
export function getVideoCount(content) {
  if (!content) return 0;
  return extractYouTubeUrls(content).length;
}

/**
 * Strip YouTube URLs from content
 * Useful for text-only displays or email notifications
 */
export function stripVideoUrls(content) {
  if (!content) return '';

  const youtubeUrls = extractYouTubeUrls(content);
  if (youtubeUrls.length === 0) return content;

  let strippedContent = content;

  // Sort URLs by position in reverse order to maintain positions while replacing
  const sortedUrls = [...youtubeUrls].sort((a, b) => b.position - a.position);

  sortedUrls.forEach(urlInfo => {
    const beforeUrl = strippedContent.substring(0, urlInfo.position);
    const afterUrl = strippedContent.substring(urlInfo.position + urlInfo.url.length);

    // Add a placeholder text for the video
    const placeholder = '[Video]';
    strippedContent = beforeUrl + placeholder + afterUrl;
  });

  return strippedContent.trim();
}

/**
 * Get video links for email or text-only display
 */
export function getVideoLinks(content) {
  if (!content) return [];

  const youtubeUrls = extractYouTubeUrls(content);
  return youtubeUrls.map((urlInfo, index) => ({
    url: urlInfo.url,
    videoId: urlInfo.videoId,
    title: `Video ${index + 1}`
  }));
}