# SistemSawit App

Aplikasi SaaS untuk pengurusan ladang kelapa sawit di `app.sistemsawit.com`.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, Database, and Storage
- Vercel deployment

## Modul awal

- Pelanggan/syarikat
- Ladang, blok, dan lot tanaman
- Pekerja dan pasukan mandor
- Kehadiran dengan lokasi
- Rekod tuaian dan hasil kutipan
- Kesihatan tanaman dan tindakan susulan
- Dashboard operasi dan laporan asas

## Setup environment

Copy `.env.example` ke `.env.local` dan isi nilai dari Supabase project.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Development

```bash
npm install
npm run dev
```

## Database

Jalankan SQL dalam `supabase/schema.sql` di Supabase SQL Editor untuk buat jadual asas MVP.
