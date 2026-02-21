import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "Ular Neo 8-Bit — Amanaja",
  description: "Game Snake klasik yang diremix dengan CRT visual, dash mechanic, efek partikel, dan sistem level.",
}

export const viewport: Viewport = {
  themeColor: "#050510",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function SnakeGameLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
