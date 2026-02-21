export default function StatsStrip() {
  const stats = [
    { num: "10", accent: "+", label: "Konten tersedia" },
    { num: "4", accent: " kategori", label: "Serba ada" },
    { num: "100", accent: "%", label: "Gratis selamanya" },
    { num: "ID", accent: " + EN", label: "Dua bahasa" },
  ]

  return (
    <div className="bg-off-white border-y border-border px-5 md:px-10 py-7">
      <div className="max-w-[1160px] mx-auto flex items-center justify-between flex-wrap gap-5">
        {stats.map((stat, i) => (
          <div key={stat.label} className="flex items-center gap-5">
            {i > 0 && (
              <div className="hidden md:block w-px h-10 bg-border-dark" />
            )}
            <div className="text-center">
              <div className="font-serif text-[32px] font-extrabold text-foreground leading-none">
                {stat.num}<span className="text-primary">{stat.accent}</span>
              </div>
              <div className="text-[13px] text-text-soft mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
