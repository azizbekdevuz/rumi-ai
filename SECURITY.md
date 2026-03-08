# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < main  | :x:                |

We support the latest version on the `main` branch. Older branches or forks are not officially supported.

## Reporting a Vulnerability

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in Rumi AI Agent, please report it responsibly:

1. **Open a private security advisory**  
   Go to the **Security** tab of this repository → **Advisories** → **New draft security advisory**, or use the **Report a vulnerability** button.

2. **Provide details**  
   Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Affected components (frontend, backend, auth, etc.)
   - Potential impact
   - Suggested fix (if any)

3. **Allow time for response**  
   We aim to acknowledge within 48 hours and provide an initial assessment within 7 days.

### What to Expect

- **Acknowledgment**: We will confirm receipt of your report.
- **Assessment**: We will evaluate the vulnerability and determine severity.
- **Fix**: We will work on a fix and coordinate disclosure with you.
- **Credit**: With your permission, we will include your name in the security advisory and release notes.

### Out of Scope

- Issues that require physical access to the device
- Social engineering attacks
- Denial of service (DoS) that do not involve a clear code defect
- Issues in third-party dependencies that are not directly exploitable in our usage

## Security Practices in This Project

- **OAuth**: Backend uses server-configured redirect URIs only; client-supplied `redirect_uri` is never trusted for token exchange.
- **JWT**: Tokens are signed with `SECRET_KEY`; use a strong, unique key in production.
- **Secrets**: Never commit `.env`, `.env.local`, or any file containing API keys or secrets.
- **CORS**: `ALLOWED_HOSTS` controls CORS origins; restrict in production.
- **Dependencies**: Keep `requirements.txt` and `package.json` dependencies up to date.

## Disclosure Policy

We follow coordinated disclosure. We will:

1. Work with the reporter to understand and fix the issue
2. Prepare a fix and release
3. Publish a security advisory with credit to the reporter (if desired)
4. Not disclose before a fix is available, unless required by law

Thank you for helping keep Rumi AI Agent and its users safe.
