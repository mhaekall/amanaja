"use client"

import { useI18n } from "@/lib/i18n-context"

export default function Footer() {
  const { t } = useI18n()

  return (
    <footer className="bg-foreground text-primary-foreground/50 px-5 md:px-10 py-10">
      <div className="max-w-[1160px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-serif font-extrabold text-lg text-primary-foreground">
          Amanaja<span className="text-primary">.</span>
        </div>
        <ul className="flex items-center gap-6">
          <li>
            <a href="#" className="text-[13px] text-primary-foreground/40 hover:text-primary-foreground transition-colors">
              {String(t("footer_about"))}
            </a>
          </li>
          <li>
            <a href="#" className="text-[13px] text-primary-foreground/40 hover:text-primary-foreground transition-colors">
              {String(t("footer_privacy"))}
            </a>
          </li>
          <li>
            <a href="#" className="text-[13px] text-primary-foreground/40 hover:text-primary-foreground transition-colors">
              {String(t("footer_contact"))}
            </a>
          </li>
        </ul>
        <div className="text-xs text-primary-foreground/40">
          {String(t("footer_copy"))}
        </div>
      </div>
    </footer>
  )
}
