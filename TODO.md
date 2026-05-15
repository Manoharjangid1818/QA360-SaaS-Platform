# QA360 Production Deployment Refactor — TODO

## ✅ 1) Remove Replit dependencies
- [x] Delete: .replit
- [x] Delete: replit.nix
- [x] Delete: replit.md
- [x] Delete: .replit_integration_files/
- [x] Remove Replit references from .env.example
- [x] Remove Replit references from .env.local.example
- [x] Update next.config.js to remove Replit domains

## ✅ 2) Frontend (dashboard / CRA)
- [x] Remove proxy from dashboard/package.json
- [x] Remove cross-env from scripts and dependencies
- [x] Verify all API calls use REACT_APP_API_URL
- [x] Create dashboard/.env.example with REACT_APP_API_URL=http://localhost:3001

## ✅ 3) Backend (Express)
- [x] Verify backend/server.js uses process.env.PORT || 3001
- [x] Verify CORS configured with environment variables
- [x] Verify GET /health endpoint exists
- [x] Verify centralized error handling in place

## ✅ 4) Playwright Railway compatibility
- [x] Verify backend/package.json has postinstall "playwright install --with-deps"

## ✅ 5) Environment variables
- [x] Create backend/.env.example with all required keys
- [x] Update dashboard/.env.example

## ✅ 6) Production scripts
- [x] Verify dashboard build script: react-scripts build
- [x] Verify backend start script: node server.js

## ✅ 7) Deployment documentation
- [x] Create README_DEPLOYMENT.md with complete Vercel + Railway deployment guide
- [x] Update main README.md to reference deployment guide
- [x] Remove Replit references from README.md

## ⏳ 8) Cleanup
- [ ] Review and remove any dead code
- [ ] Review and remove debug console.log statements
- [ ] Remove unused imports
- [ ] Remove duplicate configurations

## ⏳ 9) Local Testing & Verification
- [ ] npm install in dashboard/ and backend/
- [ ] npm start in dashboard/ (verify port 3000)
- [ ] npm run dev in backend/ (verify port 3001)
- [ ] Test API connectivity from frontend to backend
- [ ] Verify core features work end-to-end

## ⏳ 10) Production Verification
- [ ] Dashboard deploys to Vercel
- [ ] Backend deploys to Railway
- [ ] Health endpoint responds
- [ ] Frontend-backend CORS working
- [ ] Playwright tests execute in Railway container