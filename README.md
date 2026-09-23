# IPv4 Subnet Calculator

## Project Overview

A professional, client-side web application for calculating and explaining IPv4 subnetting.
It helps networking and cybersecurity students, IT professionals and beginners understand
IPv4 addressing, CIDR notation, subnet masks, network and broadcast addresses, and usable
host ranges.

Everything runs in the browser. There is no database, no authentication and no external API.

## Features

- IPv4 address and CIDR prefix input with strict validation
- Network address, broadcast address, first/last usable host
- Usable host count and total address count
- Subnet mask and wildcard mask
- IP class (A–E) and IP type (Private, Public, Loopback, Link-Local, CGNAT, Multicast, Reserved)
- Binary breakdown of the address and mask, with network bits highlighted
- Plain-language explanation of how each result is derived
- Subnetting quick reference table (/8 to /32)
- Example loader, Reset button, Enter-to-calculate, auto-focused first input
- Last valid result is preserved until a new valid calculation replaces it
- Mobile-first responsive layout, dark technical theme

## How IPv4 Subnetting Works

An IPv4 address is 32 bits, written as four octets (0–255). A subnet mask splits those
32 bits into a **network part** and a **host part**.

- **Subnet mask** — the leading network bits are 1, the trailing host bits are 0.
- **Network address** — address `AND` mask (all host bits cleared). First address of the subnet.
- **Broadcast address** — network `OR` wildcard (all host bits set). Last address of the subnet.
- **Usable hosts** — normally the addresses between network and broadcast, so `2^hostBits - 2`.
- **Wildcard mask** — the bitwise inverse of the subnet mask, used in ACLs.

Special cases:

- `/31` — RFC 3021 point-to-point link: both addresses are usable (2 hosts).
- `/32` — a single host route (1 host).
- `/0` — the entire IPv4 space, 4,294,967,296 addresses.

## CIDR Explained

CIDR notation (`192.168.20.224/27`) states how many leading bits belong to the network.
`/27` means 27 network bits and 5 host bits, giving a mask of `255.255.255.224`,
32 total addresses and 30 usable hosts per subnet.

## Technologies

## Development Approach

This project was developed as a practical networking and cybersecurity
learning project.

The application was built using an AI-assisted development workflow with
Lovable. The generated implementation was reviewed, tested and validated
against IPv4 subnetting rules and edge cases.

The subnet calculation logic is isolated from the user interface and covered
by automated unit tests using Vitest.

- React 19 + TypeScript (strict mode)
- TanStack Start / TanStack Router
- Tailwind CSS v4 (design tokens in `src/styles.css`)
- Vitest for unit tests

Calculation logic lives in `src/lib/subnet.ts`, fully separated from the UI components
in `src/components/subnet/` and the page in `src/routes/index.tsx`.

## Example Calculation

Input: `192.168.20.224/27`

| Field              | Value             |
| ------------------ | ----------------- |
| Network Address    | 192.168.20.224    |
| Broadcast Address  | 192.168.20.255    |
| First Usable Host  | 192.168.20.225    |
| Last Usable Host   | 192.168.20.254    |
| Usable Hosts       | 30                |
| Total Addresses    | 32                |
| Subnet Mask        | 255.255.255.224   |
| Wildcard Mask      | 0.0.0.31          |
| IP Class / Type    | C / Private       |

## Testing

```bash
bunx vitest run
```

Covered: valid and invalid IPv4 parsing, CIDR boundary validation (0, 32, 33, -1, empty),
mask generation, subnet/broadcast/host-range calculations, the mandatory cases
(`192.168.20.224/27`, `192.168.1.0/24`, `10.0.0.0/8`), special prefixes
(`/0`, `/16`, `/24`, `/27`, `/28`, `/29`, `/30`, `/31`, `/32`), classification and binary output.

## Security Considerations

- Client-side only — no requests leave the browser
- No user data storage, no cookies, no tracking
- No secrets or API keys
- All input is strictly validated and parsed before use; nothing is rendered as raw HTML
- Integer-based (uint32) arithmetic avoids floating-point errors

## Future Improvements

- Subnet splitting / VLSM planner
- IPv6 support
- Export results as CSV or JSON
- Shareable URL state for a given network
