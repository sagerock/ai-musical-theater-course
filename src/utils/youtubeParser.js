/**
 * YouTube URL Parser Utility
 * Extracts video IDs from various YouTube URL formats
 */

export const parseYouTubeUrl = (url) => {
  if (!url) return null;

  // Regular expressions for different YouTube URL formats
  const patterns = [
    // Standard watch URLs: https://www.youtube.com/watch?v=VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    // Short URLs: https://youtu.be/VIDEO_ID
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // Embed URLs: https://www.youtube.com/embed/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    // Mobile URLs: https://m.youtube.com/watch?v=VIDEO_ID
    /(?:https?:\/\/)?m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    // YouTube Shorts: https://www.youtube.com/shorts/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    // URLs with additional parameters: https://www.youtube.com/watch?v=VIDEO_ID&feature=share
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Extract all YouTube URLs from text content
 * Returns an array of { url, videoId, position } objects
 */
export const extractYouTubeUrls = (text) => {
  if (!text) return [];

  // Match URLs in text (simplified URL regex)
  const urlRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/|m\.youtube\.com\/watch\?v=)[a-zA-Z0-9_-]{11}(?:[^\s]*)?/gi;

  const matches = [];
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[0];
    const videoId = parseYouTubeUrl(url);

    if (videoId) {
      matches.push({
        url,
        videoId,
        position: match.index
      });
    }
  }

  return matches;
};

/**
 * Generate YouTube embed URL with privacy-enhanced mode
 * @param {string} videoId - YouTube video ID
 * @param {object} options - Embed options
 * @returns {string} Embed URL
 */
export const getYouTubeEmbedUrl = (videoId, options = {}) => {
  if (!videoId) return null;

  const {
    autoplay = false,
    controls = true,
    loop = false,
    mute = false,
    start = null,
    end = null,
    privacyEnhanced = true
  } = options;

  // Use privacy-enhanced mode by default (youtube-nocookie.com)
  const domain = privacyEnhanced ? 'youtube-nocookie.com' : 'youtube.com';

  const params = new URLSearchParams({
    rel: '0', // Don't show related videos from other channels
    modestbranding: '1', // Minimal YouTube branding
    ...(autoplay && { autoplay: '1' }),
    ...(controls === false && { controls: '0' }),
    ...(loop && { loop: '1', playlist: videoId }),
    ...(mute && { mute: '1' }),
    ...(start && { start: String(start) }),
    ...(end && { end: String(end) })
  });

  return `https://www.${domain}/embed/${videoId}?${params.toString()}`;
};

/**
 * Get YouTube video thumbnail URL
 * @param {string} videoId - YouTube video ID
 * @param {string} quality - Thumbnail quality (default, medium, high, standard, maxres)
 * @returns {string} Thumbnail URL
 */
export const getYouTubeThumbnail = (videoId, quality = 'high') => {
  if (!videoId) return null;

  const qualityMap = {
    default: 'default',      // 120x90
    medium: 'mqdefault',     // 320x180
    high: 'hqdefault',        // 480x360
    standard: 'sddefault',    // 640x480
    maxres: 'maxresdefault'   // 1280x720
  };

  const qualityParam = qualityMap[quality] || 'hqdefault';
  return `https://img.youtube.com/vi/${videoId}/${qualityParam}.jpg`;
};

/**
 * Format YouTube URL for display (clean up tracking parameters)
 * @param {string} url - YouTube URL
 * @returns {string} Clean YouTube URL
 */
export const cleanYouTubeUrl = (url) => {
  const videoId = parseYouTubeUrl(url);
  if (!videoId) return url;

  return `https://youtu.be/${videoId}`;
};

/**
 * Check if a string contains YouTube URLs
 * @param {string} text - Text to check
 * @returns {boolean} True if text contains YouTube URLs
 */
export const hasYouTubeUrls = (text) => {
  return extractYouTubeUrls(text).length > 0;
};