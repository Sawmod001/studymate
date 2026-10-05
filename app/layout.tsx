import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "N-ATLAS StudyMate — voice-first multilingual study assistant",
  description: "Ask academic questions by voice or text in Yoruba, Hausa, Igbo or Nigerian English. Powered by N-ATLAS.",
  manifest: "/manifest.webmanifest",
  themeColor: "#09090b",
  openGraph: {
    title: "N-ATLAS StudyMate",
    description: "Understand anything, in your language. Voice-first AI study assistant powered by N-ATLAS.",
    type: "website",
  },
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
