interface BinaryRowProps {
  label: string;
  bits: string;
  /** Number of leading network bits to highlight. */
  networkBits: number;
}

export function BinaryRow({ label, bits, networkBits }: BinaryRowProps) {
  const flat = bits.replace(/\./g, "");
  const octets = [0, 1, 2, 3].map((i) => flat.slice(i * 8, i * 8 + 8));

  return (
    <div className="panel p-4">
      <p className="label-eyebrow">{label}</p>
      <p className="mt-3 overflow-x-auto whitespace-nowrap font-mono text-sm sm:text-base">
        {octets.map((octet, octetIndex) => (
          <span key={octetIndex}>
            {octetIndex > 0 ? <span className="text-muted-foreground">.</span> : null}
            {octet.split("").map((bit, bitIndex) => {
              const absolute = octetIndex * 8 + bitIndex;
              return (
                <span
                  key={bitIndex}
                  className={
                    absolute < networkBits
                      ? "text-primary"
                      : "text-muted-foreground"
                  }
                >
                  {bit}
                </span>
              );
            })}
          </span>
        ))}
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        <span className="text-primary">Blue</span> = network bits · grey = host bits
      </p>
    </div>
  );
}
