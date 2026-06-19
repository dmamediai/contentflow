# ContentFlow Deployment Guide

Complete guide for deploying ContentFlow to production.

## Table of Contents

1. [Infrastructure Setup](#infrastructure-setup)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Frontend Deployment](#frontend-deployment)
5. [Backend Deployment](#backend-deployment)
6. [Monitoring & Observability](#monitoring--observability)
7. [Scaling](#scaling)
8. [Disaster Recovery](#disaster-recovery)

## Infrastructure Setup

### Option 1: Vercel + Render (Recommended for Startups)

This is the easiest and most cost-effective setup for small to medium projects.

**Frontend:** Vercel (Next.js)
**Backend:** Render.com (Express)
**Database:** Supabase (PostgreSQL)
**Storage:** Supabase Storage

### Option 2: AWS (Enterprise)

**Frontend:** CloudFront + S3 + CloudFormation
**Backend:** EC2 or ECS
**Database:** RDS PostgreSQL
**Storage:** S3

### Option 3: Self-Hosted (VPS)

**Frontend:** Nginx
**Backend:** Node.js + PM2
**Database:** PostgreSQL
**Storage:** Local or S3-compatible

## Environment Configuration

### Supabase Setup

1. Create a new Supabase project
2. Note your project URL and API keys
3. Enable Row Level Security:

```sql
-- Enable RLS for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
```

4. Create storage buckets:

```bash
# Using Supabase CLI
supabase storage create media
supabase storage create uploads
supabase storage create avatars
```

5. Set bucket policies:

```sql
-- Allow authenticated users to upload their own media
CREATE POLICY "Users can upload media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Third-party Services

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```
6. Note your Client ID and Client Secret

#### Stripe Setup

1. Create Stripe account
2. Get API keys from Dashboard
3. Create products for each plan:
   - Free Plan (no product needed)
   - Pro Plan ($29/month)
   - Agency Plan ($99/month)
4. Create webhooks:
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

#### OpenAI Setup

1. Create OpenAI account
2. Get API key from [Platform](https://platform.openai.com)
3. Set usage limits in dashboard
4. Test with:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

#### Anthropic Claude

1. Create Anthropic account
2. Get API key from [Console](https://console.anthropic.com)
3. Request higher rate limits if needed

#### Google Gemini

1. Go to [Google AI Studio](https://makersuite.google.com)
2. Create API key
3. Enable in Google Cloud Console

## Database Setup

### Local Development

```bash
# Create database
createdb social_media_saas

# Run migrations
pnpm db:migrate

# Seed data (optional)
pnpm db:seed
```

### Production (Supabase)

```bash
# Set DATABASE_URL to Supabase connection string
export DATABASE_URL="postgresql://user:password@db.supabase.co:5432/postgres"

# Run migrations
pnpm db:push

# Verify schema
psql $DATABASE_URL -c "\dt"
```

### Production (AWS RDS)

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier contentflow-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password [secure-password] \
  --allocated-storage 20 \
  --storage-type gp3

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier contentflow-prod \
  --query 'DBInstances[0].Endpoint'

# Connect and run migrations
psql -h [endpoint]:5432 -U postgres -d postgres < migrations.sql
```

### Backup Strategy

#### Automated Backups (Supabase)

Daily automated backups are included. Access via Supabase Dashboard.

#### Manual Backups

```bash
# Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Compress
gzip backup_*.sql

# Upload to S3
aws s3 cp backup_*.sql.gz s3://your-backup-bucket/

# Restore
psql $DATABASE_URL < backup.sql
```

#### Backup Automation

```bash
# Create backup script
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash
DB_URL=$DATABASE_URL
BACKUP_DIR=/backups
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump $DB_URL | gzip > $BACKUP_DIR/backup_$DATE.sql.gz
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-backup-bucket/

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
EOF

chmod +x /home/ubuntu/backup.sh

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /home/ubuntu/backup.sh" | crontab -
```

## Frontend Deployment

### Deploy to Vercel

```bash
# 1. Create Vercel account and connect GitHub

# 2. Set environment variables
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# 3. Push to GitHub
git push

# 4. Vercel will auto-deploy

# 5. Set custom domain in Vercel dashboard
# Update DNS records
```

### Deploy to AWS S3 + CloudFront

```bash
# Build the app
pnpm build

# Create S3 bucket
aws s3 mb s3://contentflow-frontend

# Upload build files
aws s3 sync apps/web/.next s3://contentflow-frontend --delete

# Create CloudFront distribution
aws cloudfront create-distribution --distribution-config file://distribution-config.json

# Set custom domain via Route 53
```

### Deploy to Netlify

```bash
# 1. Connect GitHub to Netlify

# 2. Configure build settings
Build command: pnpm build
Publish directory: apps/web/.next

# 3. Set environment variables in Netlify dashboard

# 4. Deploy will happen on git push
```

## Backend Deployment

### Deploy to Render.com

1. Create Render account
2. Connect GitHub repository
3. Create new Web Service
4. Configure:
   ```
   Build Command: pnpm install && pnpm build
   Start Command: cd apps/api && pnpm start
   ```
5. Set environment variables:
   ```
   DATABASE_URL
   NEXTAUTH_SECRET
   OPENAI_API_KEY
   STRIPE_SECRET_KEY
   NODE_ENV=production
   ```
6. Set custom domain in dashboard

### Deploy to DigitalOcean App Platform

```bash
# 1. Create app.yaml
name: contentflow-api
services:
  - name: api
    github:
      branch: main
      repo: your-org/contentflow
    build_command: cd apps/api && pnpm install && pnpm build
    run_command: cd apps/api && pnpm start
    envs:
      - key: DATABASE_URL
        value: ${{ components.db.database_url }}
      - key: NODE_ENV
        value: production

databases:
  - name: db
    engine: PG
    version: "14"
    production: true

# 2. Deploy via DigitalOcean CLI
doctl apps create --spec app.yaml
```

### Self-Hosted on VPS (DigitalOcean/Linode)

```bash
# 1. Create Droplet (Ubuntu 22.04, 2GB RAM minimum)

# 2. Initial setup
ssh root@your_server_ip
apt update && apt upgrade -y
apt install -y curl git nodejs npm postgresql nginx certbot python3-certbot-nginx

# 3. Install Node.js and pnpm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g pnpm

# 4. Clone repository
git clone https://github.com/your-org/contentflow /var/www/contentflow
cd /var/www/contentflow

# 5. Setup database
sudo -i -u postgres
createdb social_media_saas
psql social_media_saas < /var/www/contentflow/packages/db/migrations/init.sql
exit

# 6. Install dependencies and build
pnpm install
pnpm build

# 7. Setup environment
cp .env.example .env.local
nano .env.local  # Edit with your secrets

# 8. Setup PM2 for process management
npm install -g pm2
pm2 start "cd /var/www/contentflow/apps/api && pnpm start" --name "contentflow-api"
pm2 start "cd /var/www/contentflow/apps/web && pnpm start" --name "contentflow-web"
pm2 save
pm2 startup

# 9. Setup Nginx reverse proxy
cat > /etc/nginx/sites-available/contentflow << 'EOF'
upstream contentflow_api {
    server localhost:3001;
}

upstream contentflow_web {
    server localhost:3000;
}

server {
    server_name yourdomain.com www.yourdomain.com;
    
    location /api {
        proxy_pass http://contentflow_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location / {
        proxy_pass http://contentflow_web;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/contentflow /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# 10. Setup SSL with Let's Encrypt
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 11. Setup automatic updates
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# 12. Monitor and restart on failure
# Ensure PM2 is configured to restart services
pm2 restart all
pm2 save
```

## Monitoring & Observability

### Error Tracking with Sentry

```typescript
// apps/api/src/index.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### Logging

```bash
# View logs on VPS
pm2 logs

# Using Sentry dashboard
# https://sentry.io/your-org/contentflow
```

### Database Monitoring

```bash
# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()));"

# Monitor queries
psql $DATABASE_URL -c "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

### Performance Monitoring

- Frontend: Vercel Analytics (included)
- Backend: Use DataDog, New Relic, or Prometheus

## Scaling

### Horizontal Scaling

```bash
# Load balance API servers
# Use HAProxy or AWS Application Load Balancer

# Create multiple API instances
pm2 start "pnpm start" -i max --name "api-cluster"
```

### Database Scaling

```bash
# Read replicas
aws rds create-db-instance-read-replica \
  --db-instance-identifier contentflow-replica \
  --source-db-instance-identifier contentflow-prod

# Connection pooling with PgBouncer
apt install -y pgbouncer

# Configure pgbouncer.ini
[databases]
social_media_saas = host=db.example.com port=5432

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

### Caching

```typescript
// Add Redis caching
import redis from 'redis';

const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

// Cache frequent queries
export async function getCachedUser(userId) {
  const cached = await redisClient.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);
  
  const user = await db.user.findUnique({ where: { id: userId } });
  await redisClient.setex(`user:${userId}`, 3600, JSON.stringify(user));
  return user;
}
```

## Disaster Recovery

### Backup & Recovery Plan

1. **Daily Backups:** Automated daily backups to S3
2. **Weekly Full Backups:** Complete database dump + application state
3. **Monthly Test Recovery:** Test restore procedure
4. **RTO:** 4 hours
5. **RPO:** 1 hour

### Recovery Steps

```bash
# 1. Restore database from backup
psql -h new-server -U postgres < backup.sql

# 2. Restore application code
git clone https://github.com/your-org/contentflow /var/www/contentflow
cd /var/www/contentflow
git checkout <commit-hash>

# 3. Rebuild and start services
pnpm install
pnpm build
pm2 restart all

# 4. Verify health
curl https://yourdomain.com/health
```

### DNS Failover

```bash
# Setup secondary domain pointing to backup server
# Update DNS A record if primary fails
# OR use AWS Route 53 health checks for automatic failover
```

---

For more information, see the main [README.md](../README.md).
