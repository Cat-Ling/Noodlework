# Noodle Privacy

A privacy-focused video streaming platform. Deploy to Cloudflare Pages with one click!

## 🚀 Quick Deploy

1. **Push to GitHub**
2. **Connect to Cloudflare Pages**
3. **Use default settings** (don't change anything!)
4. **Deploy!**

That's it! See [DEPLOY.md](./DEPLOY.md) for details.

## ✨ Features

- 🎥 Video streaming with quality selection
- 🔄 Automatic retry logic for reliable playback
- 🌍 Cloudflare edge caching (free bandwidth!)
- 📱 Mobile-responsive design
- ⚡ Concurrent connection pooling
- 🎨 Modern UI with Chakra UI

## 🛠️ Tech Stack

- **Frontend:** Next.js 16, React 18, Chakra UI
- **Video Player:** Vidstack
- **Deployment:** Cloudflare Pages + Functions
- **Styling:** Emotion, Framer Motion

## 📁 Project Structure

```
├── app/                  # Next.js app directory
│   ├── api/             # API routes (fallback)
│   ├── components/      # React components
│   └── watch/           # Video player page
├── functions/           # Cloudflare Functions
│   └── api/
│       ├── proxy.js     # Video/image proxy
│       └── video.js     # Video metadata
└── wrangler.toml        # Cloudflare config
```

## 💰 Cost

**$0/month** - Everything runs on Cloudflare's free tier:
- 100,000 requests/day
- Unlimited bandwidth
- Global CDN

## 📝 License

MIT

## 🤝 Contributing

Pull requests welcome!
