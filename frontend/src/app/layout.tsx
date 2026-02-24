import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SocketProvider } from "../contexts/SocketContext";
import { GameStateProvider } from "../contexts/GameStateContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "That’s Not a Hat Online",
  description: "Play That’s Not a Hat with friends online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-50`}
      >
        <SocketProvider>
          <GameStateProvider>{children}</GameStateProvider>
        </SocketProvider>
      </body>
    </html>
  );
}
