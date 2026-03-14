# API Operations & Contract: Version 1 (Hardened)

This document formalizes the operational contract for the system, ensuring predictable behavior and clear communication between the backend and its consumers.

## 1. Universal Versioning Policy

### `X-Api-Version` Header

- **Current Version**: `1`
- **Mandatory**: All requests MUST include `X-Api-Version: 1`.
- **Enforcement**:
  - Requests missing this header or providing an incorrect version will be rejected with `400 Bad Request`.
  - **Sunset Policy**: New versions will have a 60-day parallel window before the previous version is retired.

## 2. Standardized Error Contracts

During **DEGRADED** or **DRAINING** modes, mutating requests will return a `503 Service Unavailable` response with the following V1 schema:

```json
{
  "v": 1,
  "error": "SERVICE_UNAVAILABLE",
  "code": 503,
  "retryable": false,
  "reason": "Database disconnected. State mutation is currently disabled.",
  "blocking": ["DB"],
  "timestamp": "2025-12-31T14:30:00Z"
}
```

### Retry Logic Guidelines

- `retryable: true`: The failure is likely transient (e.g., node rotation). Clients should use exponential backoff.
- `retryable: false`: The failure is architectural or structural (e.g., misconfiguration or persistent outage). Clients should NOT auto-retry and instead inform the user.

## 3. Observability Headers

All responses will include diagnostic headers to improve client-side logging and debugging:

- `X-System-Mode`: Current lifecycle state (`READY`, `DEGRADED`, `DRAINING`).
- `X-Request-Fingerprint`: Unique hash of the request + client identity.
- `X-Cache-Age`: Time (in seconds) since the data was last fetched from the source of truth (DB).

## 4. Lifecycle States

| State | Readiness (`/ready`) | Description |
| :--- | :--- | :--- |
| `BOOTING` | `503` | System is initializing. Probes will fail. |
| `READY` | `200` | Full functionality active. |
| `DEGRADED` | `503` | Core infra (DB) down. READ_ONLY path active. |
| `DRAINING` | `503` | Shutting down. New requests rejected, inflight allowed. |
| `TERMINATED` | `503` | Shutdown complete. Process exiting. |

## 5. Security: Trusted Proxy Boundaries

The system uses `X-Forwarded-For` for client fingerprinting.

- **Trusted Proxies**: Only headers from known infrastructure (e.g., Vercel, Nginx) are trusted.
- **Fallback**: If headers are missing or spoofed, the system falls back to `(RemoteIP + UserAgent)` hashing.
