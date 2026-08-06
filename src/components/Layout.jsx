export default function Layout({ title, subtitle, right, children, footer }) {
  return (
    <div className="min-h-full mx-auto max-w-md px-4 pb-28 pt-5">
      <header className="flex items-end justify-between mb-4">
        <div>
          {subtitle && <div className="text-brand text-xs font-bold uppercase tracking-widest">{subtitle}</div>}
          <h1 className="h-display text-3xl leading-none">{title}</h1>
        </div>
        {right}
      </header>
      <main className="space-y-4">{children}</main>
      {footer && (
        <div className="fixed bottom-0 inset-x-0 z-20">
          <div className="mx-auto max-w-md p-3 bg-ink/80 backdrop-blur border-t border-line">
            {footer}
          </div>
        </div>
      )}
    </div>
  )
}
