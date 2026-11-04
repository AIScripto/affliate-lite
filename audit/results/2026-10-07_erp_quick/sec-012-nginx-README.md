# SEC-012: nginx API rate limit keyed on a client-supplied header

**File:** `nginx/nginx.conf` (workspace root, no git history, so this is a patch for you to apply, not applied by me).

**Problem:** the `api_limit` zone is keyed on `$http_x_forwarded_for`, a header the client sends. A client that omits it gets an empty key (nginx does not count empty keys, so it is never limited); a client that sends a random value on every request gets a fresh bucket each time.

**Fix:** key the zone on `$binary_remote_addr`, the address that actually connected to nginx (same key the login zone already uses).

**Tested:** `nginx -t` on a copy of the original and a copy of the patched file (nginx 1.27.5, with the system paths, certificates and the `api` and `frontend` host names stubbed for this machine): both say "syntax is ok / test is successful". The patch applies cleanly on a fresh copy of today's file.

**Check before you apply:** is anything (a cloud load balancer, a CDN) in front of this nginx? If yes, `$binary_remote_addr` would be that balancer's address for everyone. Then also add the real-IP module (`set_real_ip_from <balancer>; real_ip_header X-Forwarded-For;`). The comment inside the patch says so too. From the file itself: this nginx proxies `/api/` straight to the API, so API requests pass **one** proxy hop (the default `TRUST_PROXY_HOPS=1` in the backend matches that).

**Apply**
```
cd /Users/tk-lpt-1088/development/react/erp/ERP
cp nginx/nginx.conf /somewhere/nginx.conf.before-sec-012      # your undo
patch -p0 --dry-run nginx/nginx.conf < audit/results/2026-10-07_erp_quick/sec-012-nginx.patch   # check first
```
If `-p0` reports a path problem, use: `patch -p1 < ...` from a folder that contains `nginx/nginx.conf`.
Then on the server: `nginx -t && nginx -s reload`.
