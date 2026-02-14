import { motion } from "framer-motion";
import Image from "next/image";
import { Play, Eye, Clock } from "lucide-react";
import { type VideoItem } from "@/lib/services/youtubeService";
import { Badge } from "@/components/ui/badge";

interface VideoCardProps {
  video: VideoItem;
  index: number;
}

export const VideoCard = ({ video, index }: VideoCardProps) => {
  const handleVideoClick = () => {
    // Open YouTube video in new tab
    window.open(`https://www.youtube.com/watch?v=${video.id}`, "_blank");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={handleVideoClick}
      className="glass-card overflow-hidden cursor-pointer group hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 flex flex-col h-full"
    >
      {/* Thumbnail Section */}
      <div className="relative aspect-video bg-secondary overflow-hidden">
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-background/95 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-mono text-foreground border border-border/50 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {video.duration}
          </div>
        )}

        {/* Topic Badge */}
        {video.topic && (
          <div className="absolute top-2 left-2">
            <Badge
              variant="outline"
              className="bg-primary/90 backdrop-blur-sm text-primary-foreground border-primary/50 text-[10px] font-medium"
            >
              {video.topic}
            </Badge>
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <motion.div
            initial={{ scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            className="w-16 h-16 rounded-full bg-primary flex items-center justify-center glow-primary shadow-2xl"
          >
            <Play
              className="h-7 w-7 text-primary-foreground ml-1"
              fill="currentColor"
            />
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-3 group-hover:text-primary transition-colors">
          {video.title}
        </h4>

        {/* Metadata */}
        <div className="mt-auto space-y-2">
          {/* Channel Name */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium truncate">{video.channel}</span>
          </div>

          {/* Stats Row */}
          {video.views && (
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Eye className="h-3 w-3" />
                <span className="font-mono">{video.views}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hover Accent Line */}
      <div className="h-0.5 bg-linear-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};
