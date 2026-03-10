# Deploy to GitHub & Vercel

## Step 1: Push to GitHub

Open terminal in VS Code and run these commands:

```bash
cd freelancer-portal

# Check if remote is set
git remote -v

# If not set, add it:
git remote add origin https://github.com/zeridexcom/langoleaf.git

# Push to GitHub
git push -u origin master
```

If you get authentication error, you may need to:
- Use GitHub CLI: `gh auth login`
- Or use HTTPS with personal access token

## Step 2: Deploy to Vercel

### Option A: Via Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
cd freelancer-portal
vercel --prod
```

### Option B: Via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import from GitHub: `zeridexcom/langoleaf`
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `freelancer-portal` (if repo has other files)
   - **Build Command**: `next build`
   - **Output Directory**: `.next`

5. Add Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://kzcbnvkwvkzlzwbvkoly.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6Y2Judmt3dmt6bHp3YnZrb2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4ODQ3NzEsImV4cCI6MjA1MjQ2MDc3MX0.-8Vj6G9MZzJqVzC7t0x3XyY3ZzZzZzZzZzZzZzZzZz
   UPSTASH_REDIS_REST_URL=your-upstash-url
   UPSTASH_REDIS_REST_TOKEN=your-upstash-token
   ```

6. Click "Deploy"

## Step 3: Configure Custom Domain

1. In Vercel dashboard, go to Project Settings > Domains
2. Add domain: `freelancer.langoleaf.com`
3. Follow DNS configuration instructions

## Environment Variables Needed

Copy these from your `.env.local` to Vercel:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://kzcbnvkwvkzlzwbvkoly.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |
| `SUPABASE_SERVICE_ROLE_KEY` | (from Supabase dashboard) |
| `UPSTASH_REDIS_REST_URL` | (from Upstash dashboard) |
| `UPSTASH_REDIS_REST_TOKEN` | (from Upstash dashboard) |
| `NEXT_PUBLIC_SITE_URL` | https://freelancer.langoleaf.com |

## Troubleshooting

If push fails:
```bash
# Force push (careful - overwrites remote)
git push -u origin master --force

# Or pull first if repo has existing content
git pull origin master --rebase
git push -u origin master
```

If Vercel build fails:
1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version (should be 18+)
