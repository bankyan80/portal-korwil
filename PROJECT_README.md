# Portal Pendidikan Kecamatan Lemahabang

Portal resmi pendidikan Kecamatan Lemahabang - Tim Kerja Kecamatan Lemahabang - Dinas Pendidikan Kabupaten Cirebon.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Icons**: lucide-react
- **State Management**: Zustand
- **Forms**: react-hook-form + zod
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Notifications**: Sonner (Toast)
- **Theme**: next-themes (Dark/Light Mode)
- **Animation**: Framer Motion

## Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd portal-pendidikan-lemahabang
bun install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
# Edit .env.local with your Firebase credentials
```

### 3. Development

```bash
bun dev
```

App runs at `http://localhost:3000`

### 4. Production Build

```bash
bun run build
bun start
```

## Deployment

### Vercel

```bash
vercel deploy
```

### Firebase Hosting

```bash
bun run build
firebase deploy --only hosting
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # SPA router (portal/login/admin views)
│   └── globals.css         # Global styles + theme variables
├── components/
│   ├── portal/             # Public portal sections
│   │   ├── Header.tsx      # Sticky header with clock & auth
│   │   ├── HeroSection.tsx # Kepala Dinas sambutan
│   │   ├── MenuGrid.tsx    # 16-item navigation grid
│   │   ├── Announcements.tsx # Pengumuman list
│   │   ├── Gallery.tsx     # Galeri kegiatan with filters
│   │   ├── Organizations.tsx # Org cards
│   │   ├── InstitutionLinks.tsx # External links
│   │   └── Footer.tsx      # Portal footer
│   ├── admin/              # Admin panel components
│   │   ├── AdminLayout.tsx # Admin layout with sidebar
│   │   ├── AdminSidebar.tsx # Navigation sidebar
│   │   ├── AdminDashboard.tsx # Stats overview
│   │   ├── ManageMenus.tsx # CRUD menus
│   │   ├── ManageAnnouncements.tsx # CRUD announcements
│   │   ├── ManageGallery.tsx # Gallery management + approval
│   │   ├── ManageOrganizations.tsx # CRUD organizations
│   │   ├── ManageInstitutionLinks.tsx # CRUD links
│   │   └── ManageUsers.tsx # User management
│   ├── auth/
│   │   └── LoginForm.tsx   # Login page
│   └── shared/
│       └── SectionTitle.tsx # Reusable section header
├── providers/
│   ├── AuthProvider.tsx    # Firebase auth + mock mode
│   └── ThemeProvider.tsx   # Dark/light theme
├── store/
│   └── app-store.ts        # Zustand global state
├── lib/
│   ├── firebase.ts         # Firebase config
│   ├── mock-data.ts        # Demo data (mock mode)
│   └── utils.ts            # Utility functions
├── types/
│   └── index.ts            # TypeScript interfaces
└── hooks/
    ├── use-toast.ts
    └── use-mobile.ts
```

## Firestore Collections

| Collection | Fields |
|-----------|--------|
| `menus` | title, icon, url, active, order, category |
| `announcements` | title, content, createdAt, pinned, author |
| `gallery` | title, description, images[], category, authorName, authorRole, status, createdAt |
| `organizations` | name, logo, leader, contact, active |
| `institution_links` | name, logo, url, active, order |
| `users` | uid, email, displayName, role, photoURL, schoolName, organization, phone, createdAt, updatedAt |

## User Roles

| Role | Access |
|------|--------|
| `admin` | Full access (all CRUD + approve gallery) |
| `operator_sekolah` | Upload gallery for own school |
| `organisasi` | Upload gallery for own organization |
| `viewer` | View portal only |

## Mock Mode

When Firebase is not configured, the app runs in **mock mode** with demo data. This is useful for development and testing.

## Future Development

- Android app via Capacitor
- Online report system
- Real-time school monitoring
- Document upload system
- Digital archive system
