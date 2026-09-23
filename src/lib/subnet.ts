/**
 * IPv4 subnet calculation logic (integer-based, no floating point).
 * All addresses are handled as unsigned 32-bit integers via >>> 0.
 */

export interface SubnetResult {
  networkAddress: string;
  broadcastAddress: string;
  firstUsableHost: string | null;
  lastUsableHost: string | null;
  usableHostCount: number;
  totalAddresses: number;
  subnetMask: string;
  wildcardMask: string;
  cidr: number;
  ipClass: string;
  ipType: string;
  binaryIp: string;
  binarySubnetMask: string;
  networkBits: number;
  hostBits: number;
}

export interface ValidationError {
  field: "ip" | "cidr";
  message: string;
}

const OCTET_PATTERN = /^\d{1,3}$/;

/** Parses a dotted-quad string into a uint32, or null when invalid. */
export function parseIpv4(value: string): number | null {
  const trimmed = value.trim();
  const parts = trimmed.split(".");
  if (parts.length !== 4) return null;

  let result = 0;
  for (const part of parts) {
    if (!OCTET_PATTERN.test(part)) return null;
    // Reject padded octets like "01" to keep input unambiguous.
    if (part.length > 1 && part.startsWith("0")) return null;
    const octet = Number(part);
    if (octet < 0 || octet > 255) return null;
    result = (result * 256 + octet) >>> 0;
  }
  return result >>> 0;
}

export function formatIpv4(value: number): string {
  return [
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ].join(".");
}

export function toBinaryString(value: number): string {
  const bits = (value >>> 0).toString(2).padStart(32, "0");
  return `${bits.slice(0, 8)}.${bits.slice(8, 16)}.${bits.slice(16, 24)}.${bits.slice(24)}`;
}

/** Builds the subnet mask as a uint32 for a CIDR prefix between 0 and 32. */
export function maskFromCidr(cidr: number): number {
  if (cidr === 0) return 0;
  return (0xffffffff << (32 - cidr)) >>> 0;
}

export function getIpClass(ip: number): string {
  const firstOctet = (ip >>> 24) & 255;
  if (firstOctet < 128) return "A";
  if (firstOctet < 192) return "B";
  if (firstOctet < 224) return "C";
  if (firstOctet < 240) return "D (Multicast)";
  return "E (Experimental)";
}

export function getIpType(ip: number): string {
  const a = (ip >>> 24) & 255;
  const b = (ip >>> 16) & 255;

  if (a === 10) return "Private";
  if (a === 172 && b >= 16 && b <= 31) return "Private";
  if (a === 192 && b === 168) return "Private";
  if (a === 127) return "Loopback";
  if (a === 169 && b === 254) return "Link-Local (APIPA)";
  if (a === 100 && b >= 64 && b <= 127) return "Carrier-Grade NAT";
  if (a >= 224 && a <= 239) return "Multicast";
  if (a >= 240) return "Reserved";
  if (a === 0) return "Reserved (This network)";
  return "Public";
}

export function validateInput(ipInput: string, cidrInput: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (ipInput.trim() === "") {
    errors.push({ field: "ip", message: "Enter an IPv4 address." });
  } else if (parseIpv4(ipInput) === null) {
    errors.push({
      field: "ip",
      message: "Invalid IPv4 address. Use four octets between 0 and 255 (e.g. 192.168.20.224).",
    });
  }

  const cidrTrimmed = cidrInput.trim();
  if (cidrTrimmed === "") {
    errors.push({ field: "cidr", message: "Enter a CIDR prefix." });
  } else if (!/^\d{1,2}$/.test(cidrTrimmed)) {
    errors.push({ field: "cidr", message: "CIDR must be a whole number between 0 and 32." });
  } else {
    const cidr = Number(cidrTrimmed);
    if (cidr < 0 || cidr > 32) {
      errors.push({ field: "cidr", message: "CIDR must be between 0 and 32." });
    }
  }

  return errors;
}

export function calculateSubnet(ipInput: string, cidr: number): SubnetResult {
  const ip = parseIpv4(ipInput);
  if (ip === null) throw new Error("Invalid IPv4 address");
  if (!Number.isInteger(cidr) || cidr < 0 || cidr > 32) throw new Error("Invalid CIDR prefix");

  const mask = maskFromCidr(cidr);
  const wildcard = (~mask) >>> 0;
  const network = (ip & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;

  const hostBits = 32 - cidr;
  // 2 ** hostBits stays exact for hostBits <= 32 (well below 2^53).
  const totalAddresses = Math.pow(2, hostBits);

  let firstUsableHost: string | null;
  let lastUsableHost: string | null;
  let usableHostCount: number;

  if (cidr === 32) {
    // Single host route: the address itself.
    firstUsableHost = formatIpv4(network);
    lastUsableHost = formatIpv4(network);
    usableHostCount = 1;
  } else if (cidr === 31) {
    // RFC 3021 point-to-point link: both addresses are usable.
    firstUsableHost = formatIpv4(network);
    lastUsableHost = formatIpv4(broadcast);
    usableHostCount = 2;
  } else {
    firstUsableHost = formatIpv4((network + 1) >>> 0);
    lastUsableHost = formatIpv4((broadcast - 1) >>> 0);
    usableHostCount = totalAddresses - 2;
  }

  return {
    networkAddress: formatIpv4(network),
    broadcastAddress: formatIpv4(broadcast),
    firstUsableHost,
    lastUsableHost,
    usableHostCount,
    totalAddresses,
    subnetMask: formatIpv4(mask),
    wildcardMask: formatIpv4(wildcard),
    cidr,
    ipClass: getIpClass(ip),
    ipType: getIpType(ip),
    binaryIp: toBinaryString(ip),
    binarySubnetMask: toBinaryString(mask),
    networkBits: cidr,
    hostBits,
  };
}

export interface QuickReferenceRow {
  cidr: number;
  subnetMask: string;
  networkBits: number;
  hostBits: number;
  usableHosts: number;
}

export function buildQuickReference(from = 16, to = 32): QuickReferenceRow[] {
  const rows: QuickReferenceRow[] = [];
  for (let cidr = from; cidr <= to; cidr++) {
    const hostBits = 32 - cidr;
    const total = Math.pow(2, hostBits);
    let usable: number;
    if (cidr === 32) usable = 1;
    else if (cidr === 31) usable = 2;
    else usable = total - 2;
    rows.push({
      cidr,
      subnetMask: formatIpv4(maskFromCidr(cidr)),
      networkBits: cidr,
      hostBits,
      usableHosts: usable,
    });
  }
  return rows;
}
