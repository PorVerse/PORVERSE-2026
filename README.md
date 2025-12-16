# 🌟 PorVerse V2 - Wellness Transformation Platform

**SUPER ENTERPRISE INTERSTELLAR Level**

A cutting-edge wellness transformation platform that helps millions of people live better through personalized portals, biometric integration, and AI-powered guidance.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red)](./LICENSE)

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Setup](#-environment-setup)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Security](#-security)
- [Performance](#-performance)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## ✨ Features

### 🚪 Portal Management
- **Personalized Transformation Journeys** - Curated paths for mind, body, and spirit
- **Progress Tracking** - Real-time analytics on your growth
- **Unlockable Content** - Gamified experience with XP and rewards
- **6 Categories** - Mindfulness, Physical, Emotional, Social, Spiritual, Intellectual

### 🔬 Biometric Integration
- **Facial Emotion Recognition** - MediaPipe-powered analysis
- **Privacy-First Design** - GDPR compliant, encrypted data
- **Real-time Feedback** - Instant insights on your emotional state
- **Consent Management** - Full user control over data

### 🤖 AI Guidance
- **Dual AI Providers** - OpenAI GPT-4 + Anthropic Claude
- **Biometric-Aware Conversations** - AI adapts to your emotional state
- **Cultural Adaptation** - Personalized for your background
- **Streaming Responses** - Real-time AI interactions
- **Cost Tracking** - Monitor AI API usage

### 🔐 Enterprise Security
- **7-Layer Security Architecture** - Military-grade protection
- **Field-Level Encryption** - AES-256-GCM for sensitive data
- **Rate Limiting** - DDoS protection with Redis
- **Input Validation** - Zod schemas on all endpoints
- **Security Headers** - OWASP best practices

### ⚡ Performance
- **Multi-Tier Caching** - Memory + Redis
- **Code Splitting** - Optimized bundle sizes
- **Image Optimization** - AVIF/WebP with Next.js
- **PWA Support** - Offline functionality
- **Performance Budgets** - Lighthouse > 90

### 📊 Observability
- **Structured Logging** - Pino with log levels
- **Metrics Collection** - StatsD for real-time monitoring
- **Distributed Tracing** - OpenTelemetry integration
- **Error Tracking** - Sentry for production errors

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                               │
│  Next.js 15 + React 19 + TypeScript + Tailwind CSS        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER (Next.js)                      │
│  - Input Validation (Zod)                                   │
│  - Rate Limiting (Upstash)                                  │
│  - Authentication (Supabase Auth)                           │
│  - Error Handling                                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC                            │
│  - Portal Manager                                           │
│  - Progress Tracker                                         │
│  - Unlock Engine                                            │
│  - Biometric Analyzer                                       │
│  - AI Service Manager                                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
│  - Supabase (PostgreSQL)                                    │
│  - Redis (Caching + Rate Limiting)                          │
│  - Field-Level Encryption                                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                 EXTERNAL SERVICES                           │
│  - OpenAI API (GPT-4)                                       │
│  - Anthropic API (Claude)                                   │
│  - MediaPipe (Biometric)                                    │
│  - Resend (Email)                                           │
│  - Sentry (Error Tracking)                                  │
└─────────────────────────────────────────────────────────────┘
```

**State Management:** Zustand with CQRS pattern  
**Styling:** Tailwind CSS + Headless UI  
**Testing:** Vitest + React Testing Library + Playwright  

---

## 📦 Prerequisites

- **Node.js** >= 18.17.0
- **npm** >= 9.6.0
- **Git** (latest)

### Required Accounts:
1. [Supabase](https://supabase.com) - Database & Auth
2. [OpenAI](https://platform.openai.com) - AI Provider
3. [Upstash](https://upstash.com) - Redis (Caching & Rate Limiting)
4. [Resend](https://resend.com) - Email Service

### Optional (Recommended):
5. [Sentry](https://sentry.io) - Error Tracking
6. [Anthropic](https://console.anthropic.com) - Alternative AI Provider

---

## 🚀 Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-org/porverse-v2.git
cd porverse-v2
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- Next.js 15 + React 19
- TypeScript
- Tailwind CSS
- Supabase Client
- OpenAI + Anthropic SDKs
- MediaPipe (Biometric)
- Zustand (State Management)
- Zod (Validation)
- Vitest (Testing)
- And 50+ other packages

### 3. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in ALL required values. See [Environment Setup](#-environment-setup) below.

---

## 🔐 Environment Setup

### Step 1: Supabase

1. Create project at [Supabase](https://app.supabase.com)
2. Go to Settings → API
3. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2: OpenAI

1. Create account at [OpenAI Platform](https://platform.openai.com)
2. Generate API key
3. Copy to `OPENAI_API_KEY`

### Step 3: Upstash Redis

1. Create database at [Upstash](https://console.upstash.com)
2. Copy:
   - REST URL → `UPSTASH_REDIS_REST_URL`
   - REST Token → `UPSTASH_REDIS_REST_TOKEN`

### Step 4: Resend

1. Create account at [Resend](https://resend.com)
2. Generate API key
3. Copy to `RESEND_API_KEY`

### Step 5: Encryption Key

Generate a secure encryption key:

```bash
openssl rand -base64 32
```

Copy output to `ENCRYPTION_MASTER_KEY`

### Step 6: Session Secret

```bash
openssl rand -base64 32
```

Copy output to `SESSION_SECRET`

### Example `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx

# Redis
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AYxxxxxxxxxxxxxxxxxxxx

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Encryption
ENCRYPTION_MASTER_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Security
SESSION_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 💻 Development

### Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Project Structure

```
porverse-v2/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (dashboard)/       # Dashboard routes
│   └── api/               # API routes
├── components/            # React components
│   ├── portals/          # Portal-related components
│   ├── biometric/        # Biometric components
│   └── ai/               # AI chat components
├── lib/                   # Business logic & utilities
│   ├── services/         # Service classes
│   ├── security/         # Security utilities
│   ├── performance/      # Performance utilities
│   └── monitoring/       # Logging & metrics
├── hooks/                 # Custom React hooks
├── stores/                # Zustand state stores
├── types/                 # TypeScript definitions
├── tests/                 # Test files
└── public/                # Static assets
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run type-check       # Check TypeScript
npm run format           # Format code with Prettier
npm run format:check     # Check formatting

# Testing
npm run test             # Run unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run E2E tests
npm run test:a11y        # Run accessibility tests

# Analysis
npm run analyze          # Analyze bundle size

# Database
npm run db:generate      # Generate Supabase types
npm run db:migrate       # Run database migrations
```

---

## 🧪 Testing

### Unit Tests (Vitest)

```bash
npm run test
```

Coverage targets:
- Lines: >90%
- Functions: >90%
- Branches: >85%
- Statements: >90%

### E2E Tests (Playwright)

```bash
npm run test:e2e
```

### Accessibility Tests

```bash
npm run test:a11y
```

All components must meet **WCAG 2.2 AAA** standards.

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

### Docker

```bash
# Build
docker build -t porverse-v2 .

# Run
docker run -p 3000:3000 porverse-v2
```

### Environment Variables

⚠️ **CRITICAL**: Set all environment variables in your deployment platform.

Never commit `.env.local` to git!

---

## 🔒 Security

### Security Features

1. **Input Validation** - All API endpoints use Zod schemas
2. **Rate Limiting** - 5 tiers of protection
3. **Field Encryption** - AES-256-GCM for sensitive data
4. **Security Headers** - OWASP recommendations
5. **CSRF Protection** - Built into Next.js
6. **XSS Prevention** - Content Security Policy
7. **SQL Injection Protection** - Parameterized queries

### Security Checklist

- [ ] All environment variables set
- [ ] HTTPS enabled in production
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] Input validation on all endpoints
- [ ] Encryption keys rotated monthly
- [ ] Dependencies audited (`npm audit`)
- [ ] Sentry configured for error tracking

---

## ⚡ Performance

### Performance Targets

- ✅ Lighthouse Score: >90
- ✅ Time to Interactive: <3s (mobile)
- ✅ First Contentful Paint: <1.8s
- ✅ Largest Contentful Paint: <2.5s
- ✅ API Response Time: <200ms (P95)
- ✅ Bundle Size: <200KB (initial)

### Optimization Techniques

1. **Code Splitting** - Automatic with Next.js
2. **Image Optimization** - AVIF/WebP formats
3. **Caching** - Multi-tier (Memory + Redis)
4. **CDN** - Static assets on edge
5. **Compression** - Gzip/Brotli
6. **Lazy Loading** - Below-the-fold content

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: TypeScript errors after installation  
**Solution**: Run `npm run type-check` to see specific errors

**Issue**: Environment variables not working  
**Solution**: Make sure `.env.local` exists and all values are set (no placeholders)

**Issue**: MediaPipe not loading  
**Solution**: Check that `@mediapipe/*` packages are installed

**Issue**: Redis connection failing  
**Solution**: Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

**Issue**: Build failing  
**Solution**: 
1. Delete `.next` folder
2. Run `npm run clean`
3. Run `npm install`
4. Run `npm run build`

### Getting Help

1. Check existing [Issues](https://github.com/your-org/porverse-v2/issues)
2. Read [Documentation](./docs/)
3. Contact support: support@porverse.com

---

## 👥 Contributing

This is a proprietary project. For internal team members:

1. Create feature branch from `develop`
2. Follow TypeScript/ESLint rules
3. Write tests (>90% coverage)
4. Update documentation
5. Create Pull Request
6. Wait for review + CI checks

---

## 📄 License

**Proprietary** - All rights reserved. See [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Supabase](https://supabase.com/)
- [OpenAI](https://openai.com/)
- [MediaPipe](https://google.github.io/mediapipe/)

---

**Version:** 2.0.0  
**Last Updated:** December 14, 2025  
**Status:** SUPER ENTERPRISE INTERSTELLAR ✨

---

Made with ❤️ for transforming lives globally 🌍