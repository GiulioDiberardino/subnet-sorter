import { buildQuickReference } from "@/lib/subnet";

const rows = buildQuickReference(8, 32);

interface QuickReferenceProps {
  activeCidr?: number | undefined;
}

export function QuickReference({ activeCidr }: QuickReferenceProps) {
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            {["CIDR", "Subnet Mask", "Network Bits", "Host Bits", "Usable Hosts"].map((h) => (
              <th key={h} className="label-eyebrow px-4 py-3 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((row) => (
            <tr
              key={row.cidr}
              className={`border-b border-border/60 last:border-0 ${
                row.cidr === activeCidr ? "bg-accent/60 text-foreground" : "text-muted-foreground"
              }`}
            >
              <td className="px-4 py-2 font-semibold text-primary">/{row.cidr}</td>
              <td className="px-4 py-2">{row.subnetMask}</td>
              <td className="px-4 py-2">{row.networkBits}</td>
              <td className="px-4 py-2">{row.hostBits}</td>
              <td className="px-4 py-2">{row.usableHosts.toLocaleString("en-US")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
