export default function CtaSection() {
  return (
    <section className="py-20 md:py-24 px-5 md:px-10 bg-background text-center">
      <div className="max-w-[600px] mx-auto">
        <h2 className="font-serif text-[clamp(32px,4.5vw,54px)] font-extrabold tracking-tight leading-[1.1] mb-4 text-balance">
          Apa lagi yang<br />
          <span className="text-primary">kamu tunggu?</span>
        </h2>
        <p className="text-base text-text-mid font-light leading-relaxed mb-9">
          Gratis. Tanpa daftar. Langsung main dan share. Sesederhana itu.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <a
            href="#kategori"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-[15px] px-7 py-3.5 rounded-xl shadow-[0_4px_16px_rgba(59,158,255,0.3)] hover:shadow-[0_8px_24px_rgba(59,158,255,0.4)] hover:-translate-y-0.5 hover:bg-blue-dark transition-all"
          >
            Mulai Sekarang
            <span aria-hidden="true">&rarr;</span>
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 bg-transparent text-foreground font-medium text-[15px] px-6 py-3.5 rounded-xl border-[1.5px] border-border-dark hover:border-blue-mid hover:text-blue-dark hover:bg-blue-light transition-all"
          >
            &#x1F602; Buat Meme
          </a>
        </div>
      </div>
    </section>
  )
}
