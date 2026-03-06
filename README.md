# LangoLeaf Freelancer Partner Portal

A modern, gamified dashboard for freelancer partners to manage student leads, track applications, and earn commissions.

## Features

- **Student Management**: Add and manage students, track their application progress
- **Application Tracking**: Visual pipeline showing application status from submission to enrollment
- **Earnings Dashboard**: Track commissions, pending payments, and agent tier progress
- **Gamification**: Earn coins and badges for successful enrollments
- **Real-time Notifications**: Get instant updates on application status changes
- **Document Management**: Upload and manage required documents

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (Email + OAuth + WhatsApp OTP)
- **Cache**: Upstash Redis
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Getting Started

1. Clone the repository
2. Copy `.env.local.example` to `.env.local` and fill in your credentials
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Authentication pages (login, signup)
│   ├── (dashboard)/      # Dashboard pages (protected)
│   │   ├── students/     # Student management
│   │   ├── applications/ # Application tracking
│   │   ├── documents/    # Document management
│   │   ├── earnings/     # Commission tracking
│   │   └── page.tsx      # Dashboard home
│   ├── api/              # API routes
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── layout/           # Layout components (header, sidebar)
│   ├── dashboard/        # Dashboard-specific components
│   └── gamification/     # Gamification components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
│   ├── supabase/         # Supabase clients
│   ├── redis/            # Redis client
│   └── utils/            # Helper functions
└── stores/               # Zustand state management
```

## Environment Variables

See `.env.local.example` for required environment variables.

## Deployment

This project is optimized for deployment on Vercel with free-tier services:

- **Vercel**: Frontend hosting (100GB bandwidth/month)
- **Supabase**: Database + Auth + Storage (500MB + 2M requests/month)
- **Upstash Redis**: Caching (10K commands/day)

## License

MIT
