# 🛠️ SETUP GUIDE - PorVerse V2

Complete step-by-step setup instructions for developers.

---

## Prerequisites

### Required Software

1. **Node.js** (v18.17.0 or higher)
   ```bash
   node --version  # Should be >= 18.17.0
   ```
   Download: https://nodejs.org/

2. **npm** (v9.6.0 or higher)
   ```bash
   npm --version  # Should be >= 9.6.0
   ```

3. **Git**
   ```bash
   git --version
   ```

### Required Accounts

Create accounts at:
1. https://supabase.com (Database & Auth)
2. https://platform.openai.com (AI)
3. https://console.upstash.com (Redis)
4. https://resend.com (Email)

### Optional Accounts

5. https://sentry.io (Error Tracking - Recommended)
6. https://console.anthropic.com (Alternative AI)

---

## Installation Steps

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/porverse-v2.git
cd porverse-v2
```

### Step 2: Install Dependencies

```bash
npm install
```

**Expected Output:**
- Installing ~100 packages
- No errors
- Time: 2-5 minutes

**If errors occur:**
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Step 3: Environment Variables

```bash
cp .env.example .env.local
```

Now edit `.env.local` with your actual values.

---

## Environment Configuration

### Supabase Setup

1. Go to https://app.supabase.com
2. Create new project
3. Wait for database provisioning (~2 minutes)
4. Navigate to: Settings → API
5. Copy values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Verify:**
```bash
curl https://xxxxx.supabase.co/rest/v1/
# Should return: {"message":"Welcome to PostgREST"}
```

### OpenAI Setup

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name it: "PorVerse Production"
4. Copy value:

```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

**Verify:**
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
# Should return list of models
```

### Upstash Redis Setup

1. Go to https://console.upstash.com/redis
2. Click "Create Database"
3. Choose region (closest to your users)
4. Click "REST API" tab
5. Copy values:

```bash
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AYxxxxxxxxxxxxxxxxxxxx
```

**Verify:**
```bash
curl https://xxxxx.upstash.io/ping \
  -H "Authorization: Bearer AYxxxxxxxxxxxxxxxxxxxx"
# Should return: "PONG"
```

### Resend Setup

1. Go to https://resend.com/api-keys
2. Click "Create API Key"
3. Name it: "PorVerse Production"
4. Copy value:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

### Generate Encryption Keys

**Encryption Master Key:**
```bash
openssl rand -base64 32
# Copy output to ENCRYPTION_MASTER_KEY
```

**Session Secret:**
```bash
openssl rand -base64 32
# Copy output to SESSION_SECRET
```

---

## Database Setup

### Option 1: Supabase Dashboard

1. Go to your Supabase project
2. Click "SQL Editor"
3. Create a new query
4. Paste schema from `database/schema.sql`
5. Run query

### Option 2: CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref xxxxx

# Run migrations
supabase db push
```

### Verify Database

```bash
npm run db:generate
```

Should create `types/database.types.ts` with no errors.

---

## Verification

### 1. Type Check

```bash
npm run type-check
```

**Expected:** `Found 0 errors`

### 2. Lint Check

```bash
npm run lint
```

**Expected:** No errors

### 3. Test Run

```bash
npm run test
```

**Expected:** All tests pass

### 4. Build Check

```bash
npm run build
```

**Expected:** Build completes successfully

### 5. Start Dev Server

```bash
npm run dev
```

**Expected:**
```
  ▲ Next.js 15.0.3
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Ready in 2.5s
```

Open http://localhost:3000

---

## Common Setup Issues

### Issue: `Module not found`

**Solution:**
```bash
rm -rf node_modules .next
npm install
```

### Issue: `Environment validation failed`

**Solution:**
1. Check `.env.local` exists
2. Verify all required variables are set
3. Ensure no placeholder values (`your_*_here`)
4. Check for typos in variable names

### Issue: `Supabase connection failed`

**Solution:**
1. Verify URL is correct
2. Check anon key is correct
3. Ensure database is provisioned
4. Try pinging: `curl https://xxxxx.supabase.co/rest/v1/`

### Issue: `OpenAI API key invalid`

**Solution:**
1. Verify key starts with `sk-proj-`
2. Check key hasn't expired
3. Ensure you have credit balance
4. Regenerate key if needed

### Issue: `Redis connection timeout`

**Solution:**
1. Check Upstash dashboard shows database as active
2. Verify REST URL and token
3. Test connection: `curl https://xxxxx.upstash.io/ping -H "Authorization: Bearer TOKEN"`

---

## Next Steps

After successful setup:

1. ✅ Read [README.md](./README.md) for overview
2. ✅ Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
3. ✅ Review code in `/lib` directory
4. ✅ Check out example components in `/components`
5. ✅ Run tests: `npm run test`
6. ✅ Start developing!

---

## Development Workflow

### Daily Development

```bash
# 1. Pull latest changes
git pull origin develop

# 2. Install any new dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Make changes

# 5. Run tests
npm run test

# 6. Check types
npm run type-check

# 7. Commit
git add .
git commit -m "feat: description"
git push
```

### Before Pull Request

```bash
# 1. Format code
npm run format

# 2. Lint
npm run lint:fix

# 3. Type check
npm run type-check

# 4. Run all tests
npm run test:coverage

# 5. Build
npm run build

# All checks pass? Create PR!
```

---

## Support

If you encounter issues not covered here:

1. Check [Troubleshooting](./README.md#troubleshooting)
2. Ask team in Slack
3. Create GitHub issue
4. Email: dev@porverse.com

---

**Last Updated:** December 14, 2025