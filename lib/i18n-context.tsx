"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export type Lang = "id" | "en"

const translations = {
  id: {
    // Navbar
    nav_categories: "Kategori",
    nav_games: "Games",
    nav_share: "Share",

    // Hero
    hero_badge: "Serba Ada \u00B7 Serba Seru",
    hero_h1_line1: "Satu tempat",
    hero_h1_line2: "buat semua",
    hero_h1_line3: "yang seru.",
    hero_desc: "Main game, pelajari hal baru, atau coba tools keren \u2014 semua gratis, semua bisa kamu share ke medsos.",
    hero_cta_primary: "Mulai Eksplorasi",
    hero_cta_secondary: "Coba Game",

    // Stats
    stats_content: "Konten tersedia",
    stats_categories: "Serba ada",
    stats_free: "Gratis selamanya",
    stats_lang: "Dua bahasa",
    stats_cat_accent: " kategori",

    // Categories
    cat_badge: "Semua Kategori",
    cat_heading: "Mau ngapain hari ini?",
    cat_desc: "Pilih sesukamu. Semuanya gratis, semuanya seru, dan hasilnya bisa langsung kamu share.",
    cat_games_title: "Games",
    cat_games_desc: "Game arcade seru yang bisa kamu main kapan saja dan bagikan skormu ke teman.",
    cat_games_tags: ["Snake Neo", "Neon Pong", "2048", "+ lainnya"],
    cat_edu_title: "Edukasi",
    cat_edu_desc: "Quiz interaktif dan flashcard yang bikin belajar terasa menyenangkan dan tidak membosankan.",
    cat_edu_tags: ["Kuis Sejarah", "Sains", "Bahasa", "+ lainnya"],
    cat_tools_title: "Tools",
    cat_tools_desc: "Kalkulator dan tools seru yang hasilnya bisa kamu share sebagai kartu yang keren.",
    cat_tools_tags: ["Kalk. Usia", "BMI", "Zodiak", "+ lainnya"],

    // Featured Game
    fg_badge: "Game Unggulan",
    fg_heading_1: "Ular Neo",
    fg_heading_2: "8-Bit.",
    fg_desc: "Game Snake klasik yang diremix habis-habisan \u2014 CRT visual, dash mechanic, efek partikel, dan sistem level. Main sekarang, share skormu.",
    fg_feat_1: "Efek visual retro CRT & pixel art",
    fg_feat_2: "Dash mechanic dengan energy bar",
    fg_feat_3: "Sistem level & special food",
    fg_feat_4: "Mobile-friendly dengan D-pad",
    fg_cta: "Main Sekarang",
    fg_score: "Skor",
    fg_length: "Panjang",

    // Featured Pong
    fp_badge: "Game Baru",
    fp_heading_1: "Neon Pong",
    fp_heading_2: "Ultimate.",
    fp_desc: "Game Pong klasik dengan sentuhan neon futuristik \u2014 hyper strike, arcade mode, efek partikel, dan visual retro CRT. Tantang CPU sekarang.",
    fp_feat_1: "Visual neon retro dengan CRT scanline",
    fp_feat_2: "Hyper Strike untuk smash super",
    fp_feat_3: "Arcade Mode dengan stage progresif",
    fp_feat_4: "Mobile-friendly dengan drag & D-pad",
    fp_cta: "Main Sekarang",
    fp_player: "KAMU",

    // Share
    share_badge: "Share System",
    share_heading_1: "Hasil kamu,",
    share_heading_2: "layak dipamerkan.",
    share_desc: "Setiap hasil di Amanaja otomatis jadi share card yang keren. Tinggal download dan post.",
    share_game_title: "Skor Game",
    share_game_desc: "Cetak rekor? Langsung share card dengan skor, level, dan badge pencapaianmu.",
    share_tools_title: "Hasil Tools",
    share_tools_desc: '"Aku sudah hidup 9.234 hari!" \u2014 divisualisasikan jadi kartu yang bikin orang penasaran.',
    share_quiz_title: "Hasil Quiz",
    share_quiz_desc: "Nilai quiz kamu jadi kartu yang bisa dibanding-bandingkan sama teman.",
    share_card_level: "Level 6 \u00B7 Snake Neo",
    share_card_days: "hari hidup \u00B7 Kalk. Usia",

    // CTA
    cta_heading_1: "Apa lagi yang",
    cta_heading_2: "kamu tunggu?",
    cta_desc: "Gratis. Tanpa daftar. Langsung main dan share. Sesederhana itu.",
    cta_primary: "Mulai Sekarang",
    cta_secondary: "Coba Game",

    // Footer
    footer_about: "Tentang",
    footer_privacy: "Privacy",
    footer_contact: "Contact",
    footer_copy: "\u00A9 2025 Amanaja \u00B7 Made with \u2615",
  },
  en: {
    // Navbar
    nav_categories: "Categories",
    nav_games: "Games",
    nav_share: "Share",

    // Hero
    hero_badge: "All-in-One \u00B7 All Fun",
    hero_h1_line1: "One place",
    hero_h1_line2: "for all the",
    hero_h1_line3: "fun stuff.",
    hero_desc: "Play games, learn something new, or try cool tools \u2014 all free, all shareable to social media.",
    hero_cta_primary: "Start Exploring",
    hero_cta_secondary: "Try Games",

    // Stats
    stats_content: "Content available",
    stats_categories: "All-in-one",
    stats_free: "Free forever",
    stats_lang: "Bilingual",
    stats_cat_accent: " categories",

    // Categories
    cat_badge: "All Categories",
    cat_heading: "What do you want to do today?",
    cat_desc: "Pick what you like. Everything is free, fun, and instantly shareable.",
    cat_games_title: "Games",
    cat_games_desc: "Fun arcade games you can play anytime and share your scores with friends.",
    cat_games_tags: ["Snake Neo", "Neon Pong", "2048", "+ more"],
    cat_edu_title: "Education",
    cat_edu_desc: "Interactive quizzes and flashcards that make learning fun and engaging.",
    cat_edu_tags: ["History Quiz", "Science", "Language", "+ more"],
    cat_tools_title: "Tools",
    cat_tools_desc: "Fun calculators and tools with shareable result cards.",
    cat_tools_tags: ["Age Calc", "BMI", "Zodiac", "+ more"],

    // Featured Game
    fg_badge: "Featured Game",
    fg_heading_1: "Snake Neo",
    fg_heading_2: "8-Bit.",
    fg_desc: "The classic Snake game remixed to the max \u2014 CRT visuals, dash mechanic, particle effects, and a level system. Play now, share your score.",
    fg_feat_1: "Retro CRT & pixel art visuals",
    fg_feat_2: "Dash mechanic with energy bar",
    fg_feat_3: "Level system & special food",
    fg_feat_4: "Mobile-friendly with D-pad",
    fg_cta: "Play Now",
    fg_score: "Score",
    fg_length: "Length",

    // Featured Pong
    fp_badge: "New Game",
    fp_heading_1: "Neon Pong",
    fp_heading_2: "Ultimate.",
    fp_desc: "The classic Pong game with a futuristic neon twist \u2014 hyper strike, arcade mode, particle effects, and retro CRT visuals. Challenge the CPU now.",
    fp_feat_1: "Retro neon visuals with CRT scanlines",
    fp_feat_2: "Hyper Strike for super smash",
    fp_feat_3: "Arcade Mode with progressive stages",
    fp_feat_4: "Mobile-friendly with drag & D-pad",
    fp_cta: "Play Now",
    fp_player: "YOU",

    // Share
    share_badge: "Share System",
    share_heading_1: "Your results",
    share_heading_2: "deserve the spotlight.",
    share_desc: "Every result on Amanaja automatically becomes a beautiful share card. Just download and post.",
    share_game_title: "Game Scores",
    share_game_desc: "Set a record? Instantly share a card with your score, level, and achievement badges.",
    share_tools_title: "Tool Results",
    share_tools_desc: '"I\'ve lived 9,234 days!" \u2014 visualized as a card that sparks curiosity.',
    share_quiz_title: "Quiz Results",
    share_quiz_desc: "Your quiz scores become cards you can compare with friends.",
    share_card_level: "Level 6 \u00B7 Snake Neo",
    share_card_days: "days alive \u00B7 Age Calc",

    // CTA
    cta_heading_1: "What are you",
    cta_heading_2: "waiting for?",
    cta_desc: "Free. No sign-up. Just play and share. It's that simple.",
    cta_primary: "Start Now",
    cta_secondary: "Try Games",

    // Footer
    footer_about: "About",
    footer_privacy: "Privacy",
    footer_contact: "Contact",
    footer_copy: "\u00A9 2025 Amanaja \u00B7 Made with \u2615",
  },
} as const

type TranslationKey = keyof typeof translations.id

interface I18nContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey) => string | string[]
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("id")

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang)
  }, [])

  const t = useCallback(
    (key: TranslationKey): string | string[] => {
      return translations[lang][key] ?? key
    },
    [lang]
  )

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within <I18nProvider>")
  return ctx
}
