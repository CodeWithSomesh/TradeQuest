import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import clsx from "clsx";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DerivHub – Your AI Trading Intelligence Companion",
  description: "Real-time market analysis, behavioral coaching, and social content generation powered by AI for retail traders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={clsx(dmSans.className, "antialiased")} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}