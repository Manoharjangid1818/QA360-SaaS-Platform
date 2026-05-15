# QA360 Quick Start Guide

## Prerequisites
- Node.js 20.x
- npm

## Local Development Setup (5 minutes)

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd QA360-SaaS-Platform
```

### 2. Install & Configure Frontend
```bash
cd dashboard

# Copy and configure environment file
cp .env.example .env.local
# Edit .env.local - REACT_APP_API_URL should be http://localhost:3001
# (already configured by default)

# Install dependencies
npm install
```

### 3. Install & Configure Backend
```bash
cd ../backend

# Copy and configure environment file
cp .env.example .env
# Edit .env - Fill in OpenAI key and Supabase credentials (optional for testing)

# Install dependencies (includes Playwright browser)
npm install
```

### 4. Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Backend will run on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd dashboard
npm start
# Frontend will run on http://localhost:3000
```

### 5. Open Application
Visit http://localhost:3000 in your browser

---

## What Works Without Configuration

The app has built-in demo data and works without setting environment variables:

✅ Dashboard with sample data
✅ Running test scans
✅ Viewing reports
✅ Scheduler UI
✅ Bug tracking

To fully enable features, configure:

- **OpenAI Integration**: Add `OPENAI_API_KEY` in backend/.env
- **Database**: Add Supabase credentials in backend/.env
- **Notifications**: Add Slack/Email config in backend/.env

---

## Production Deployment

See [README_DEPLOYMENT.md](README_DEPLOYMENT.md) for:
- Vercel frontend deployment
- Railway backend deployment
- Supabase database setup
- Environment variables reference
- Troubleshooting guide

---

## Common Commands

### Frontend (dashboard/)
```bash
npm start        # Development server
npm run build    # Production build
npm test         # Run tests
```

### Backend (backend/)
```bash
npm run dev      # Development (auto-reload)
npm start        # Production
```

### From Root
```bash
npm install      # Install all dependencies
```

---

## File Structure

```
QA360-SaaS-Platform/
├── dashboard/           # React CRA Frontend
│   ├── src/
│   │   └── App.js       # Main app component
│   ├── public/
│   ├── package.json
│   └── .env.example
├── backend/             # Express API Server
│   ├── app.js           # Express app setup
│   ├── server.js        # Server entry point
│   ├── services/        # Playwright, scheduler
│   ├── utils/
│   ├── package.json
│   └── .env.example
├── README_DEPLOYMENT.md # Production deployment guide
├── README.md            # Main README
└── .env.example         # Root environment variables
```

---

## API Endpoints

### Health Check
```bash
GET http://localhost:3001/health
```

### Run Test
```bash
POST http://localhost:3001/api/test
Content-Type: application/json

{
  "url": "https://example.com"
}
```

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process using port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Kill process using port 3001 (Windows)
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### CORS Errors
- Ensure backend is running on port 3001
- Check REACT_APP_API_URL in dashboard/.env.local
- Verify backend CORS_ORIGINS includes frontend URL

### Playwright Browser Missing
```bash
cd backend
npm install
# Playwright will auto-install browser
```

### Environment Variables Not Loading
- Make sure file is named `.env.local` (frontend) or `.env` (backend)
- Restart dev server after editing env files
- Check for typos in variable names

---

## Next Steps

1. ✅ Local development working
2. 📝 Configure environment variables for full features
3. 🚀 Deploy to production (see README_DEPLOYMENT.md)
4. 📊 Import/create test cases
5. ⏰ Set up schedulers
6. 🔗 Connect CI/CD integration

---

## Support

- Documentation: [README.md](README.md)
- Deployment Guide: [README_DEPLOYMENT.md](README_DEPLOYMENT.md)
- Backend API: `GET /health` endpoint confirms server is running
- Frontend: Open browser console (F12) for JavaScript errors

