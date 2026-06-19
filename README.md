# ContentFlow - AI-Powered Social Media Management Platform

A complete SaaS platform for creating, repurposing, scheduling, and publishing content across multiple social media platforms using AI.

## Features

### 🎯 Core Modules

1. **Authentication** - Email/password, Google OAuth, team management, role-based permissions
2. **Dashboard** - Metrics, scheduled posts, drafts, connected accounts
3. **AI Content Studio** - Generate, rewrite, expand, summarize, translate, hooks, CTAs, hashtags
4. **Content Repurposing** - Blog→LinkedIn, Blog→Twitter, YouTube→Posts, Podcasts→Posts, Carousels
5. **Carousel Creator** - Visual slide editor, AI-generated slides, PNG/PDF export
6. **Social Media Scheduler** - Calendar view, queue management, recurring posts
7. **Social Publishing** - Facebook, Instagram, LinkedIn, X, Threads
8. **Media Library** - Images, videos, AI-generated assets
9. **Analytics** - Engagement, reach, clicks, growth tracking
10. **Subscription System** - Free, Pro, Agency plans with Stripe integration
11. **Admin Panel** - User/subscription management, analytics, feature flags

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL, Prisma ORM
- **Cloud**: Supabase (Auth, Storage, Database)
- **AI Models**: OpenAI, Anthropic Claude, Google Gemini
- **Payments**: Stripe
- **Styling**: TailwindCSS, Shadcn UI
- **Automation**: n8n
- **Authentication**: NextAuth.js
- **Monorepo**: Turbo, pnpm workspaces

## Project Structure

```
.
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # Express.js backend
├── packages/
│   ├── db/               # Prisma schema & migrations
│   ├── types/            # Shared TypeScript types
│   ├── ui/               # Shared React components
│   └── utils/            # Shared utilities
├── .github/
│   └── workflows/        # CI/CD pipelines
└── docs/                 # Documentation
```

## Prerequisites

- Node.js >= 18.17.0
- pnpm >= 8.15.4
- PostgreSQL >= 14
- Supabase account
- Stripe account (for payments)
- AI API keys (OpenAI, Anthropic, Google)
- Social media API credentials

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd social-media-saas
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Configure the following:

#### Database
```
DATABASE_URL=postgresql://user:password@localhost:5432/social_media_saas
```

#### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Authentication
```
NEXTAUTH_SECRET=generate-a-random-secret
NEXTAUTH_URL=http://localhost:3000
```

#### OAuth Providers
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### Payment & AI APIs
```
STRIPE_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GEMINI_API_KEY=AIzaSy...
```

#### Social Media APIs
```
TWITTER_API_KEY=...
LINKEDIN_CLIENT_ID=...
FACEBOOK_APP_ID=...
INSTAGRAM_APP_ID=...
```

### 4. Setup Database

Create PostgreSQL database:

```bash
createdb social_media_saas
```

Run Prisma migrations:

```bash
pnpm db:migrate
```

Generate Prisma client:

```bash
pnpm db:generate
```

### 5. Setup Supabase

1. Create a Supabase project
2. Create storage buckets: `media`, `uploads`, `avatars`
3. Enable Row Level Security (RLS) on storage buckets
4. Set up auth providers (Google, etc.)

### 6. Run Development Servers

Terminal 1 - Frontend:
```bash
cd apps/web
pnpm dev
```

Terminal 2 - Backend:
```bash
cd apps/api
pnpm dev
```

The app will be available at:
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Docs: http://localhost:3000/docs

## Development

### Create New Features

1. Create database schema in `packages/db/prisma/schema.prisma`
2. Run migrations: `pnpm db:migrate`
3. Create API routes in `apps/api/src/routes/`
4. Create React components in `apps/web/src/components/`
5. Write tests and create type definitions

### Code Style

```bash
# Format code
pnpm format

# Lint
pnpm lint

# Type check
pnpm type-check
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/session` - Get current session
- `POST /api/auth/refresh` - Refresh JWT token

### Team Management

- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team details
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `GET /api/teams/:id/members` - List team members
- `POST /api/teams/:id/members` - Add team member
- `DELETE /api/teams/:id/members/:userId` - Remove team member

### Content Management

- `GET /api/posts` - List posts
- `POST /api/posts` - Create post
- `GET /api/posts/:id` - Get post details
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/publish` - Publish post
- `POST /api/posts/:id/schedule` - Schedule post

### AI Operations

- `POST /api/ai/generate` - Generate content
- `POST /api/ai/rewrite` - Rewrite content
- `POST /api/ai/expand` - Expand content
- `POST /api/ai/summarize` - Summarize content
- `POST /api/ai/translate` - Translate content
- `POST /api/ai/hashtags` - Generate hashtags

### Social Accounts

- `GET /api/social-accounts` - List connected accounts
- `POST /api/social-accounts/connect` - Connect account
- `DELETE /api/social-accounts/:id` - Disconnect account
- `GET /api/social-accounts/:id/stats` - Get account stats

### Analytics

- `GET /api/analytics/overview` - Get analytics overview
- `GET /api/analytics/posts` - Get post analytics
- `GET /api/analytics/engagement` - Get engagement metrics
- `GET /api/analytics/growth` - Get growth tracking

### Subscriptions

- `GET /api/subscriptions` - Get current subscription
- `POST /api/subscriptions/upgrade` - Upgrade plan
- `POST /api/subscriptions/cancel` - Cancel subscription
- `GET /api/subscriptions/usage` - Get usage stats

### Admin

- `GET /api/admin/users` - List all users
- `GET /api/admin/subscriptions` - List subscriptions
- `GET /api/admin/analytics` - Admin analytics
- `POST /api/admin/features` - Manage feature flags

## Deployment

### Frontend Deployment (Vercel)

```bash
# Push to Git
git push

# Vercel will auto-deploy from main branch
```

**Environment variables needed on Vercel:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL` (your production domain)

### Backend Deployment

#### Option 1: Render.com

1. Create new Web Service
2. Connect GitHub repository
3. Set environment variables
4. Deploy

#### Option 2: DigitalOcean App Platform

1. Create new app
2. Connect GitHub
3. Configure services (web, api)
4. Deploy

#### Option 3: Self-hosted (VPS)

```bash
# On VPS
git clone <repo>
cd social-media-saas
pnpm install
pnpm build

# Use PM2 for process management
npm install -g pm2
pm2 start "pnpm start" --name "contentflow-api"
pm2 save
pm2 startup

# Setup Nginx reverse proxy
# Setup SSL with Let's Encrypt
# Setup PostgreSQL backup strategy
```

## Database Backups

### Automated Backups (Supabase)
Supabase handles automated daily backups.

### Manual Backups
```bash
# Backup
pg_dump social_media_saas > backup.sql

# Restore
psql social_media_saas < backup.sql
```

## Performance Optimization

1. **Database**: Add indexes for frequently queried columns
2. **Caching**: Implement Redis caching for user sessions and analytics
3. **CDN**: Use Supabase Storage with CloudFront CDN
4. **Image Optimization**: Use Next.js Image component
5. **Code Splitting**: Implement React.lazy() for route-based splitting

## Security Checklist

- [ ] Enable HTTPS everywhere
- [ ] Set up CORS properly
- [ ] Implement rate limiting
- [ ] Use environment variables for secrets
- [ ] Enable database encryption
- [ ] Set up Web Application Firewall (WAF)
- [ ] Enable audit logging
- [ ] Implement RBAC properly
- [ ] Regular security audits
- [ ] Keep dependencies updated

## Monitoring & Logging

### Error Tracking
- Set up Sentry for error monitoring
- Configure alerts for critical errors

### Performance Monitoring
- Use Vercel Analytics for frontend
- Implement APM for backend (New Relic, DataDog)

### Logging
- Check `logs/combined.log` for all logs
- Check `logs/error.log` for errors only

## Troubleshooting

### Database Connection Issues
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

### Prisma Issues
```bash
# Regenerate client
pnpm db:generate

# Push schema
pnpm db:push
```

### Supabase Auth Issues
- Check Supabase dashboard for blocked IPs
- Verify OAuth redirect URLs match
- Check JWT secret is set correctly

### Payment Processing Issues
- Verify Stripe keys are correct
- Check webhook endpoints are configured
- Review Stripe dashboard for errors

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

- Documentation: https://docs.contentflow.app
- Email: support@contentflow.app
- Discord: https://discord.gg/contentflow
- Twitter: @contentflowai

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Browser extensions
- [ ] AI-powered hashtag research
- [ ] Competitor analysis
- [ ] Content calendar templates
- [ ] Team collaboration features
- [ ] Custom integrations API
- [ ] Advanced analytics & reports
- [ ] White-label solution
- [ ] Enterprise features

---

Built with ❤️ for content creators and agencies.
