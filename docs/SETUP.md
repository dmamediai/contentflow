# ContentFlow Development Setup Guide

Complete step-by-step guide to set up ContentFlow for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.17.0 ([Download](https://nodejs.org))
- **pnpm** >= 8.15.4 (`npm install -g pnpm@8.15.4`)
- **PostgreSQL** >= 14 ([Download](https://www.postgresql.org))
- **Git** ([Download](https://git-scm.com))
- A code editor (VS Code recommended)

### Verify Installation

```bash
node --version        # Should be v18.17.0 or higher
pnpm --version        # Should be 8.15.4 or higher
psql --version        # Should be 14 or higher
git --version         # Should be 2.x or higher
```

## Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/contentflow.git
cd contentflow

# Optional: switch to development branch
git checkout develop
```

## Step 2: Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# Verify installation
pnpm list --depth=0
```

## Step 3: Setup Database

### Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE social_media_saas;
CREATE USER contentflow WITH PASSWORD 'your-secure-password';
ALTER ROLE contentflow WITH CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE social_media_saas TO contentflow;

# Exit psql
\q
```

### Setup Environment Variables

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your values
nano .env.local
```

**Required variables:**
```env
# Database
DATABASE_URL="postgresql://contentflow:your-secure-password@localhost:5432/social_media_saas"

# Supabase (use local development keys for now)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Authentication
NEXTAUTH_SECRET="your-random-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Node environment
NODE_ENV="development"
```

### Initialize Database Schema

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Optional: Seed test data
# pnpm db:seed
```

**Verify schema:**
```bash
psql social_media_saas -c "\dt"  # List tables
```

## Step 4: Setup Supabase (Local Development)

For local development, you can use Supabase locally or create a free Supabase account.

### Option A: Supabase Cloud (Easiest)

1. Go to [supabase.com](https://supabase.com)
2. Create free account
3. Create new project
4. Get your credentials from Project Settings:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`
5. Update `.env.local`

### Option B: Supabase Local (Docker)

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase
supabase init

# Start local Supabase (requires Docker)
supabase start

# Get connection details
supabase status
```

## Step 5: Configure Third-party Services

### Google OAuth (For Authentication)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable Google+ API
4. Go to Credentials → Create OAuth 2.0 Client ID (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://localhost:3001/api/auth/callback/google`
6. Add credentials to `.env.local`:
   ```env
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

### Stripe (Payment Testing)

1. Create [Stripe account](https://stripe.com)
2. Go to Developers → API Keys
3. Copy test keys:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_SECRET_KEY="sk_test_..."
   ```

### OpenAI API

1. Create [OpenAI account](https://openai.com)
2. Go to API Keys → Create new secret key
3. Add to `.env.local`:
   ```env
   OPENAI_API_KEY="sk-..."
   ```

### Anthropic Claude

1. Create [Anthropic account](https://console.anthropic.com)
2. Get API key from console
3. Add to `.env.local`:
   ```env
   ANTHROPIC_API_KEY="sk-ant-..."
   ```

## Step 6: Run Development Servers

Open three terminal windows:

### Terminal 1: Frontend

```bash
cd apps/web
pnpm dev
```

Accessible at: http://localhost:3000

### Terminal 2: Backend API

```bash
cd apps/api
pnpm dev
```

Accessible at: http://localhost:3001

### Terminal 3: Database Monitor (Optional)

```bash
# Monitor PostgreSQL
psql social_media_saas

# View tables
\dt

# View specific table
SELECT * FROM users;

# Exit
\q
```

## Step 7: Create Test Account

1. Open http://localhost:3000
2. Click "Get Started"
3. Register with email and password
4. Fill in team details
5. You should be redirected to dashboard

## Step 8: Verify Setup

### Frontend Check

```bash
cd apps/web

# Type check
pnpm type-check

# Lint
pnpm lint

# Test (if configured)
pnpm test
```

### Backend Check

```bash
cd apps/api

# Type check
pnpm type-check

# Lint
pnpm lint

# Test API endpoint
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Database Check

```bash
# Connect to database
psql social_media_saas

# Check tables
\dt

# Count records
SELECT COUNT(*) FROM users;

# Exit
\q
```

## Development Workflow

### Creating a New Feature

1. Create feature branch
   ```bash
   git checkout -b feature/feature-name
   ```

2. Make changes in appropriate package:
   - Database schema: `packages/db/prisma/schema.prisma`
   - API routes: `apps/api/src/routes/`
   - React components: `apps/web/src/components/`
   - Types: `packages/types/src/`

3. Run migrations (if schema changed)
   ```bash
   pnpm db:migrate
   ```

4. Format code
   ```bash
   pnpm format
   ```

5. Type check
   ```bash
   pnpm type-check
   ```

6. Lint
   ```bash
   pnpm lint
   ```

7. Test locally
8. Commit changes
   ```bash
   git add .
   git commit -m "feat: add feature description"
   ```

9. Push and create pull request
   ```bash
   git push origin feature/feature-name
   ```

### Database Migrations

```bash
# After modifying schema.prisma
cd packages/db

# Create migration
pnpm prisma migrate dev --name add_new_field

# Apply migration
pnpm prisma db push

# Seed database (if seed script exists)
pnpm db:seed
```

### Running Tests

```bash
# Frontend tests (if configured)
cd apps/web
pnpm test

# Backend tests (if configured)
cd apps/api
pnpm test

# All tests
pnpm test
```

## Debugging

### VS Code Debugging Setup

1. Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Node Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/api/dist/index.js",
      "outFiles": ["${workspaceFolder}/apps/api/dist/**/*.js"],
      "cwd": "${workspaceFolder}/apps/api"
    },
    {
      "name": "Next.js Frontend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/web/node_modules/.bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}/apps/web"
    }
  ]
}
```

2. Press F5 to start debugging

### Browser DevTools

```typescript
// Frontend debugging
// Press Ctrl+Shift+J (or Cmd+Option+J on Mac) to open console
// In Network tab, check API calls
// In Application tab, inspect cookies/session
```

### Database Debugging

```bash
# View slow queries
psql social_media_saas

# Enable query timing
\timing

# Run query
SELECT * FROM posts WHERE team_id = 'team_123';

# View execution plan
EXPLAIN SELECT * FROM posts WHERE team_id = 'team_123';
EXPLAIN ANALYZE SELECT * FROM posts WHERE team_id = 'team_123';
```

## Troubleshooting

### Database Connection Error

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS
services.msc  # Windows

# Test connection
psql -U contentflow -d social_media_saas -h localhost

# Check connection string
echo $DATABASE_URL
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000  # Linux/macOS
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # Linux/macOS
taskkill /PID <PID> /F  # Windows
```

### Prisma Issues

```bash
# Reset Prisma client
cd packages/db
pnpm prisma generate

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset

# Verify schema
pnpm prisma studio  # Opens visual editor
```

### Next.js Build Issues

```bash
# Clear Next.js cache
rm -rf apps/web/.next
pnpm install
pnpm build

# Run with debug output
DEBUG=* pnpm dev
```

### Module Not Found Errors

```bash
# Clear all node_modules
rm -rf node_modules
pnpm install --force

# Clear pnpm cache
pnpm store prune
```

## IDE Extensions

### Recommended VS Code Extensions

- **Prisma** - Prisma ORM support
- **PostgreSQL** - PostgreSQL database tools
- **Thunder Client** - REST API testing
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **GitLens** - Git integration
- **Thunder Client** - API testing
- **Tailwind CSS IntelliSense** - Tailwind support

Install all:
```json
// In .vscode/extensions.json
{
  "recommendations": [
    "prisma.prisma",
    "ckolkman.vscode-postgres",
    "rangav.vscode-thunder-client",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "eamodio.gitlens",
    "bradlc.vscode-tailwindcss"
  ]
}
```

## Performance Tips

1. **Use React DevTools Profiler** - Identify slow components
2. **Database Indexes** - Add indexes to frequently queried columns
3. **API Caching** - Use SWR for client-side caching
4. **Lazy Loading** - Use React.lazy for code splitting
5. **Image Optimization** - Use Next.js Image component

## Next Steps

1. ✅ Setup complete
2. Read [Architecture](./ARCHITECTURE.md) documentation
3. Explore [API docs](./API.md)
4. Create first feature
5. Setup CI/CD in GitHub Actions
6. Deploy to staging

## Getting Help

- 📚 [Documentation](https://docs.contentflow.app)
- 🐛 [Issue Tracker](https://github.com/your-org/contentflow/issues)
- 💬 [Discord Community](https://discord.gg/contentflow)
- 📧 [Email Support](mailto:support@contentflow.app)

---

Happy coding! 🚀
