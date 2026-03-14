# Runbook: Hardened Architecture & Gating

This document provides operational guidance for engineers maintaining the decentralized gating and state systems.

## 1. System Lifecycle Management

The system transitions through several lifecycle states. You can monitor the current state via `X-System-Mode` header in any response or via `/api/health/ready`.

| State | Recovery Action |
| :--- | :--- |
| `DEGRADED` | Investigate MongoDB connection. Check `MONGODB_URI` and network visibility between app and DB. |
| `DRAINING` | Normal during deployment. If stuck, check for long-running jobs in `queueService`. |
| `READY` | Full system health. |

## 2. HMAC Key Rotation (Zero-Downtime)

To rotate secrets without dropping traffic:

1. **Stage 1**: Set `HMAC_KEY_PREVIOUS` to the current key.
2. **Stage 2**: Set `HMAC_KEY_CURRENT` to the new secret.
3. **Stage 3**: Deploy. The system will verify signatures against both keys.
4. **Stage 4**: Once clients have updated (typically 24h), remove `HMAC_KEY_PREVIOUS`.

## 3. Interpreting `X-Cache-Status`

Clients must respect this header to prevent showing high-trust UI when the source of truth is stale.

- `FRESH`: Data is live from DB.
- `STALE`: Data is from local cache/memory. Show minor warning.
- `STALE_CRITICAL`: Infrastructure is down and cache is > 5 mins old. **Disable mutations and show persistent blocking UI banner.**

## 4. Forced Emergency Read-Only

If you need to manually force the system into `DEGRADED` mode without a total outage:

1. Revoke DB access for the app user.
2. The system will automatically transition to `DEGRADED` on the next connection probe.
3. `gatekeeper` will immediately block all `STATE_MUTATING` routes.

## 5. Troubleshooting Gating Failures

If legitimate traffic is being blocked with `INVALID_API_VERSION`:

- Verify the client is sending `X-Api-Version: 1`.
- Check if a reverse proxy is stripping headers.

If signature verification consistently fails:

- Check for time-sync issues (drifting clocks can affect signature windows if timestamps are included in future versions).
- Verify the `HMAC_KEY_CURRENT` matches between the signing service and the backend.
