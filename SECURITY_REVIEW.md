# VocalInk Security Review

This document lists the security risks observed in the current codebase. Items are ordered by severity.

## Critical findings
- **Leaked Google Cloud service account** (`server/src/config/google-credentials.json`): The file contains a full service account private key. Anyone with repo access can authenticate to your Google Cloud project and read/write data or run workloads. **Remediate:** Remove the file from source control, revoke/rotate the service account key in Google Cloud IAM, and load credentials via environment variables or a secrets manager instead of committing them.

- **Production secrets committed to VCS** (`server/.env`): The env file includes real API keys (OpenAI, SMTP, Cloudinary) and JWT secrets. Because `server/.env` is not gitignored, the secrets are exposed and can be abused (free API usage, spam via SMTP, tampering with stored media). **Remediate:** Add `server/.env` to `.gitignore`, rotate all exposed keys, and inject them securely through environment management (CI secrets, vault, or deployment config).

- **Forgeable authentication tokens** (`server/.env`, `server/src/services/WebSocketService.js`, `server/src/services/JWTService.js`): The JWT secret is set to a trivial value (`change-me`) and is stored in the repository. With the leaked secret an attacker can mint arbitrary access tokens and connect to both REST and WebSocket endpoints as any user. **Remediate:** Rotate JWT signing keys, store them only in secure environment variables, enforce strong random secrets in production, and invalidate existing tokens after the rotation.

## High findings
- **Credential logging** (`server/src/services/imageStorageService.js`): Cloudinary configuration (including the API key prefix and secret presence) is printed to the console on startup. If logs are aggregated or shared, this leaks sensitive configuration. **Remediate:** Remove credential logging entirely or mask with proper redaction utilities before logging.

## Medium findings
- **Tokens stored in web storage** (`client/src/services/api.js`, `client/src/utils/storage.js`): Access and refresh tokens are kept in `sessionStorage`, which is readable by any injected script. In the presence of XSS, tokens can be stolen to hijack accounts. **Remediate:** Prefer HttpOnly, secure cookies for tokens, or add strong CSP plus rigorous XSS hardening if storage cannot be changed.

- **Open CORS fallback** (`server/src/app.js`): When `CORS_ORIGIN` is unset, the server allows all origins (`origin: true`). In production this enables any site to call the API with user credentials. **Remediate:** Set explicit, trusted origins in production and fail closed when the env var is missing.

## Suggested next steps
- Immediately rotate all exposed secrets (GCP service account, OpenAI, SMTP, Cloudinary, JWT/signing keys) and purge them from git history if the repository is public.
- Add missing ignores for secret files (e.g., `server/.env`, credential JSON) and move secrets to your deployment secret store.
- Remove sensitive logging and add log redaction for any configuration that includes keys or tokens.
- Consider migrating auth tokens to HttpOnly cookies and add an allowlist-based CORS configuration for production.
