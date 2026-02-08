# Deployment Guide - Railway

Deploy The Mindful Trader to Railway for production use.

## Prerequisites
- Completed local setup
- GitHub account
- Railway account
- Supabase project configured

## Step 1: Prepare for Deployment

### 1.1 Push to GitHub

```bash
git add .
git commit -m "Initial commit - Phase 1 MVP"
git branch -M main
git remote add origin https://github.com/yourusername/TradingJournal.git
git push -u origin main
```

### 1.2 Environment Variables Checklist

Ensure you have these values ready:
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ ENCRYPTION_SECRET_KEY
- ⬜ ADMIN_OPENROUTER_API_KEY (optional)

## Step 2: Deploy to Railway

### 2.1 Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authenticate with GitHub
5. Select "TradingJournal" repository

### 2.2 Configure Environment Variables

1. In Railway dashboard, go to your project
2. Click on the service
3. Go to "Variables" tab
4. Add each environment variable:

```env
NEXT_PUBLIC_SUPABASE_URL=https://pkgnikqykdqdhlqvxrxa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENCRYPTION_SECRET_KEY=your-32-byte-hex-key
NEXT_PUBLIC_APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NODE_ENV=production
```

Note: `${{RAILWAY_PUBLIC_DOMAIN}}` is automatically replaced by Railway.

### 2.3 Deploy

Railway will automatically detect Next.js and:
- Install dependencies
- Build the application
- Start the production server

Deployment takes 2-3 minutes.

## Step 3: Configure Custom Domain (Optional)

### 3.1 Railway Domain

Railway provides a free domain:
- Format: `your-app-name.up.railway.app`
- Automatic HTTPS
- No configuration needed

### 3.2 Custom Domain

1. In Railway, go to Settings > Domains
2. Click "Add Domain"
3. Enter your domain (e.g., tradingjournal.com)
4. Add DNS records at your domain registrar:
   - CNAME: `your-app-name.up.railway.app`
5. Wait for DNS propagation (5-60 minutes)

## Step 4: Update Supabase Settings

### 4.1 Add Railway URL to Allowed Origins

1. Go to Supabase dashboard
2. Authentication > URL Configuration
3. Add your Railway URL:
   - `https://your-app-name.up.railway.app`
4. Save changes

### 4.2 Update Redirect URLs

Add these redirect URLs in Supabase:
- `https://your-app-name.up.railway.app/auth/callback`
- `https://your-app-name.up.railway.app/**`

## Step 5: Test Production Deployment

### 5.1 Access Your App

1. Go to your Railway URL
2. Create a test account
3. Log a test trade
4. Verify dashboard loads
5. Test CSV import

### 5.2 Verify Features

Checklist:
- ✅ Signup works
- ✅ Login works
- ✅ Dashboard displays
- ✅ Can create trades
- ✅ Metrics calculate correctly
- ✅ CSV import works
- ✅ Mobile responsive

## Step 6: Monitoring & Maintenance

### 6.1 Railway Metrics

Monitor in Railway dashboard:
- CPU usage
- Memory usage
- Request count
- Error rate

### 6.2 Logs

View logs in Railway:
1. Click on service
2. Go to "Logs" tab
3. Filter by error/warning

### 6.3 Database Monitoring

Check Supabase dashboard:
- Database size
- Active connections
- Query performance

## Step 7: Continuous Deployment

### 7.1 Automatic Deploys

Railway automatically deploys when you push to `main`:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Railway will:
1. Detect changes
2. Build new version
3. Deploy with zero downtime

### 7.2 Rollback

If deployment fails:
1. Go to Railway deployments
2. Find previous successful deployment
3. Click "Redeploy"

## Troubleshooting

### Build Fails
- Check Railway build logs
- Verify all dependencies in package.json
- Ensure TypeScript errors are fixed
- Run `npm run build` locally first

### Runtime Errors
- Check Railway runtime logs
- Verify environment variables are set
- Test API routes individually
- Check Supabase connection

### Database Issues
- Verify RLS policies are enabled
- Check Supabase service status
- Confirm connection limits not exceeded
- Review SQL migration logs

## Cost Estimates

### Railway
- Hobby Plan: $5/month (includes 500 hours)
- Typical usage: ~$5-10/month for small apps
- Scales automatically with traffic

### Supabase
- Free tier: 500MB database, 1GB storage, 2GB bandwidth
- Upgrade: $25/month for more resources
- Typical usage: Free tier sufficient for personal use

## Security Checklist

Before going live:
- ✅ Environment variables are secret (not in code)
- ✅ RLS policies enabled on all tables
- ✅ Service role key kept secure
- ✅ HTTPS enabled (automatic with Railway)
- ✅ API keys encrypted in database
- ✅ CORS configured correctly

## Next Steps

Your app is now live! 🎉

### Share with Users
- Create user documentation
- Add feedback mechanism
- Monitor usage and errors

### Phase 2 Development
- Continue developing locally
- Deploy updates via git push
- Use feature branches for major changes

---

Need help? Check Railway docs or Supabase support.
