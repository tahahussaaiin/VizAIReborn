# VizAI Setup Instructions

## ✅ What's Been Done

1. **Project Structure Created**
   - Monorepo setup with pnpm workspaces
   - Organized folders for apps, packages, and supabase
   - Mock AI service for development

2. **Database Schema Ready**
   - Complete SQL schema in `supabase/schema.sql`
   - Includes all tables, indexes, and RLS policies
   - Ready to run in Supabase SQL editor

3. **Mock AI Service Built**
   - Full mock implementation in `packages/utils/mock-ai-service.ts`
   - Returns realistic metaphors and D3 code
   - Allows complete development without AI costs

## 🚀 Next Steps to Complete Setup

### Step 1: Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign up/Login and create a new project (free tier)
3. Wait for project to be ready (~2 minutes)

### Step 2: Run Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy entire contents of `supabase/schema.sql`
4. Paste and click **Run**
5. You should see "Success" messages

### Step 3: Get Your API Keys

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: https://xxxx.supabase.co)
   - **anon public** key
   - **service_role** key (keep secret!)

### Step 4: Configure Environment

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and replace with your values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-role-key
   ```

### Step 5: Install Dependencies

```bash
# Install pnpm if you haven't
npm install -g pnpm

# Install all dependencies
pnpm install
```

### Step 6: Initialize Next.js App

```bash
# Navigate to web app directory
cd apps/web

# Create Next.js app with TypeScript and Tailwind
npx create-next-app@latest . --typescript --tailwind --app --src-dir --use-pnpm

# When prompted:
# ✓ Would you like to use ESLint? → Yes
# ✓ Would you like to use Tailwind CSS? → Yes (already selected)
# ✓ Would you like to use `src/` directory? → Yes (already selected)
# ✓ Would you like to use App Router? → Yes (already selected)
# ✓ Would you like to customize the default import alias? → No
```

### Step 7: Install Frontend Dependencies

```bash
# Still in apps/web directory
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs
pnpm add d3 @types/d3
pnpm add papaparse @types/papaparse
pnpm add lucide-react
pnpm add framer-motion
pnpm add react-dropzone
pnpm add zustand
pnpm add react-hot-toast
```

## 📁 Current Project Structure

```
VizAIReborn/
├── apps/
│   ├── web/                 # Next.js frontend (to be initialized)
│   └── edge-functions/       # Supabase Edge Functions (for later)
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── utils/               # Contains mock-ai-service.ts
│   └── types/               # Shared TypeScript types
├── supabase/
│   └── schema.sql           # Database schema (ready to run)
├── .env.local.example       # Environment template
├── package.json             # Root package.json
├── pnpm-workspace.yaml      # Monorepo configuration
└── IMPLEMENTATION_GUIDE.md  # Complete development guide
```

## 🎯 Development Workflow

1. **With Mock AI (Immediate Development)**
   - Set `NEXT_PUBLIC_MOCK_AI=true` in `.env.local`
   - Mock service returns realistic metaphors and visualizations
   - Perfect for UI/UX development

2. **With Real AI (When Ready)**
   - Get Google Gemini API key
   - Deploy Edge Functions to Supabase
   - Set `NEXT_PUBLIC_MOCK_AI=false`
   - Real AI generation begins

## 🔐 Security Notes

- Never commit `.env.local` file
- Keep `SUPABASE_SERVICE_KEY` secret
- Gemini API key will be stored in Supabase Edge Functions (not in frontend)

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [D3.js Documentation](https://d3js.org/)

## ❓ Need Help?

1. Check `IMPLEMENTATION_GUIDE.md` for detailed instructions
2. Review the mock service in `packages/utils/mock-ai-service.ts`
3. Database schema is fully documented in `supabase/schema.sql`

Ready to build! 🚀