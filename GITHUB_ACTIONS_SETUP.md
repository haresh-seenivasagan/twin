# GitHub Actions Automatic Deployment Setup

This guide explains how to set up automatic deployment to Cloudflare Workers when you push to the `main` branch.

## Current Status
- ✅ GitHub Actions workflow created (`.github/workflows/deploy.yml`)
- ⚠️ Requires GitHub secrets configuration (follow steps below)

## Setup Steps

### 1. Get Your Cloudflare API Token

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use the "Edit Cloudflare Workers" template
4. **Permissions needed:**
   - Account → Cloudflare Workers Scripts → Edit
   - Account → Account Settings → Read
5. **Account Resources:** Include → Your Account (select yours)
6. Click "Continue to summary" → "Create Token"
7. **Copy the token** (you won't see it again!)

### 2. Get Your Cloudflare Account ID

1. Go to https://dash.cloudflare.com/
2. Select your domain or go to Workers & Pages
3. Look in the right sidebar for "Account ID"
4. **Copy the Account ID**

OR use wrangler:
```bash
wrangler whoami
# Look for "Account ID"
```

### 3. Add Secrets to GitHub Repository

1. Go to your GitHub repo: https://github.com/haresh-seenivasagan/twin
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**

Add these two secrets:

**Secret 1:**
- Name: `CLOUDFLARE_API_TOKEN`
- Value: (paste the API token from step 1)

**Secret 2:**
- Name: `CLOUDFLARE_ACCOUNT_ID`
- Value: (paste the Account ID from step 2)

### 4. Enable GitHub Actions (if not enabled)

1. Go to **Settings** → **Actions** → **General**
2. Under "Actions permissions", select **"Allow all actions and reusable workflows"**
3. Click **Save**

## How It Works

### Automatic Deployment
Every time you push to `main` branch:
```bash
git push origin main
```

GitHub Actions will automatically:
1. ✅ Checkout code
2. ✅ Install dependencies
3. ✅ Build Next.js app
4. ✅ Build for Cloudflare (OpenNext)
5. ✅ Deploy to Cloudflare Workers
6. ✅ Your site updates at https://twin.erniesg.workers.dev

### Manual Deployment
You can also trigger deployment manually:
1. Go to **Actions** tab in GitHub
2. Click **"Deploy to Cloudflare Workers"** workflow
3. Click **"Run workflow"** button
4. Select `main` branch
5. Click **"Run workflow"**

## Team Member Access

### For Team Members to Deploy:

**Option A: Push to main** (automatic)
```bash
git add .
git commit -m "feat: my changes"
git push origin main
# GitHub Actions deploys automatically
```

**Option B: Manual deploy** (requires wrangler setup)
```bash
# Install wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy manually
pnpm build
npx @opennextjs/cloudflare build
npx @opennextjs/cloudflare deploy
```

### Granting Access to Team Members

**For GitHub Actions to work for ALL team members:**

1. **Repo Admin** adds the secrets (only once, done above)
2. **All team members** can push to `main`
3. **GitHub Actions** uses the shared secrets
4. **Deployment** happens automatically

**For manual deployments:**

Each team member needs:
1. Cloudflare account access
2. Added to your Cloudflare account as a member:
   - Go to https://dash.cloudflare.com/
   - **Manage Account** → **Members**
   - Click **"Invite Member"**
   - Grant "Workers Scripts Edit" permission

## Monitoring Deployments

### Check Deployment Status

1. Go to **Actions** tab: https://github.com/haresh-seenivasagan/twin/actions
2. See all deployment runs
3. Click any run to see logs

### Check Live Site

After deployment succeeds:
```bash
curl https://twin.erniesg.workers.dev/api/debug/env
```

### View Logs

```bash
wrangler tail twin --format pretty
```

## Troubleshooting

### "Error: Missing CLOUDFLARE_API_TOKEN"
- Go to Settings → Secrets → Check secret is added
- Make sure name is exactly `CLOUDFLARE_API_TOKEN`

### "Error: Unauthorized"
- API token might have expired
- Go to Cloudflare → Regenerate token
- Update GitHub secret with new token

### "Error: Account not found"
- Check `CLOUDFLARE_ACCOUNT_ID` secret
- Run `wrangler whoami` to verify Account ID

### Deployment fails but local works
- Check GitHub Actions logs for specific error
- Make sure all environment variables are in `wrangler.toml` (not `.env.local`)
- Secrets (like GOOGLE_CLIENT_SECRET) must be added via `wrangler secret put`

## Benefits of GitHub Actions

- ✅ **Automatic deployments** on every push to main
- ✅ **No local wrangler setup** required for basic deployments
- ✅ **Consistent builds** - same environment every time
- ✅ **Audit trail** - see who deployed what and when
- ✅ **Easy rollbacks** - redeploy any previous commit
- ✅ **Team collaboration** - everyone can deploy by pushing code

## Current Manual Deployment

If you prefer manual control, keep using:
```bash
npx @opennextjs/cloudflare build && npx @opennextjs/cloudflare deploy
```

Both methods work! Choose what's best for your workflow.

---

**Questions?** Check the GitHub Actions logs or ping the team.
