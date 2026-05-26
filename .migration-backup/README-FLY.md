# 🚀 Deploy QA360 to Fly.io Free Tier

## Prerequisites
- [ ] Node.js 20+ installed
- [ ] Fly.io account: `flyctl auth signup` (free tier)
- [ ] `flyctl` installed: https://fly.io/docs/hands-on/install-flyctl/

## 1. Test Locally (Recommended)
```bash
npm run build:full    # Builds dashboard → backend serves it
npm run test:local    # Starts http://localhost:8080
```
- ✅ Visit `http://localhost:8080` → QA360 UI loads
- ✅ Test URL → See real Playwright logs/screenshot

## 2. Deploy to Fly.io
```bash
# From project root (a:/Projects/QA360)
fly launch --no-deploy  # Generates fly.toml (review/edit)
fly deploy              # 🚀 Deploys to free tier
fly open                # Opens public URL
```

## 3. Verify Deployment
```bash
fly status             # App status
fly logs               # Real-time logs (Playwright output)
curl $(fly info --url)/health  # {"status":"ok"}
```
- Visit app URL → Full QA360 UI + API tests work
- Free tier: 3 shared-cpu-1x 256MB VMs, auto-suspend

## Expected Fly Logs
```
Installing Playwright deps...
QA360 backend running on port 8080
```
Test endpoint → Chromium launches, real logs appear.

## Troubleshooting
- **Build fails**: `fly secrets set CORS_ORIGINS='*'`
- **Playwright deps**: postinstall handles Linux deps automatically
- **Scale**: `fly scale count 1 --max-per-region 1`
- **Regions**: `fly regions add ord iad` (free)

**Congratulations! QA360 live on Fly.io free tier.** 🎉
