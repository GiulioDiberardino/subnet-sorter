import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { BinaryRow } from "@/components/subnet/BinaryRow";
import { QuickReference } from "@/components/subnet/QuickReference";
import { ResultCard } from "@/components/subnet/ResultCard";
import { Section } from "@/components/subnet/Section";
import { calculateSubnet, validateInput, type SubnetResult } from "@/lib/subnet";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IPv4 Subnet Calculator — CIDR, Masks & Host Ranges" },
      {
        name: "description",
        content:
          "Calculate IPv4 network and broadcast addresses, subnet and wildcard masks, usable host ranges and binary breakdowns from any address and CIDR prefix.",
      },
      { property: "og:title", content: "IPv4 Subnet Calculator" },
      {
        property: "og:description",
        content:
          "Analyze IPv4 networks, subnet masks and host ranges with a fast, client-side CIDR calculator built for networking and cybersecurity learners.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SubnetCalculatorPage,
});

const EXAMPLE_IP = "192.168.20.224";
const EXAMPLE_CIDR = "27";

function SubnetCalculatorPage() {
  const [ipInput, setIpInput] = useState("");
  const [cidrInput, setCidrInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  // The last valid calculation is preserved until a new valid one replaces it.
  const [result, setResult] = useState<SubnetResult | null>(null);
  const ipRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ipRef.current?.focus();
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validationErrors = validateInput(ipInput, cidrInput);
    if (validationErrors.length > 0) {
      setErrors(Object.fromEntries(validationErrors.map((e) => [e.field, e.message])));
      return;
    }
    setErrors({});
    setResult(calculateSubnet(ipInput, Number(cidrInput.trim())));
  }

  function handleReset() {
    setIpInput("");
    setCidrInput("");
    setErrors({});
    setResult(null);
    ipRef.current?.focus();
  }

  function loadExample() {
    setIpInput(EXAMPLE_IP);
    setCidrInput(EXAMPLE_CIDR);
    setErrors({});
    setResult(calculateSubnet(EXAMPLE_IP, Number(EXAMPLE_CIDR)));
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <header>
        <p className="label-eyebrow">Network Analysis Toolkit</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
          IPv4 Subnet Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Analyze IPv4 networks, subnet masks and host ranges. Everything runs locally in your
          browser — no data leaves this page.
        </p>
      </header>

      <Section title="IPv4 Network">
        <form onSubmit={handleSubmit} className="panel p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <div>
              <label htmlFor="ip" className="label-eyebrow block">
                IPv4 Address
              </label>
              <input
                id="ip"
                ref={ipRef}
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                placeholder="192.168.20.224"
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(errors["ip"])}
                aria-describedby={errors["ip"] ? "ip-error" : undefined}
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2.5 font-mono text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring/40 aria-[invalid=true]:border-destructive"
              />
              {errors["ip"] ? (
                <p id="ip-error" className="mt-2 text-xs text-destructive">
                  {errors["ip"]}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="cidr" className="label-eyebrow block">
                CIDR Prefix (0–32)
              </label>
              <div className="mt-2 flex items-center rounded-md border border-input bg-background px-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40">
                <span className="font-mono text-base text-muted-foreground">/</span>
                <input
                  id="cidr"
                  value={cidrInput}
                  onChange={(e) => setCidrInput(e.target.value)}
                  placeholder="27"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-invalid={Boolean(errors["cidr"])}
                  aria-describedby={errors["cidr"] ? "cidr-error" : undefined}
                  className="w-full bg-transparent py-2.5 pl-1 font-mono text-base text-foreground outline-none placeholder:text-muted-foreground/60"
                />
              </div>
              {errors["cidr"] ? (
                <p id="cidr-error" className="mt-2 text-xs text-destructive">
                  {errors["cidr"]}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Calculate
            </button>
            <button
              type="button"
              onClick={loadExample}
              className="rounded-md border border-border bg-secondary px-5 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:border-primary/60"
            >
              Load Example
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Reset
            </button>
          </div>
        </form>
      </Section>

      {result ? (
        <>
          <Section title="Network Analysis">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ResultCard
                label="Network Address"
                value={result.networkAddress}
                hint="First address of the subnet."
              />
              <ResultCard
                label="Broadcast Address"
                value={result.broadcastAddress}
                hint="Last address of the subnet."
              />
              <ResultCard
                label="First Usable Host"
                value={result.firstUsableHost ?? "—"}
                hint="First normally assignable host address."
              />
              <ResultCard
                label="Last Usable Host"
                value={result.lastUsableHost ?? "—"}
                hint="Last normally assignable host address."
              />
              <ResultCard
                label="Usable Hosts"
                value={result.usableHostCount.toLocaleString("en-US")}
                hint={
                  result.cidr === 31
                    ? "RFC 3021: both addresses are usable on point-to-point links."
                    : result.cidr === 32
                      ? "A /32 identifies a single host."
                      : "Total addresses minus network and broadcast."
                }
              />
              <ResultCard
                label="Total Addresses"
                value={result.totalAddresses.toLocaleString("en-US")}
                hint={`2^${result.hostBits} addresses in this block.`}
              />
              <ResultCard
                label="Subnet Mask"
                value={result.subnetMask}
                hint="Mask that separates network bits from host bits."
              />
              <ResultCard
                label="Wildcard Mask"
                value={result.wildcardMask}
                hint="Inverse of the subnet mask."
              />
            </div>
          </Section>

          <Section title="IP Classification">
            <div className="grid gap-3 sm:grid-cols-3">
              <ResultCard label="IP Class" value={result.ipClass} />
              <ResultCard label="IP Type" value={result.ipType} />
              <ResultCard
                label="CIDR"
                value={`/${result.cidr}`}
                hint="Number of network bits represented by the prefix."
              />
            </div>
          </Section>

          <Section title="Binary Analysis">
            <div className="grid gap-3 lg:grid-cols-2">
              <BinaryRow
                label="IP Address in Binary"
                bits={result.binaryIp}
                networkBits={result.networkBits}
              />
              <BinaryRow
                label="Subnet Mask in Binary"
                bits={result.binarySubnetMask}
                networkBits={result.networkBits}
              />
            </div>
          </Section>

          <Section title="How the calculation works">
            <div className="panel space-y-3 p-5 text-sm leading-relaxed text-muted-foreground">
              <p>
                The prefix <span className="font-mono text-primary">/{result.cidr}</span> means the
                first {result.networkBits} bits of the 32-bit address identify the network, leaving{" "}
                {result.hostBits} host bits. Setting those {result.networkBits} bits to 1 produces
                the subnet mask <span className="font-mono text-foreground">{result.subnetMask}</span>
                ; inverting every bit produces the wildcard mask{" "}
                <span className="font-mono text-foreground">{result.wildcardMask}</span>.
              </p>
              <p>
                A bitwise AND between the address and the mask clears all host bits and yields the
                network address{" "}
                <span className="font-mono text-foreground">{result.networkAddress}</span>. Setting
                every host bit to 1 instead yields the broadcast address{" "}
                <span className="font-mono text-foreground">{result.broadcastAddress}</span>.
              </p>
              <p>
                With {result.hostBits} host bits the block holds 2^{result.hostBits} ={" "}
                {result.totalAddresses.toLocaleString("en-US")} addresses. {" "}
                {result.cidr <= 30
                  ? "The network and broadcast addresses are not assignable, so usable hosts = total − 2 = " +
                    result.usableHostCount.toLocaleString("en-US") +
                    "."
                  : result.cidr === 31
                    ? "A /31 is reserved for point-to-point links (RFC 3021), where both addresses are assignable."
                    : "A /32 describes one exact host, commonly used in routing and firewall rules."}
              </p>
            </div>
          </Section>
        </>
      ) : null}

      <Section
        title="Subnetting Quick Reference"
        description="Common prefixes with their masks, bit split and usable host counts."
      >
        <QuickReference activeCidr={result?.cidr} />
      </Section>

      <footer className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
        Client-side only · no storage, no tracking, no external requests.
      </footer>
    </main>
  );
}
