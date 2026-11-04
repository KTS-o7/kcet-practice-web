# Deploying kcet.shenthar.me (run only after the user approves going live)

One-time server setup (VPS `personal`, see ~/Documents/side-projects/infra/memory.md):
1. `ssh personal 'mkdir -p /opt/kcet/data /opt/kcet/backups && chown -R deploy:deploy /opt/kcet'`
2. `/opt/kcet/.env` (chmod 600, owner deploy): `KCET_PASSCODE=<shared passcode>` and `KCET_SECRET=<openssl rand -hex 32>`
3. Copy `deploy/kcet.service` → `/etc/systemd/system/kcet.service`; `systemctl daemon-reload && systemctl enable kcet`
4. Cloudflare DNS: A record `kcet` → VPS IP, proxied (orange cloud), like the other subdomains.
5. Copy `deploy/nginx-kcet.shenthar.me.conf` → `/etc/nginx/sites-available/`, symlink into sites-enabled, `nginx -t`, `certbot --nginx -d kcet.shenthar.me`, `systemctl reload nginx`.
6. `deploy/kcet-backup` → `/etc/cron.daily/kcet-backup` (chmod 755).
7. `scripts/deploy.sh` from the Mac. Then add the service to infra/memory.md (port 8093) and uptimectl.
