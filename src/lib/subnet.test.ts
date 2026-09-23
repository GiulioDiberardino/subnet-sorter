import { describe, expect, it } from "vitest";
import {
  buildQuickReference,
  calculateSubnet,
  formatIpv4,
  maskFromCidr,
  parseIpv4,
  validateInput,
} from "./subnet";

describe("parseIpv4", () => {
  it("accepts valid addresses", () => {
    expect(parseIpv4("0.0.0.0")).toBe(0);
    expect(parseIpv4("255.255.255.255")).toBe(4294967295);
    expect(formatIpv4(parseIpv4("192.168.20.224")!)).toBe("192.168.20.224");
  });

  it("rejects invalid addresses", () => {
    for (const bad of ["", "1.2.3", "1.2.3.4.5", "256.1.1.1", "-1.0.0.0", "a.b.c.d", "192.168.01.1", "192.168.1."]) {
      expect(parseIpv4(bad)).toBeNull();
    }
  });
});

describe("validateInput", () => {
  it("flags invalid cidr boundaries", () => {
    expect(validateInput("10.0.0.0", "33")).toHaveLength(1);
    expect(validateInput("10.0.0.0", "-1")).toHaveLength(1);
    expect(validateInput("10.0.0.0", "")).toHaveLength(1);
    expect(validateInput("10.0.0.0", "0")).toHaveLength(0);
    expect(validateInput("10.0.0.0", "32")).toHaveLength(0);
  });

  it("flags invalid ip", () => {
    expect(validateInput("999.1.1.1", "24")[0]?.field).toBe("ip");
  });
});

describe("maskFromCidr", () => {
  it("builds masks at boundaries", () => {
    expect(formatIpv4(maskFromCidr(0))).toBe("0.0.0.0");
    expect(formatIpv4(maskFromCidr(8))).toBe("255.0.0.0");
    expect(formatIpv4(maskFromCidr(27))).toBe("255.255.255.224");
    expect(formatIpv4(maskFromCidr(32))).toBe("255.255.255.255");
  });
});

describe("calculateSubnet - mandatory cases", () => {
  it("192.168.20.224/27", () => {
    const r = calculateSubnet("192.168.20.224", 27);
    expect(r.networkAddress).toBe("192.168.20.224");
    expect(r.broadcastAddress).toBe("192.168.20.255");
    expect(r.firstUsableHost).toBe("192.168.20.225");
    expect(r.lastUsableHost).toBe("192.168.20.254");
    expect(r.usableHostCount).toBe(30);
    expect(r.subnetMask).toBe("255.255.255.224");
    expect(r.wildcardMask).toBe("0.0.0.31");
    expect(r.ipClass).toBe("C");
    expect(r.ipType).toBe("Private");
  });

  it("192.168.1.0/24", () => {
    const r = calculateSubnet("192.168.1.0", 24);
    expect(r.networkAddress).toBe("192.168.1.0");
    expect(r.broadcastAddress).toBe("192.168.1.255");
    expect(r.usableHostCount).toBe(254);
  });

  it("10.0.0.0/8", () => {
    const r = calculateSubnet("10.0.0.0", 8);
    expect(r.networkAddress).toBe("10.0.0.0");
    expect(r.broadcastAddress).toBe("10.255.255.255");
    expect(r.usableHostCount).toBe(16777214);
    expect(r.totalAddresses).toBe(16777216);
  });
});

describe("calculateSubnet - special prefixes", () => {
  it("/32 single host", () => {
    const r = calculateSubnet("192.168.20.224", 32);
    expect(r.networkAddress).toBe("192.168.20.224");
    expect(r.broadcastAddress).toBe("192.168.20.224");
    expect(r.usableHostCount).toBe(1);
    expect(r.totalAddresses).toBe(1);
  });

  it("/31 point-to-point (RFC 3021)", () => {
    const r = calculateSubnet("10.0.0.5", 31);
    expect(r.networkAddress).toBe("10.0.0.4");
    expect(r.broadcastAddress).toBe("10.0.0.5");
    expect(r.firstUsableHost).toBe("10.0.0.4");
    expect(r.lastUsableHost).toBe("10.0.0.5");
    expect(r.usableHostCount).toBe(2);
  });

  it("/30, /29, /28", () => {
    expect(calculateSubnet("10.0.0.6", 30).networkAddress).toBe("10.0.0.4");
    expect(calculateSubnet("10.0.0.6", 30).usableHostCount).toBe(2);
    expect(calculateSubnet("10.0.0.9", 29).networkAddress).toBe("10.0.0.8");
    expect(calculateSubnet("10.0.0.9", 29).usableHostCount).toBe(6);
    expect(calculateSubnet("10.0.0.20", 28).networkAddress).toBe("10.0.0.16");
    expect(calculateSubnet("10.0.0.20", 28).broadcastAddress).toBe("10.0.0.31");
    expect(calculateSubnet("10.0.0.20", 28).usableHostCount).toBe(14);
  });

  it("/16 and /0", () => {
    const r16 = calculateSubnet("172.16.45.9", 16);
    expect(r16.networkAddress).toBe("172.16.0.0");
    expect(r16.broadcastAddress).toBe("172.16.255.255");
    expect(r16.usableHostCount).toBe(65534);

    const r0 = calculateSubnet("8.8.8.8", 0);
    expect(r0.networkAddress).toBe("0.0.0.0");
    expect(r0.broadcastAddress).toBe("255.255.255.255");
    expect(r0.totalAddresses).toBe(4294967296);
    expect(r0.usableHostCount).toBe(4294967294);
  });

  it("classifies public and loopback addresses", () => {
    expect(calculateSubnet("8.8.8.8", 32).ipType).toBe("Public");
    expect(calculateSubnet("127.0.0.1", 8).ipType).toBe("Loopback");
    expect(calculateSubnet("169.254.1.1", 16).ipType).toBe("Link-Local (APIPA)");
    expect(calculateSubnet("172.16.0.1", 12).ipType).toBe("Private");
  });

  it("produces binary strings", () => {
    const r = calculateSubnet("192.168.20.224", 27);
    expect(r.binaryIp).toBe("11000000.10101000.00010100.11100000");
    expect(r.binarySubnetMask).toBe("11111111.11111111.11111111.11100000");
  });

  it("rejects out-of-range cidr", () => {
    expect(() => calculateSubnet("10.0.0.0", 33)).toThrow();
    expect(() => calculateSubnet("10.0.0.0", -1)).toThrow();
    expect(() => calculateSubnet("bad", 24)).toThrow();
  });
});

describe("buildQuickReference", () => {
  it("covers the requested range", () => {
    const rows = buildQuickReference(24, 32);
    expect(rows).toHaveLength(9);
    expect(rows[0]).toEqual({
      cidr: 24,
      subnetMask: "255.255.255.0",
      networkBits: 24,
      hostBits: 8,
      usableHosts: 254,
    });
    expect(rows[8]?.usableHosts).toBe(1);
  });
});
