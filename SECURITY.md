# Security Policy

## Supported Versions

| Version            | Supported |
| ------------------ | --------- |
| `main` (latest)    | ✅        |
| All other branches | ❌        |

Only the `main` branch receives security fixes. Pre-release and feature branches are not supported.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report vulnerabilities privately using [GitHub Security Advisories](https://github.com/shaes-farm/time-traveler/security/advisories/new). This ensures the issue can be assessed and a fix prepared before any public disclosure.

### What to include

- A description of the vulnerability and its potential impact
- Steps to reproduce or a proof-of-concept (if available)
- Any suggested mitigations

### Response timeline

| Milestone          | Target                                      |
| ------------------ | ------------------------------------------- |
| Acknowledgement    | Within 72 hours                             |
| Initial assessment | Within 7 days                               |
| Fix or workaround  | Within 30 days (critical), 90 days (others) |
| Public disclosure  | Coordinated with reporter                   |

We aim to keep you informed throughout the process.

## Scope

The following are **in scope** for security reports:

- SQL injection or data exposure via Supabase RLS bypass
- Authentication or authorization flaws
- Secrets or credentials inadvertently committed or exposed
- Dependency vulnerabilities with a known exploit path in this application
- Cross-site scripting (XSS) or CSRF in the web applications

The following are **out of scope**:

- Vulnerabilities in Supabase infrastructure itself (report to [Supabase](https://supabase.com/docs/guides/platform/security))
- Vulnerabilities in Vercel infrastructure (report to [Vercel](https://vercel.com/security))
- Issues requiring physical access to a device
- Social engineering attacks
- Denial-of-service attacks against hosted infrastructure
- Automated scanner results without a demonstrated exploit path

## Dependency Security

This project uses [Dependabot](https://docs.github.com/en/code-security/dependabot) for automated dependency vulnerability alerts and security updates. Security patches for direct and transitive dependencies are applied as soon as a fix is available upstream.
