# QA360 Dashboard

## Vercel Deployment

1. Push to GitHub.
2. Connect to Vercel, import repo.
3. Add Environment Variable in Vercel dashboard:
   - Name: `REACT_APP_API_URL`
   - Value: `https://qa360-saas-platform-production.up.railway.app`

4. Deploy! Output dir: `build`

## Local Development

Copy `.env.example` to `.env` and run:

```bash
npm install
npm start
```

## Build

```bash
npm run build
```

See standard CRA docs for more.

**Note:** Uses Node 18.x
