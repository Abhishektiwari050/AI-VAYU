# 🛡️ Security Policy & Compliance Mandate — Project VAYU

Project VAYU develops safety-critical aviation intelligence software. We prioritize security, data integrity, and compliance across all components of our flight dispatch, NOTAM ingestion, and EFB integration infrastructure.

---

## 🔒 Supported Versions

We actively issue security updates and patches for the following branches:

| Major Release | Supported | Maintenance Status |
| :--- | :---: | :--- |
| `main` (v1.x) | ✅ Yes | Active Security & Safety Monitoring |
| `develop` | ⚠️ Pre-release | Active Development |

---

## 📢 Reporting a Security Vulnerability

If you discover a security vulnerability, API credential exposure, or potential flight safety flaw in Project VAYU, **do not open a public GitHub issue**.

Please report vulnerabilities directly to our security engineering team:

- **Email**: `security@ai-vayu.com` (or project maintainer)
- **Response SLA**: Initial acknowledgment within **24 hours**. Patch release target within **72 hours** for critical severity items.

Please include:
1. Description of the vulnerability (e.g. API rate limit bypass, XSS in PDF exporter, token leak).
2. Steps to reproduce or proof-of-concept payload.
3. Affected routes or files.

---

## 🛡️ OWASP & Aviation Safety Engineering Standards

1. **Parameter Sanitization & Input Validation**: All airport ICAO inputs are validated against standard 4-letter alphanumeric regex (`^[A-Z]{4}$`) to prevent injection.
2. **Cryptographic SHA-256 Audit Hashes**: Every clearance PDF release is stamped with a deterministic SHA-256 digest (`VAYU-CLR-2026-${icao}-${hash}-SHA256`) to prevent document tampering.
3. **Secret Security**: No API keys, database credentials, or private tokens are hardcoded in the codebase. All credentials must be injected via environment variables (`.env`).
4. **Verbatim Data Protection**: Raw ASCII NOTAM strings are kept immutable to prevent accidental suppression of critical hazard text.
