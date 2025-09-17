## Product Management Admin Panel

A comprehensive Next.js admin panel for managing product descriptions with image support, content editing, and approval workflows. Built for teams that need to review, edit, and approve product content before publication.

### Core Features

**Product Management**
- View all products with AI-generated descriptions and images
- Pagination support (50 products per page) with sorting options
- Real-time product images loaded directly from database
- Visual status indicators for PIM integration and approval status
- Direct links to external PIM system for product verification

**Content Editing**
- Rich text editor with toolbar: Bold, Italic, Underline, Headers, Lists, Links
- Live preview with HTML sanitization for security
- Edit both short and full product descriptions
- Auto-save functionality with error handling
- Content validation and sanitization before database storage

**Approval Workflow**
- Random product assignment system to prevent conflicts
- 5-minute locking mechanism to prevent simultaneous editing
- One-click approval with user email tracking
- Automatic cleanup of expired locks
- Progress tracking showing remaining products to confirm

**User Management**
- Supabase authentication (email/password)
- Role-based access control
- Personal dashboard showing user's confirmed products
- Admin statistics for team performance tracking

**Image Management**
- Automatic product image loading from database URLs
- Fallback handling for missing images
- Responsive image display with proper aspect ratios
- Error handling for broken image links

### Pages & Navigation

**Admin Page (`/admin`)**
- Random product assignment for review
- Content editing interface
- Approval workflow controls
- Real-time progress tracking

**Products Page (`/products`)**
- Browse all products with descriptions
- Pagination and sorting controls
- Status filtering and search
- Bulk operations support

**Approved Products (`/approved-products`)**
- Personal dashboard of confirmed products
- Admin statistics (for authorized users)
- Performance metrics and user activity
- Export and reporting capabilities

**Login Page (`/login`)**
- Secure authentication
- Session management
- Automatic redirect handling

### Technical Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Security**: HTML sanitization with DOMPurify
- **Deployment**: Docker containerization with Traefik reverse proxy
- **Image Handling**: Next.js Image optimization with fallbacks

### Database Schema

The application works with a `products` table containing:

**Core Product Data**
- `id`, `uid`, `product_name`, `article`, `code_1c`
- `short_description`, `description` (HTML content)
- `image_url` (direct image links)

**Workflow Management**
- `description_added` (boolean)
- `description_confirmed` (boolean)
- `confirmed_by_email` (text)
- `locked_until` (timestamp)

**Audit Trail**
- `created_at`, `updated_at` (timestamps)
- `push_to_pim` (integration status)
- `link_pim` (external system links)

### Getting Started

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Setup**
```bash
# Create .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Database Setup**
```sql
-- Add required columns to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS description_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmed_by_email text,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz;

-- Create update trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

4. **Run Development Server**
```bash
npm run dev
```

5. **Access Application**
- Open `http://localhost:3000`
- Login at `/login`
- Navigate to `/admin` for product review
- Use `/products` to browse all items
- Check `/approved-products` for personal dashboard

### Docker Deployment

**Build and Run**
```bash
docker-compose up -d
```

**Environment Variables**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### User Roles & Permissions

**Standard Users**
- Review and edit product descriptions
- Approve content with email tracking
- View personal confirmation history
- Access product images and metadata

**Admin Users**
- All standard user permissions
- Access to team statistics dashboard
- View confirmation counts by user
- Monitor team performance metrics

### Security Features

- HTML content sanitization prevents XSS attacks
- User authentication with Supabase
- Row-level security policies
- Input validation and error handling
- Secure image loading with fallbacks
- Session management and auto-logout

### Performance Optimizations

- Image optimization with Next.js Image component
- Database query optimization with pagination
- Client-side caching for better UX
- Efficient state management
- Minimal bundle size with tree shaking
