interface RevenuePathCardProps {
  index: string;
  title: string;
  proof: string;
  onSelect: () => void;
}

export function RevenuePathCard({
  index,
  title,
  proof,
  onSelect,
}: RevenuePathCardProps) {
  return (
    <button
      type="button"
      className="relative flex flex-col overflow-hidden rounded-lg border border-border bg-card p-6 text-left text-card-foreground shadow-line transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={onSelect}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        {index}
      </div>
      <h2 className="mt-8 text-4xl font-semibold tracking-[-0.04em]">
        {title}
      </h2>
      <p className="mt-auto pt-8 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {proof}
      </p>
    </button>
  );
}
