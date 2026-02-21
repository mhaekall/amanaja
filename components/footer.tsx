export default function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground/50 px-5 md:px-10 py-10">
      <div className="max-w-[1160px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-serif font-extrabold text-lg text-primary-foreground">
          Amanaja<span className="text-primary">.</span>
        </div>
        <ul className="flex items-center gap-6">
          <li>
            <a href="#" className="text-[13px] text-primary-foreground/40 hover:text-primary-foreground transition-colors">
              Tentang
            </a>
          </li>
          <li>
            <a href="#" className="text-[13px] text-primary-foreground/40 hover:text-primary-foreground transition-colors">
              Privacy
            </a>
          </li>
          <li>
            <a href="#" className="text-[13px] text-primary-foreground/40 hover:text-primary-foreground transition-colors">
              Contact
            </a>
          </li>
        </ul>
        <div className="text-xs text-primary-foreground/40">
          {"© 2025 Amanaja \xB7 Made with \u2615"}
        </div>
      </div>
    </footer>
  )
}
