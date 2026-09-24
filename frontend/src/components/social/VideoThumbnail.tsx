import React from "react";

interface VideoThumbnailProps {
  thumbnailUrl?: string;
  duration?: number;
  onClick?: () => void;
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  thumbnailUrl,
  duration = 6,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 cursor-pointer group"
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt="Clip"
          className="w-full h-full object-cover group-hover:scale-105 transition"
        />
      ) : (
        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
          Video
        </div>
      )}
      <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded-md text-[10px] font-bold text-white">
        00:0{Math.round(duration)}
      </div>
    </div>
  );
};
