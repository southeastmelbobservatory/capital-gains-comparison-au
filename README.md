# Capital Gains

Australian capital gains tax calculator for the Budget 2026-27 CGT reform announcement.

The app uses a single date-driven calculation path rather than comparing legacy methods:

- gains up to 1 July 2027 use current discount treatment where eligible
- gains after 1 July 2027 use an inflation-indexed real-gain approach
- post-reform gains can trigger the announced 30% minimum tax rule

This is an estimate tool only. It is not tax, legal, or financial advice.

## Status

The interface and calculation model are implemented. Remaining project work is tracked in `PLAN.md`.

## Local Development

```bash
npm install
npm run dev -- --host 0.0.0.0
```

Open:

```text
http://localhost:5173/
```

For LAN access, use the host machine IP, for example:

```text
http://192.168.0.120:5173/
```

If the LAN URL does not load, allow the Vite port through the host firewall:

```bash
sudo ufw allow from 192.168.0.0/24 to any port 5173 proto tcp
```

## Verification

```bash
npm run build
npm run lint
```

Both commands should pass before publishing changes.

## Data

CPI handling is currently input-driven. The remaining work is to embed or generate the CPI dataset from the verified ABS table 17 source and add a repeatable update script.

## Sources

- Budget 2026-27 tax reform: https://budget.gov.au/content/04-tax-reform.htm
- PM and Treasurer release: https://www.pm.gov.au/media/tax-reform-workers-businesses-and-future-generations
