export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  sentiment: "Bearish" | "Bullish" | "Neutral";
  asset: string;
  timestamp: string;
  source: string;
  tags: string[];
  url?: string;
}

const MOCK_MARKET_DATA: NewsItem[] = [
  {
    id: "mock-001",
    title: "US CPI Inflation jumps to 3.5% (YoY)",
    summary:
      "Consumer Price Index rose 3.5% year-over-year in March, exceeding economist expectations of 3.2%. Core CPI also came in hot at 3.8%, signaling persistent inflationary pressures that may delay Fed rate cuts.",
    impact: "HIGH",
    sentiment: "Bearish",
    asset: "XAUUSD",
    timestamp: new Date(Date.now() - 25 * 60_000).toISOString(),
    source: "Bureau of Labor Statistics",
    tags: ["CPI", "Inflation", "Fed", "Macro"],
    url: "https://www.bls.gov/cpi/",
  },
  {
    id: "mock-002",
    title: "Gold (XAUUSD) breaks critical support at $2030",
    summary:
      "Gold prices fell sharply below the key $2030 support level amid rising US Treasury yields. Technical analysis suggests a potential move toward $1980 if selling pressure continues.",
    impact: "MEDIUM",
    sentiment: "Bearish",
    asset: "XAUUSD",
    timestamp: new Date(Date.now() - 52 * 60_000).toISOString(),
    source: "Reuters",
    tags: ["Gold", "Technical", "Support"],
    url: "https://www.reuters.com/markets/",
  },
  {
    id: "mock-003",
    title: "Bitcoin holds $70k support level",
    summary:
      "Bitcoin maintained its position above the critical $70,000 psychological level despite broader market volatility. Institutional inflows into spot ETFs continue to provide underlying support.",
    impact: "LOW",
    sentiment: "Neutral",
    asset: "BTCUSD",
    timestamp: new Date(Date.now() - 78 * 60_000).toISOString(),
    source: "CoinDesk",
    tags: ["Bitcoin", "Crypto", "ETF"],
    url: "https://www.coindesk.com/",
  },
  {
    id: "mock-004",
    title: "EUR/USD surges on ECB hawkish stance",
    summary:
      "The Euro gained ground against the Dollar after ECB officials signaled that rate cuts may come later than expected, citing persistent services inflation.",
    impact: "MEDIUM",
    sentiment: "Bullish",
    asset: "EURUSD",
    timestamp: new Date(Date.now() - 95 * 60_000).toISOString(),
    source: "Bloomberg",
    tags: ["Forex", "ECB", "Euro"],
    url: "https://www.bloomberg.com/markets",
  },
  {
    id: "mock-005",
    title: "Ethereum hits new ATH on ETF approval buzz",
    summary:
      "Ethereum surged past $4,100 as speculation grows around a potential spot ETH ETF approval. On-chain data shows accumulation by large holders.",
    impact: "HIGH",
    sentiment: "Bullish",
    asset: "ETHUSD",
    timestamp: new Date(Date.now() - 120 * 60_000).toISOString(),
    source: "CoinGecko",
    tags: ["Ethereum", "Crypto", "ETF"],
    url: "https://www.coingecko.com/",
  },
];

interface AlphaVantageItem {
  title: string;
  summary: string;
  time_published: string;
  source: string;
  overall_sentiment_label: string;
  topics?: { topic: string }[];
}

function mapSentiment(label: string): NewsItem["sentiment"] {
  const l = label.toLowerCase();
  if (l.includes("bear") || l.includes("negative")) return "Bearish";
  if (l.includes("bull") || l.includes("positive")) return "Bullish";
  return "Neutral";
}

function assignImpact(item: AlphaVantageItem): NewsItem["impact"] {
  const text = `${item.title} ${item.summary}`.toLowerCase();
  if (
    text.includes("cpi") ||
    text.includes("inflation") ||
    text.includes("fed") ||
    text.includes("fomc")
  )
    return "HIGH";
  if (
    text.includes("support") ||
    text.includes("resistance") ||
    text.includes("break")
  )
    return "MEDIUM";
  return "LOW";
}

export async function fetchMarketNews(): Promise<NewsItem[]> {
  const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY;

  if (!apiKey) {
    await new Promise((r) => setTimeout(r, 1200));
    return MOCK_MARKET_DATA;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(
      `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=financial_markets&apikey=${apiKey}`,
      { signal: controller.signal },
    );
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`API ${res.status}`);

    const data = await res.json();

    if (!data.feed || data.feed.length === 0) {
      return MOCK_MARKET_DATA;
    }

    return data.feed.slice(0, 8).map((item: AlphaVantageItem, i: number) => ({
      id: `av-${i}`,
      title: item.title,
      summary: item.summary?.slice(0, 250) ?? "",
      impact: assignImpact(item),
      sentiment: mapSentiment(item.overall_sentiment_label ?? "Neutral"),
      asset: "FOREX",
      timestamp: item.time_published
        ? new Date(
            item.time_published.replace(
              /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/,
              "$1-$2-$3T$4:$5:$6",
            ),
          ).toISOString()
        : new Date().toISOString(),
      source: item.source ?? "Alpha Vantage",
      tags: item.topics?.map((t) => t.topic) ?? [],
    }));
  } catch {
    return MOCK_MARKET_DATA;
  }
}

// Contextual AI response logic
export function generateAIResponse(query: string, news: NewsItem[]): string {
  const q = query.toLowerCase();

  const cpiNews = news.find(
    (n) =>
      n.tags.some((t) => ["CPI", "Inflation"].includes(t)) ||
      n.title.toLowerCase().includes("cpi") ||
      n.title.toLowerCase().includes("inflation"),
  );

  if (
    (q.includes("market") && q.includes("down")) ||
    q.includes("why") ||
    q.includes("cpi") ||
    q.includes("inflation")
  ) {
    if (cpiNews) {
      return `📊 **Market Analysis:**\n\nThe market is reacting to the US CPI data coming in at 3.5%, which is higher than expected. This is bearish for Gold.\n\n**Key factors:**\n- Core CPI at 3.8% signals persistent inflation\n- Fed rate cut expectations are being repriced\n- Treasury yields rising, putting pressure on Gold\n\n*Source: ${cpiNews.source}*`;
    }
  }

  const goldNews = news.filter(
    (n) => n.asset === "XAUUSD" || n.tags.includes("Gold"),
  );
  if (q.includes("gold") || q.includes("xau")) {
    if (goldNews.length > 0) {
      return `🥇 **Gold (XAUUSD) Brief:**\n\n${goldNews.map((n) => `• ${n.title} — Sentiment: **${n.sentiment}**`).join("\n")}\n\nGold is under pressure from multiple factors including rising yields and hot CPI data. The break below $2030 support is technically significant.`;
    }
  }

  const btcNews = news.filter(
    (n) =>
      n.asset === "BTCUSD" ||
      n.tags.includes("Bitcoin") ||
      n.tags.includes("Crypto"),
  );
  if (q.includes("bitcoin") || q.includes("btc") || q.includes("crypto")) {
    if (btcNews.length > 0) {
      return `₿ **Bitcoin Analysis:**\n\n${btcNews.map((n) => `• ${n.title} — Sentiment: **${n.sentiment}**`).join("\n")}\n\nBitcoin is showing relative strength, holding the $70k psychological level. Institutional ETF inflows continue to provide a floor.`;
    }
  }

  // Risk management / volatility / losing money
  if (
    q.includes("risk") ||
    q.includes("losing") ||
    q.includes("loss") ||
    q.includes("stop loss")
  ) {
    return `⚠️ **Risk Management Insight:**\n\nBased on current market conditions, here are key Risk Management principles:\n\n- Never risk more than 2% of your capital per trade\n- Use stop-loss orders on every position\n- Consider reducing position sizes during high-volatility events (like today's CPI)\n\n_I've filtered the learning videos to show Risk Management content for you._`;
  }

  if (q.includes("volatil")) {
    return `📈 **Volatility Analysis:**\n\nCurrent market volatility is elevated due to macro events.\n\n- VIX is trending higher post-CPI\n- Consider using Deriv's Multipliers for controlled exposure\n- Tighter stop-losses recommended in volatile conditions\n\n_Check the learning panel for videos on understanding Volatility._`;
  }

  if (q.includes("summary") || q.includes("brief") || q.includes("overview")) {
    const highImpact = news.filter((n) => n.impact === "HIGH");
    return `📋 **Market Summary:**\n\n**${news.length} active alerts** | **${highImpact.length} high-impact** events\n\n${news.map((n) => `• [${n.impact}] ${n.title} — ${n.sentiment}`).join("\n")}\n\n_Use specific queries like "Why is the market down?" or "Gold analysis" for deeper insights._`;
  }

  return `🤖 I can analyze the **${news.length} current market events** for you.\n\nTry asking:\n• _"Why is the market down?"_\n• _"Gold analysis"_\n• _"Bitcoin outlook"_\n• _"I keep losing on volatility"_\n• _"Give me a market summary"_\n\nI'll cross-reference the latest news and suggest relevant learning content.`;
}
