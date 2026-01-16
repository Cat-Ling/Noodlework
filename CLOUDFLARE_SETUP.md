# Cloudflare Workers Deployment Guide

This guide will help you deploy the proxy functionality to Cloudflare Workers to offload bandwidth costs from your main server.

## Why Cloudflare Workers?

- **Free Tier**: 100,000 requests/day free
- **Bandwidth**: Cloudflare handles all proxy bandwidth (saves $$$ on video streaming)
- **Global Edge**: Fast response times worldwide
- **Auto-scaling**: Handles traffic spikes automatically

## Prerequisites

1. A Cloudflare account (free tier works)
2. A GitHub account
3. Your project pushed to a GitHub repository

## Option 1: Deploy via Cloudflare Dashboard (Easiest)

### Step 1: Push to GitHub

```bash
cd /mnt/external_hdd/datanodes/noodle-privacy
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/noodle-privacy.git
git push -u origin main
```

### Step 2: Connect to Cloudflare Workers

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **Workers & Pages** in the sidebar
3. Click **Create Application**
4. Select **Pages** tab
5. Click **Connect to Git**
6. Authorize GitHub and select your `noodle-privacy` repository
7. Configure build settings:
   - **Framework preset**: None
   - **Build command**: (leave empty)
   - **Build output directory**: `/workers`
8. Click **Save and Deploy**

### Step 3: Get Your Worker URL

After deployment, you'll get a URL like:
```
https://noodle-privacy-proxy.pages.dev
```

### Step 4: Update Your Next.js App

Create `.env.local` in your project root:

```bash
NEXT_PUBLIC_WORKER_URL=https://noodle-privacy-proxy.pages.dev
```

Then update your API calls to use the worker URL instead of local routes.

## Option 2: Deploy via Wrangler CLI

### Step 1: Install Wrangler

```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare

```bash
wrangler login
```

### Step 3: Deploy

```bash
cd /mnt/external_hdd/datanodes/noodle-privacy
wrangler deploy
```

### Step 4: Get Your Worker URL

Wrangler will output your worker URL:
```
https://noodle-privacy-proxy.YOUR_SUBDOMAIN.workers.dev
```

## Updating Your Next.js App to Use Workers

You have two options:

### Option A: Environment Variable (Recommended)

1. Create `.env.local`:
   ```
   NEXT_PUBLIC_WORKER_URL=https://your-worker-url.workers.dev
   ```

2. Update your API calls in the frontend to use the worker URL when available:

```javascript
// In your components
const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;
const apiBase = workerUrl || '';

// Use it like this:
const response = await fetch(`${apiBase}/api/proxy?url=${encodeURIComponent(videoUrl)}`);
```

### Option B: Create a Helper Function

Create `lib/api.ts`:

```typescript
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL;

export function getApiUrl(path: string) {
  if (WORKER_URL) {
    return `${WORKER_URL}${path}`;
  }
  return path; // Use local Next.js API routes
}

// Usage:
// const response = await fetch(getApiUrl('/api/proxy?url=...'));
```

## Testing Your Worker

1. Get your worker URL from Cloudflare dashboard
2. Test the proxy endpoint:
   ```bash
   curl "https://your-worker.workers.dev/api/proxy?url=https://mat6tube.com/some-image.jpg"
   ```

3. Test the video endpoint:
   ```bash
   curl "https://your-worker.workers.dev/api/video?id=VIDEO_ID"
   ```

## Monitoring & Limits

### Free Tier Limits
- **100,000 requests/day**
- **10ms CPU time per request**
- Unlimited bandwidth (Cloudflare handles it)

### Check Usage
1. Go to Cloudflare Dashboard
2. Click **Workers & Pages**
3. Select your worker
4. View **Metrics** tab

### If You Exceed Free Tier
- Upgrade to **Workers Paid** ($5/month)
- Gets you 10 million requests/month
- Still unlimited bandwidth

## Troubleshooting

### Worker not found
- Make sure you deployed successfully
- Check the worker name in `wrangler.toml` matches your deployment

### CORS errors
- The worker includes CORS headers automatically
- If you still see errors, check browser console for details

### Video not playing
- Check that cookies are being passed correctly
- Verify the proxy URL is correct in your `.env.local`

### Slow performance
- Workers run on Cloudflare's edge, should be fast
- Check Cloudflare dashboard for any rate limiting

## Cost Comparison

### Without Cloudflare Workers
- Your server pays for ALL video bandwidth
- Example: 100GB video streaming = $10-20/month on most VPS

### With Cloudflare Workers
- Cloudflare handles ALL video bandwidth (FREE)
- You only pay for the Next.js app hosting
- Example: Same 100GB = $0 bandwidth cost

## Next Steps

1. Deploy your worker
2. Update `.env.local` with worker URL
3. Test video playback
4. Monitor usage in Cloudflare dashboard
5. Enjoy free bandwidth! 🎉

## Support

If you run into issues:
- Check [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- Review worker logs in Cloudflare dashboard
- Test endpoints with `curl` to isolate issues
