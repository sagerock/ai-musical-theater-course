import React, { useState } from 'react';
import { getYouTubeEmbedUrl, getYouTubeThumbnail, cleanYouTubeUrl } from '../../utils/youtubeParser';
import { PlayIcon, VideoCameraIcon } from '@heroicons/react/24/solid';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

export default function YouTubeEmbed({
  videoId,
  url,
  title = 'YouTube Video',
  showThumbnail = true,
  autoplay = false,
  className = ''
}) {
  const [isLoaded, setIsLoaded] = useState(!showThumbnail);
  const [error, setError] = useState(false);

  const embedUrl = getYouTubeEmbedUrl(videoId, {
    autoplay: isLoaded && autoplay,
    privacyEnhanced: true
  });

  const thumbnailUrl = getYouTubeThumbnail(videoId, 'high');
  const cleanUrl = cleanYouTubeUrl(url);

  if (error) {
    return (
      <div className={`bg-gray-100 rounded-lg p-6 text-center ${className}`}>
        <VideoCameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600 mb-2">Unable to load video</p>
        <a
          href={cleanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
        >
          Watch on YouTube
          <ArrowTopRightOnSquareIcon className="ml-1 h-3 w-3" />
        </a>
      </div>
    );
  }

  if (!isLoaded && showThumbnail) {
    return (
      <div className={`relative group cursor-pointer ${className}`}>
        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={() => setError(true)}
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
            <button
              onClick={() => setIsLoaded(true)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 transform group-hover:scale-110 transition-transform duration-200 shadow-lg"
              aria-label="Play video"
            >
              <PlayIcon className="h-8 w-8 ml-1" />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            <p className="text-white text-sm font-medium truncate">{title}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-500">Click to play video</span>
          <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center text-xs text-gray-500 hover:text-primary-600"
          >
            Open in YouTube
            <ArrowTopRightOnSquareIcon className="ml-1 h-3 w-3" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
        <iframe
          src={embedUrl}
          title={title}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onError={() => setError(true)}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">Video player</span>
        <a
          href={cleanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-xs text-gray-500 hover:text-primary-600"
        >
          Open in YouTube
          <ArrowTopRightOnSquareIcon className="ml-1 h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

/**
 * Component to handle multiple YouTube embeds
 */
export function YouTubeEmbedList({ videos, className = '' }) {
  if (!videos || videos.length === 0) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {videos.map((video, index) => (
        <YouTubeEmbed
          key={video.videoId || index}
          videoId={video.videoId}
          url={video.url}
          title={video.title || `Video ${index + 1}`}
        />
      ))}
    </div>
  );
}