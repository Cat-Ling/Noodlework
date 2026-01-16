# Noodle Privacy

A privacy-focused video streaming platform built with Next.js and Cloudflare Workers.

## Features

- 🎥 Video streaming with quality selection
- 🔄 Automatic retry logic for reliable playback
- 🌍 Cloudflare Workers for global edge caching
- 📱 Mobile-responsive design
- ⚡ Concurrent connection pooling for extreme performance
- 🎨 Modern UI with Chakra UI

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Deploy to Cloudflare Workers (Recommended)

Offload bandwidth costs by deploying the proxy to Cloudflare Workers:

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/noodle-privacy.git
   git push -u origin main
   ```

2. **Deploy via Cloudflare Dashboard:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Click **Workers & Pages** → **Create Application**
   - Select **Pages** → **Connect to Git**
   - Select your repository
   - Deploy!

3. **Update Environment Variables:**
   ```bash
   cp .env.example .env.local
   # Add your worker URL to .env.local
   ```

See [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) for detailed instructions.

## Tech Stack

- **Frontend:** Next.js 16, React 18, Chakra UI
- **Video Player:** Vidstack
- **Proxy:** Cloudflare Workers (optional) or Next.js API routes
- **Styling:** Emotion, Framer Motion
- **HTTP Client:** Undici (connection pooling)

## Project Structure

```
├── app/
│   ├── api/              # Next.js API routes (fallback)
│   │   ├── proxy/        # Video/image proxy
│   │   ├── video/        # Video metadata
│   │   └── search/       # Search functionality
│   ├── components/       # React components
│   └── watch/            # Video player page
├── workers/
│   └── proxy.js          # Cloudflare Worker script
├── wrangler.toml         # Cloudflare Workers config
└── CLOUDFLARE_SETUP.md   # Deployment guide
```

## Scripts

```bash
npm run dev              # Start Next.js dev server
npm run build            # Build for production
npm run start            # Start production server

npm run worker:dev       # Test Cloudflare Worker locally
npm run worker:deploy    # Deploy to Cloudflare Workers
npm run worker:tail      # View worker logs
```

## Environment Variables

Create `.env.local`:

```env
# Optional: Cloudflare Worker URL (for offloading bandwidth)
NEXT_PUBLIC_WORKER_URL=https://your-worker.workers.dev
```

## Performance

- **Concurrent Connections:** 50+ simultaneous video streams
- **Connection Pooling:** HTTP/2 with pipelining
- **Retry Logic:** Automatic recovery from failures
- **Caching:** 24-hour video cache, 1-hour image cache
- **Bandwidth:** Offloaded to Cloudflare (free tier: 100k requests/day)

## License

MIT

## Contributing

Pull requests welcome! Please read the contribution guidelines first.
