import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "Neon Pong Ultimate -- Amanaja",
  description: "Game Pong klasik dengan visual neon, hyper strike, efek partikel, dan arcade mode.",
}

export const viewport: Viewport = {
  themeColor: "#090514",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function NeonPongLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
