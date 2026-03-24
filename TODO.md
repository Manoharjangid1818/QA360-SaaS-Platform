# QA360 Deploy Ready TODO

## Steps (7/8 complete)

✅ **Done:**
- [x] Step 1-6: Cleanups, builds, structure, package.json, copies, PM2 config, env, README
- [x] Step 7: Prod tweaks - app.js serves dashboard-build/, env/env vars in email/scheduler/runTest, playwright CI headless/json reporter
- [x] Copied dashboard-build/ to QA360-deploy/

## Pending:
- [ ] Step 8: Test deps (`npm i` running), playwright browsers (`npx playwright install --with-deps`), PM2 start ecosystem.config.js. Verify server/dashboard/logs/status endpoints.

**Deploy ready!** QA360-deploy/ is now production package: npm i, pm2 start ecosystem.config.js or upload to VPS/Heroku.

Test command: `cd QA360-deploy && npm run pm2` or manual pm2.

Final result below.
