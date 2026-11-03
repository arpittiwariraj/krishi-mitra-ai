export default function PageHeader({ eyebrow, title, subtitle, actions, icon: Icon }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
        <h1 className="mt-1 flex items-center gap-2 font-display text-3xl font-semibold text-leaf-950 sm:text-4xl">
          {Icon && (
            <span className="rounded-xl bg-leaf-100 p-2 text-leaf-700">
              <Icon size={24} />
            </span>
          )}
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-sm leading-relaxed text-leaf-600 sm:text-base">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
