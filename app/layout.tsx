import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import clsx from "clsx";
import "./globals.css";
import { GamificationProvider } from "@/lib/gamification-context";
// import { ChallengeProvider } from "@/lib/challenge-context"; // Challenges feature paused

const dmSans = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TradeQuest – Gamified Trading Education by DerivHub",
  description: "Learn to trade smarter through AI coaching, personalized quests, and real behavioral insights powered by your Deriv account.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={clsx(dmSans.className, "antialiased")} suppressHydrationWarning>
        <GamificationProvider>
          {children}
        </GamificationProvider>
      </body>
    </html>
  );
}
