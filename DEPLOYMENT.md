# Deployment Guide

## Prerequisites
- Node.js 18+
- Supabase Project
- Vercel Account

## Environment Variables
Create a `.env.local` file with the following:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Database Setup
Ensure all tables (`figures`, `series`, `orders`, `order_items`, `vouchers`, `order_vouchers`, `carts`) are created in Supabase. Apply Row-Level Security (RLS) policies to protect data, while relying on the `SUPABASE_SERVICE_ROLE_KEY` in API routes for secure administrative actions.

## Deploying to Vercel
1. Push your code to GitHub.
2. Import the repository into Vercel.
3. Add the environment variables in the Vercel dashboard.
4. Deploy!
