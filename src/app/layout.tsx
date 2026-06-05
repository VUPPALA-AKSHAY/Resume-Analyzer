import type { Metadata } from "next";
import "./globals.css";
import { AgentationDevtools } from "@/components/agentation-devtools";

export const metadata: Metadata = {
  title: "Shuroq AI - Resume Analyzer & Optimization",
  description:
    "Evaluate your experience against specific job requirements, highlight strengths, and bridge capability gaps with precision AI analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full font-sans">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-background text-on-surface antialiased transition-colors duration-300">
        {children}
        <AgentationDevtools />
      </body>
    </html>
  );
}
