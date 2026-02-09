# SlotSaver

Automatically fill empty appointment/class time slots by applying rule-based discounts and sending offers to customers via email and SMS.

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next.js API Route Handlers + Prisma ORM
- **Database:** PostgreSQL (Neon)
- **Auth:** NextAuth (email magic link via Resend)
- **Email:** Resend
- **SMS:** Twilio
- **Hosting:** Vercel
- **Cron:** Vercel Cron (hourly)

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd slotsaver
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `NEXTAUTH_URL` | Your app URL (http://localhost:3000 for dev) |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) |
| `EMAIL_FROM` | Sender email (must be verified in Resend) |
| `TWILIO_ACCOUNT_SID` | From Twilio console |
| `TWILIO_AUTH_TOKEN` | From Twilio console |
| `TWILIO_PHONE_NUMBER` | Your Twilio phone number |
| `CRON_SECRET` | Random secret to protect the cron endpoint |

### 3. Set up Neon database

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string to `DATABASE_URL` in `.env`
3. Push the schema:

```bash
npx prisma db push
```

4. (Optional) Seed demo data:

```bash
npm run db:seed
```

### 4. Set up Resend

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your domain (or use the sandbox domain for testing)
3. Create an API key and add it to `RESEND_API_KEY`

### 5. Set up Twilio

1. Sign up at [twilio.com](https://twilio.com)
2. Get a phone number
3. Add Account SID, Auth Token, and phone number to `.env`

### 6. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 7. Deploy to Vercel

```bash
vercel
```

The `vercel.json` configures the cron job to run hourly at `/api/cron`.

Set the `CRON_SECRET` environment variable in Vercel to protect the endpoint.

## Project Structure

```
src/
├── app/
│   ├── (auth)/signin/          # Sign-in page
│   ├── (app)/app/              # Authenticated app pages
│   │   ├── page.tsx            # Dashboard
│   │   ├── onboarding/         # Business setup
│   │   ├── slots/              # Slot management
│   │   ├── rules/              # Discount rules
│   │   ├── customers/          # Customer management
│   │   └── offers/             # Offer listing
│   └── api/
│       ├── auth/[...nextauth]/ # NextAuth
│       ├── business/           # Business CRUD
│       ├── slots/              # Slots API
│       ├── rules/              # Rules API
│       ├── customers/          # Customers API
│       ├── offers/             # Offers API
│       ├── import/             # CSV import endpoints
│       └── cron/               # Hourly cron job
├── components/
│   ├── ui/                     # Reusable UI components
│   ├── nav.tsx                 # Navigation bar
│   └── providers.tsx           # Session + toast providers
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   ├── auth.ts                 # NextAuth config + helpers
│   ├── validations.ts          # Zod schemas
│   ├── rule-engine.ts          # Discount rule evaluation
│   └── messaging.ts            # Email (Resend) + SMS (Twilio)
└── types/
    └── next-auth.d.ts          # NextAuth type augmentation
```

## How It Works

1. **Create a business** via the onboarding page
2. **Add slots** manually or via CSV import
3. **Set discount rules** (e.g., "25% off if slot is within 24 hours and less than 50% booked")
4. **Import customers** with email/phone and service tags
5. **Cron job runs hourly:**
   - Evaluates rules against upcoming slots (next 7 days)
   - Creates offers for matching slots
   - Sends offers to eligible customers via email/SMS
   - Anti-spam: max 1 offer per customer per 24 hours per business
6. **Dashboard** shows slot health and active offers

## Manual QA Checklist

- [ ] Sign in with email magic link
- [ ] Create a new business (onboarding)
- [ ] Create slots manually
- [ ] Import slots via CSV
- [ ] Create discount rules
- [ ] Verify rules appear in the list
- [ ] Toggle rule enabled/disabled
- [ ] Add customers manually
- [ ] Import customers via CSV
- [ ] Check dashboard shows slot health correctly
- [ ] Verify offers are generated (trigger cron manually: `GET /api/cron` with `Authorization: Bearer <CRON_SECRET>`)
- [ ] Verify offer statuses (DRAFT -> SENT)
- [ ] Toggle offer disabled on dashboard
- [ ] Check email delivery in Resend dashboard
- [ ] Check SMS delivery in Twilio console
- [ ] Verify anti-spam: same customer not messaged twice in 24h
- [ ] Verify expired offers (past slot start time)

## CSV Format

### Slots CSV

```csv
serviceType,startTime,endTime,capacity,bookedCount,basePriceCents
Haircut,2025-01-15T10:00:00,2025-01-15T11:00:00,3,0,3000
Massage,2025-01-15T14:00:00,2025-01-15T15:00:00,1,0,8000
```

### Customers CSV

```csv
name,email,phone,tags
Alice Johnson,alice@example.com,+15551234001,"Haircut,Facial"
Bob Smith,bob@example.com,+15551234002,Massage
```
