interface ViewHeaderProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Standard header block used at the top of every /app page. Keeps page
 * headers visually consistent without adding another primitive.
 */
export function ViewHeader({ eyebrow, title, subtitle, actions }: ViewHeaderProps) {
  return (
    <header className="flex items-end justify-between border-b border-hairline bg-canvas px-7 py-6">
      <div>
        <div className="mb-2 font-mono text-[10.5px] font-medium tracking-[0.14em] text-accent">
          § {eyebrow}
        </div>
        <h1 className="mb-1.5 font-display text-[28px] font-black leading-[1.05] tracking-[-0.03em] text-ink">
          {title}
        </h1>
        {subtitle && (
          <p className="max-w-[640px] font-body text-[13px] leading-[1.55] text-ink-softer">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
