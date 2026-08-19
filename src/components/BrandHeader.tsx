export default function BrandHeader() {
  return (
    <header className="pointer-events-none absolute top-0 inset-x-0 z-10 flex items-start justify-between p-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-ink/80 backdrop-blur-md border border-hairline px-3.5 py-2">
        <span className="h-2 w-2 rounded-full bg-electric shadow-[0_0_10px_2px_rgba(47,111,237,0.7)]" />
        <span className="font-display font-semibold text-[15px] tracking-tight text-paper">
          MtaaMap
        </span>
        <span className="hidden sm:inline text-[11px] font-body text-fog border-l border-hairline pl-2 ml-0.5">
          Mtaa Yetu
        </span>
      </div>
    </header>
  )
}