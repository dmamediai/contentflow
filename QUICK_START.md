# ContentFlow Quick Start Guide

Get ContentFlow running in 5 minutes!

## 1. Prerequisites Check ✅

```bash
# Verify you have required tools
node --version          # >= 18.17.0
pnpm --version         # >= 8.15.4
psql --version         # >= 14
```

## 2. Clone & Install

```bash
# Clone this repository
git clone <repo-url>
cd social-media-saas

# Install all dependencies
pnpm install
```

## 3. Setup Database

```bash
# Create database
createdb social_media_saas

# Copy and update environment
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL

# Run migrations
pnpm db:migrate
```

**Database URL format:**
```
postgresql://username:password@localhost:5432/social_media_saas
```

## 4. Run Development Servers

**In Terminal 1 - Frontend:**
```bash
cd apps/web
pnpm dev
# Opens at http://localhost:3000
```

**In Terminal 2 - Backend:**
```bash
cd apps/api
pnpm dev
# Runs at http://localhost:3001
```

## 5. Verify Setup

- Frontend: http://localhost:3000
- API Health: http://localhost:3001/health
- Database: `psql social_media_saas`

## Command Reference

```bash
# Type checking
pnpm type-check

# Code formatting
pnpm format

# Linting
pnpm lint

# Build everything
pnpm build

# Database migrations
pnpm db:migrate

# Generate Prisma client
pnpm db:generate
```

## Project Structure

```
├── apps/
│   ├── web/          # Next.js frontend (port 3000)
│   └── api/          # Express backend (port 3001)
├── packages/
│   ├── db/           # Prisma schema & migrations
│   ├── types/        # Shared TypeScript types
│   ├── ui/           # Shared UI components
│   └── utils/        # Shared utilities
├── docs/             # Documentation
└── README.md         # Full documentation
```

## Environment Variables

### Minimum Required

```env
# Database
DATABASE_URL=postgresql://...

# Authentication
NEXTAUTH_SECRET=any-random-secret
NEXTAUTH_URL=http://localhost:3000

# Supabase (can be empty for testing)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Optional (for full features)

- Google OAuth credentials
- Stripe test keys
- OpenAI API key
- Social media API keys

## First Steps

1. ✅ Complete steps 1-5 above
2. 📖 Read [`docs/SETUP.md`](docs/SETUP.md) for detailed setup
3. 🏗️ Review [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
4. 🔌 Check [`docs/API.md`](docs/API.md) for API endpoints
5. 🚀 Start implementing Phase 2 features

## Troubleshooting

### Port 3000 Already in Use
```bash
# Kill the process
lsof -i :3000
kill -9 <PID>
```

### Database Connection Error
```bash
# Check PostgreSQL is running
psql -U postgres

# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Prisma Issues
```bash
# Regenerate Prisma client
pnpm db:generate

# Reset database
pnpm prisma migrate reset
```

## Useful Resources

📚 **Documentation:**
- [Full README](README.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Setup Guide](docs/SETUP.md)

🛠️ **Tools:**
- [Prisma Studio](https://www.prisma.io/studio) - Visual DB editor
- [Vercel Analytics](https://vercel.com) - Performance monitoring
- [Stripe Dashboard](https://dashboard.stripe.com) - Payment testing

## Next Steps

1. **Create first feature** - Start with Phase 2 (Team Management)
2. **Write tests** - Add unit tests as you code
3. **Deploy staging** - Push to Vercel/Render
4. **Setup CI/CD** - Add GitHub Actions workflows

## Getting Help

- 📖 Check documentation in `docs/`
- 🐛 Search existing issues
- 💬 Ask in discussions/Discord
- 📧 Email: support@contentflow.app

---

**You're all set!** 🎉 Start building amazing features.
