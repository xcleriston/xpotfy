# Dental 3D Print Management System

A SaaS platform for managing 3D printing orders in dental practices and laboratories.

## Features

- Multi-user system with 5 access levels (Doctor, Laboratory, Technician, Administrator, Super Admin)
- Order management with timeline chat
- File handling (STL, Blend, OBJ, photos, videos)
- SaaS client configuration
- Real-time notifications
- Comprehensive reporting system

## Tech Stack

- Frontend: Next.js with TypeScript
- UI: Tailwind CSS
- Backend: Supabase (PostgreSQL, Storage, Auth)
- Authentication: Email/password with role-based access control

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Next.js pages
├── lib/           # Utility functions and configurations
├── types/         # TypeScript type definitions
└── styles/        # Global styles
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT
