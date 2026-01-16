# One-Click Cloudflare Pages Deployment

Everything (Next.js app + proxy) deploys to Cloudflare Pages with one click!

## Quick Deploy (3 Steps)

### 1. Push to GitHub

```bash
cd /mnt/external_hdd/datanodes/noodle-privacy
git init
git add .
git commit -m "Initial commit - ready for Cloudflare Pages"
git remote add origin https://github.com/YOUR_USERNAME/noodle-privacy.git
git push -u origin main
```

### 2. Deploy to Vercel (Recommended for Next.js 16)

1. Go to [Vercel](https://vercel.com/)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Click **Deploy** (Vercel auto-detects everything!)

**Your site will be live at:** `https://your-project.vercel.app`

### Alternative: Deploy to Cloudflare Pages

> **Note:** Cloudflare Pages doesn't fully support Next.js 16 yet. Use Vercel for best compatibility.

If you still want to use Cloudflare Pages:
1. The `functions/` directory contains Cloudflare Functions for the proxy
2. These will work independently of the Next.js app
3. You can deploy just the functions to Cloudflare Workers

### 3. Done! 🎉

Your entire app is now live on Cloudflare Pages:
```
https://noodle-privacy.pages.dev
```

## What Gets Deployed

✅ **Next.js App** - All pages, components, UI  
✅ **Proxy Functions** - `/api/proxy` and `/api/video` as Cloudflare Functions  
✅ **Free Bandwidth** - Cloudflare handles ALL video streaming  
✅ **Global CDN** - Fast worldwide  
✅ **Auto HTTPS** - Free SSL certificate  

## How It Works

- **Next.js pages** → Cloudflare Pages (static + SSR)
- **API routes** → Cloudflare Functions (serverless)
- **Video proxy** → Cloudflare bandwidth (FREE!)

## Build Configuration

The project includes:
- `functions/api/proxy.js` - Proxy function
- `functions/api/video.js` - Video metadata function
- `wrangler.toml` - Cloudflare configuration
- `package.json` - Build scripts

Cloudflare Pages automatically:
- Detects Next.js
- Builds with `@cloudflare/next-on-pages`
- Deploys functions from `functions/` directory
- Sets up routing

## Free Tier Limits

- **100,000 requests/day**
- **Unlimited bandwidth** (Cloudflare handles it!)
- **500 builds/month**
- **Unlimited sites**

## Custom Domain (Optional)

1. Go to your Pages project → **Custom domains**
2. Add your domain (e.g., `noodle.yourdomain.com`)
3. Update DNS records as instructed
4. Done! Auto HTTPS included

## Troubleshooting

### Build fails
- Select **Next.js (Static HTML Export)** as framework preset
- Build command: `npm run build` (default)
- Build output: `out` (Cloudflare auto-detects this)
- Root directory: (leave empty)

### API routes not working
- Check that `functions/` directory exists
- Verify `functions/api/proxy.js` and `functions/api/video.js` are present
- Check Functions logs in Cloudflare dashboard

### Videos not playing
- Check browser console for errors
- Verify proxy function is deployed (check Functions tab)
- Test proxy endpoint directly: `https://your-site.pages.dev/api/proxy?url=...`

## Monitoring

View analytics in Cloudflare Dashboard:
- **Pages** → Your project → **Analytics**
- **Functions** → View function invocations and errors
- **Logs** → Real-time function logs

## Cost Estimate

**Typical usage (1000 daily users):**
- Pages requests: ~50,000/day ✅ FREE
- Functions: ~30,000/day ✅ FREE
- Bandwidth: ~500GB/month ✅ FREE (Cloudflare handles it!)

**Total cost: $0/month** 🎉

## Next Steps

1. Push to GitHub
2. Connect to Cloudflare Pages
3. Deploy
4. Share your site!

That's it! No environment variables, no complex setup, just push and deploy.
