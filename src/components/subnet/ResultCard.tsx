interface ResultCardProps {
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
}

export function ResultCard({ label, value, hint, mono = true }: ResultCardProps) {
  return (
    <div className="panel p-4 transition-colors hover:border-primary/50">
      <p className="label-eyebrow">{label}</p>
      <p
        className={`mt-2 break-all text-lg font-semibold text-foreground ${mono ? "font-mono" : ""}`}
      >
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
