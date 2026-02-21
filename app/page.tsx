"use client"

import { I18nProvider } from "@/lib/i18n-context"
import Navbar from "@/components/navbar"
import HeroSection from "@/components/hero-section"
import StatsStrip from "@/components/stats-strip"
import CategoriesSection from "@/components/categories-section"
import FeaturedGame from "@/components/featured-game"
import ShareSection from "@/components/share-section"
import CtaSection from "@/components/cta-section"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <I18nProvider>
      <main>
        <Navbar />
        <HeroSection />
        <StatsStrip />
        <CategoriesSection />
        <FeaturedGame />
        <ShareSection />
        <CtaSection />
        <Footer />
      </main>
    </I18nProvider>
  )
}
