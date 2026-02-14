export interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  topic: string;
  channel: string;
  views: string;
}

const MOCK_VIDEOS: VideoItem[] = [
  {
    id: "v-001",
    title: "Intro to Risk Management for Traders",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
    duration: "12:34",
    topic: "Risk Management",
    channel: "Deriv",
    views: "45K",
  },
  {
    id: "v-002",
    title: "How to Trade Multipliers on Deriv",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
    duration: "8:21",
    topic: "Multipliers",
    channel: "Deriv",
    views: "32K",
  },
  {
    id: "v-003",
    title: "Understanding Volatility Indices",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
    duration: "15:07",
    topic: "Volatility",
    channel: "Deriv",
    views: "28K",
  },
  {
    id: "v-004",
    title: "Risk Management: Position Sizing Strategies",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
    duration: "10:45",
    topic: "Risk Management",
    channel: "Deriv",
    views: "19K",
  },
  {
    id: "v-005",
    title: "Technical Analysis Masterclass",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
    duration: "22:10",
    topic: "Technical Analysis",
    channel: "Deriv",
    views: "67K",
  },
  {
    id: "v-006",
    title: "Deriv MT5: Complete Beginner Guide",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
    duration: "18:30",
    topic: "Platform",
    channel: "Deriv",
    views: "54K",
  },
  {
    id: "v-007",
    title: "Managing Risk in Volatile Markets",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
    duration: "9:15",
    topic: "Risk Management",
    channel: "Deriv",
    views: "12K",
  },
  {
    id: "v-008",
    title: "How to Read Candlestick Charts",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
    duration: "14:22",
    topic: "Technical Analysis",
    channel: "Deriv",
    views: "41K",
  },
];

function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatViewCount(viewCount: string): string {
  const count = parseInt(viewCount);
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export async function fetchDerivVideos(): Promise<VideoItem[]> {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

  if (!apiKey) {
    console.log("No YouTube API key found, using mock data");
    await new Promise((r) => setTimeout(r, 600));
    return MOCK_VIDEOS;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    // First, try to get channel ID from username
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=deriv&key=${apiKey}`,
      { signal: controller.signal },
    );

    let channelId = "UCArkMZyQ_wDAkac5aB3PNFQ"; // fallback

    if (channelRes.ok) {
      const channelData = await channelRes.json();
      if (channelData.items && channelData.items.length > 0) {
        channelId = channelData.items[0].id;
        console.log("Found Deriv channel ID:", channelId);
      }
    }

    // Step 1: Search for videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=20&order=date&type=video&key=${apiKey}`;
    console.log("Fetching videos from channel:", channelId);
    
    const searchRes = await fetch(searchUrl, { signal: controller.signal });

    if (!searchRes.ok) {
      console.error(`YouTube API Error: ${searchRes.status}`);
      const errorData = await searchRes.json().catch(() => ({}));
      console.error("Error details:", errorData);
      throw new Error(`YouTube API ${searchRes.status}`);
    }

    const searchData = await searchRes.json();
    console.log(`Found ${searchData.items?.length || 0} videos`);

    if (!searchData.items || searchData.items.length === 0) {
      clearTimeout(timeout);
      console.warn("No videos found, using mock data");
      return MOCK_VIDEOS;
    }

    // Extract video IDs
    const videoIds = searchData.items
      .map((item: { id: { videoId?: string } }) => item.id.videoId)
      .filter(Boolean)
      .join(",");

    // Step 2: Get video details (duration, views, etc.)
    const detailsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${apiKey}`,
      { signal: controller.signal },
    );

    clearTimeout(timeout);

    if (!detailsRes.ok) throw new Error(`YouTube API ${detailsRes.status}`);

    const detailsData = await detailsRes.json();

    if (!detailsData.items || detailsData.items.length === 0) {
      console.warn("No video details found, using mock data");
      return MOCK_VIDEOS;
    }

    const videos = detailsData.items.map(
      (
        item: {
          id: string;
          snippet: {
            title: string;
            thumbnails?: { medium?: { url: string }; high?: { url: string } };
            channelTitle?: string;
          };
          contentDetails: {
            duration: string;
          };
          statistics: {
            viewCount: string;
          };
        },
        i: number,
      ) => {
        const title = item.snippet.title;
        const topic = detectTopicFromText(title) || "General";

        return {
          id: item.id || `yt-${i}`,
          title: title,
          thumbnail:
            item.snippet.thumbnails?.medium?.url ||
            item.snippet.thumbnails?.high?.url ||
            "",
          duration: formatDuration(item.contentDetails.duration),
          topic: topic,
          channel: item.snippet.channelTitle ?? "Deriv",
          views: formatViewCount(item.statistics.viewCount),
        };
      },
    );

    console.log(`Successfully fetched ${videos.length} videos from YouTube`);
    return videos;
  } catch (error) {
    console.error("YouTube API Error:", error);
    return MOCK_VIDEOS;
  }
}

// Topic detection keywords map
const TOPIC_KEYWORDS: Record<string, string[]> = {
  "Risk Management": [
    "risk",
    "management",
    "position size",
    "stop loss",
    "losing",
    "loss",
    "protect",
    "capital",
  ],
  Multipliers: ["multiplier", "leverage", "margin"],
  Volatility: ["volatility", "volatile", "vol index", "vix"],
  "Technical Analysis": [
    "technical",
    "chart",
    "candlestick",
    "pattern",
    "indicator",
    "analysis",
    "trend",
    "support",
    "resistance",
  ],
  Platform: ["mt5", "platform", "deriv app", "dtrader", "trade", "setup"],
  Forex: ["forex", "currency", "eur", "usd", "gbp", "jpy", "pair"],
  Crypto: ["crypto", "bitcoin", "btc", "ethereum", "eth", "cryptocurrency"],
  Indices: ["indices", "index", "stocks", "s&p", "nasdaq"],
  Commodities: ["gold", "silver", "oil", "commodity", "commodities"],
};

export function detectTopicFromText(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return topic;
  }
  return null;
}
