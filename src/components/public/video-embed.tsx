"use client";

import { useState } from "react";

interface VideoEmbedProps {
  url: string;
  videoType?: "YOUTUBE" | "FACEBOOK" | "VIMEO" | "CUSTOM";
  title?: string;
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

export function VideoEmbed({ url, videoType = "YOUTUBE", title }: VideoEmbedProps) {
  const [loaded, setLoaded] = useState(false);

  const youtubeId = videoType === "YOUTUBE" ? getYouTubeId(url) : null;
  const vimeoId = videoType === "VIMEO" ? getVimeoId(url) : null;

  if (youtubeId) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
        {!loaded ? (
          <div
            className="absolute inset-0 cursor-pointer group"
            onClick={() => setLoaded(true)}
          >
            <img
              src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
              alt={title || "Video thumbnail"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
              <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
            title={title || "Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        )}
      </div>
    );
  }

  if (vimeoId) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}`}
          title={title || "Video"}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  if (videoType === "FACEBOOK") {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
        <iframe
          src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`}
          title={title || "Video"}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full"
          style={{ border: "none", overflow: "hidden" }}
        />
      </div>
    );
  }

  // Custom / fallback
  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
      <video
        src={url}
        controls
        className="w-full h-full"
        title={title || "Video"}
      />
    </div>
  );
}
