# QA360 Production Deployment Guide

This guide covers deploying QA360 to production with:
- **Frontend (React CRA)** → Vercel
- **Backend (Express + Playwright)** → Railway  
- **Database** → Supabase

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Setup](#local-setup)
3. [Database Setup (Supabase)](#database-setup-supabase)
4. [Backend Deployment (Railway)](#backend-deployment-railway)
5. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)
8. [Environment Variables Reference](#environment-variables-reference)

---

## Prerequisites

- Node.js 20.x or later
- npm or yarn
- Git
- Accounts:
  - [Supabase](https://app.supabase.com)
  - [Railway](https://railway.app)
  - [Vercel](https://vercel.com)
  - [OpenAI](https://platform.openai.com) (for AI features)

---

## Local Setup

### 1. Clone and Install Dependencies

```bash
# Clone repository
git clone <your-repo-url>
cd QA360-SaaS-Platform

# Install root dependencies (for Next.js app if used)
npm install

# Install frontend (React CRA) dependencies
cd dashboard
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Configure Environment Variables

#### Dashboard (.env.local)

```bash
cd dashboard
cp .env.example .env.local
```

Edit `dashboard/.env.local`:
```
REACT_APP_API_URL=http://localhost:3001
```

#### Backend (.env)

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:5000
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=your-openai-api-key
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 3. Start Local Development

```bash
# Terminal 1: Start Backend
cd backend
npm run dev
# Backend runs on http://localhost:3001

# Terminal 2: Start Frontend
cd dashboard
npm start
# Frontend runs on http://localhost:3000
```

Visit http://localhost:3000 in your browser.

---

## Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in project details:
   - Name: `qa360`
   - Database password: Generate strong password
   - Region: Choose closest to your users
4. Click "Create new project"

### 2. Get API Keys

After project creation:
1. Go to Project Settings → API
2. Copy these keys:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Set Up Database Schema

1. In Supabase console, go to SQL Editor
2. Create necessary tables for your QA360 features:
   - Test results
   - Test schedules
   - Reports
   - User data (if using auth)

Or import existing schema:
```bash
# If schema file exists
psql -h your-supabase-host -U postgres -d postgres -f supabase-schema.sql
```

### 4. Verify Connection

Test the connection from your backend:
```bash
# Backend .env should have Supabase credentials
npm run dev
# Check console for successful Supabase connection
```

---

## Backend Deployment (Railway)

### 1. Create Railway Project

1. Go to https://railway.app
2. Click "Create Project"
3. Select "Deploy from GitHub"
4. Connect your GitHub account
5. Select your repository

### 2. Configure Backend Service

1. In Railway dashboard:
   - Click "Add Service"
   - Select "GitHub Repository"
   - Choose the repository
   
2. Configure service:
   - Name: `qa360-backend`
   - Root Directory: `backend` (if monorepo)
   - Install Command: `npm install`
   - Start Command: `npm start`

### 3. Set Environment Variables on Railway

In Railway dashboard for backend service:

1. Go to Variables tab
2. Add these environment variables:

```
PORT=5000
NODE_ENV=production

# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# CORS - Update with your Vercel frontend URL
CORS_ORIGINS=https://your-frontend.vercel.app,https://qa360.yourcompany.com

# Frontend URL for redirects
FRONTEND_URL=https://your-frontend.vercel.app

# Optional services
# SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
# GITHUB_TOKEN=your-github-token
```

### 4. Enable Public Networking

1. In Railway service settings
2. Go to "Public Networking"
3. Click "Generate Domain"
4. Copy the generated URL (e.g., `https://qa360-backend-prod.railway.app`)
5. Note this URL for frontend configuration

### 5. Deploy Backend

1. Push your changes to GitHub
2. Railway automatically builds and deploys
3. Check deployment status in Railway dashboard
4. Verify `/health` endpoint:
   ```bash
   curl https://your-backend.railway.app/health
   ```

### 6. Configure PostgreSQL on Railway (Optional)

If using Railway for database:

1. In Railway project, click "Add Service"
2. Select "PostgreSQL"
3. Configure database
4. Copy connection string to backend `.env`

---

## Frontend Deployment (Vercel)

### 1. Prepare for Vercel

In `dashboard/` directory, verify:
- `package.json` has correct build script
- Environment variables are configured
- No hardcoded URLs pointing to localhost

### 2. Connect GitHub to Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Select "Import Git Repository"
4. Choose your repository
5. Select `dashboard` as root directory

### 3. Configure Vercel Project

1. **Project Name**: `qa360-frontend`

2. **Framework**: Select "Create React App"

3. **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

4. **Environment Variables**:
   Add this variable:
   ```
   REACT_APP_API_URL=https://your-backend.railway.app
   ```
   (Use the Railway backend URL from previous step)

### 4. Deploy

1. Click "Deploy"
2. Vercel builds and deploys
3. Note your Vercel URL (e.g., `https://qa360-frontend.vercel.app`)
4. Update Railway backend CORS_ORIGINS with this URL

### 5. Add Custom Domain (Optional)

1. In Vercel project settings
2. Go to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

---

## Post-Deployment Verification

### 1. Test Backend Health

```bash
curl https://your-backend.railway.app/health
# Should return: {"status":"ok"}
```

### 2. Test API Connectivity

From frontend, open browser console:
```javascript
fetch('https://your-backend.railway.app/health')
  .then(r => r.json())
  .then(console.log)
```

### 3. Verify Frontend Access

1. Visit your Vercel frontend URL
2. Check that API calls work (no CORS errors)
3. Test core features:
   - Running a test
   - Scheduler operations
   - Report generation

### 4. Check Logs

**Railway Backend Logs**:
1. Go to Railway dashboard
2. Click your backend service
3. View "Deployments" tab for build logs
4. View "Logs" tab for runtime logs

**Vercel Frontend Logs**:
1. Go to Vercel project
2. Click "Deployments"
3. Select latest deployment
4. View build logs

---

## Environment Variables Reference

### Backend (Railway .env)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Server port (Railway sets this) | `5000` |
| `NODE_ENV` | Yes | Environment | `production` |
| `SUPABASE_URL` | Yes* | Supabase project URL | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Yes* | Supabase public key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes* | Supabase admin key | `eyJ...` |
| `OPENAI_API_KEY` | Yes* | OpenAI API key | `sk-...` |
| `CORS_ORIGINS` | No | Allowed CORS origins | `https://qa360.vercel.app` |
| `FRONTEND_URL` | No | Frontend URL | `https://qa360.vercel.app` |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` | No | Chrome path (leave empty) | `` |

*Required for specific features

### Frontend (Vercel Environment)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `REACT_APP_API_URL` | Yes | Backend API URL | `https://qa360-backend.railway.app` |

---

## Troubleshooting

### CORS Errors

**Error**: "Access to XMLHttpRequest at 'https://backend-url' blocked by CORS policy"

**Solution**:
1. Check backend `CORS_ORIGINS` includes frontend URL
2. Restart Railway deployment after updating env vars
3. Verify headers in network tab

### Backend Connection Failed

**Error**: Frontend can't reach backend

**Solution**:
1. Verify Railway backend is running: `curl https://your-backend.railway.app/health`
2. Check `REACT_APP_API_URL` is correct and accessible
3. Verify no firewall/VPN blocking
4. Check browser console for exact error

### Playwright Browser Error

**Error**: "Chromium not found" or "Failed to launch browser"

**Solution**:
1. Backend has postinstall script: `playwright install --with-deps`
2. Railway redeploy: Git push to trigger rebuild
3. Check Railway build logs for Playwright installation

### 500 Errors from Backend

**Solution**:
1. Check Railway logs for error details
2. Verify all required env vars are set
3. Check database connection with `SUPABASE_*` vars
4. Restart Railway deployment

### Database Connection Errors

**Solution**:
1. Verify Supabase credentials are correct
2. Check Supabase project is active
3. Test connection locally first
4. Check Railway network access to Supabase

---

## Production Checklist

- [ ] Supabase project created and configured
- [ ] Database schema deployed
- [ ] OpenAI API key obtained
- [ ] Backend deployed to Railway
- [ ] Railway environment variables set
- [ ] Frontend deployed to Vercel
- [ ] Vercel environment variables set (REACT_APP_API_URL)
- [ ] CORS origins configured on backend
- [ ] Backend health endpoint verified
- [ ] Frontend-backend connectivity tested
- [ ] Core features tested in production
- [ ] Custom domain configured (optional)
- [ ] SSL/TLS certificates auto-renewed (automatic with Vercel/Railway)
- [ ] Monitoring and alerts set up (optional)

---

## Rollback Procedures

### Railway Backend Rollback

1. Go to Railway dashboard
2. Click backend service
3. Go to "Deployments" tab
4. Click previous successful deployment
5. Click "Redeploy"

### Vercel Frontend Rollback

1. Go to Vercel project
2. Click "Deployments"
3. Find previous successful deployment
4. Click "..." → "Redeploy"

---

## Support

For issues or questions:
1. Check Railway logs: `railway logs`
2. Check Vercel deployment logs
3. Review this deployment guide
4. Verify all environment variables
5. Test locally to isolate issues

