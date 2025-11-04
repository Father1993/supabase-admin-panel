## Product & Category Management Admin Panel

A comprehensive Next.js admin panel for managing products, categories, and images with AI-generated content, rich text editing, and approval workflows. Built for teams that need to review, edit, and approve content before publication.

### Core Features

**Product Management**
- View all products with AI-generated descriptions and images
- Pagination support (50 items per page) with sorting options
- Real-time product search with autocomplete (by name, ID, article, 1C code)
- Product filtering and single-item view mode
- Real-time product images loaded directly from database
- Visual status indicators for PIM integration and approval status
- Direct links to external PIM system for product verification

**Category Management**
- View all product categories with AI-generated descriptions
- Category approval workflow with editing capabilities
- Real-time category search with autocomplete (by name, ID, level)
- Category hierarchy display with level indicators
- Product count tracking per category
- Random category assignment for review
- Progress tracking showing remaining categories to confirm

**Content Editing**
- Rich text editor with toolbar: Bold, Italic, Underline, Headers, Lists, Links
- Live preview with HTML sanitization for security
- Edit product descriptions (short and full) and category descriptions
- Auto-save functionality with error handling
- Content validation and sanitization before database storage

**Approval Workflow**
- Random assignment system for products and categories to prevent conflicts
- 5-minute locking mechanism to prevent simultaneous editing
- One-click approval and rejection with user email tracking
- Rejection system with `is_rejected` flag for quality control
- Automatic cleanup of expired locks
- Progress tracking showing remaining items to confirm

**User Management**
- Supabase authentication (email/password)
- Role-based access control
- Personal dashboard showing user's confirmed products, images, and categories
- Admin statistics panel for team performance tracking across all entity types

**Image Management**
- Three-status image approval system: Approved, Rejected, Requires Replacement
- Automatic product image loading from database URLs
- Image quality control workflow with user tracking
- Fallback handling for missing images
- Responsive image display with proper aspect ratios
- Error handling for broken image links
- Image filtering by approval status

### Pages & Navigation

**Admin Page (`/admin`)**
- Random product assignment for review
- Content editing interface with rich text editor
- Approval and rejection workflow controls
- Real-time progress tracking
- Product rejection system for quality control

**Admin Categories (`/admin/categories`)**
- Random category assignment for review
- Category description editing with rich text editor
- Approval and rejection workflow for categories
- Progress tracking for pending categories
- Category hierarchy and metadata display

**Admin Images (`/admin/images`)**
- Image quality control workflow
- Three-button approval system: Approved, Rejected, Requires Replacement
- Image dimension display and validation
- Progress tracking for pending images
- User email tracking for approved images

**Products Page (`/products`)**
- Browse all products with descriptions
- Real-time search with autocomplete dropdown
- Product filtering and single-item view mode
- Pagination and sorting controls (hidden when filtering)
- Status indicators and metadata display
- Admin statistics panel for team performance tracking

**Categories Page (`/categories`)**
- Browse all product categories with descriptions
- Real-time search with autocomplete dropdown (by name, ID)
- Category filtering and single-item view mode
- Pagination and sorting controls
- Category hierarchy display with level indicators
- Product count per category
- Admin statistics panel for team performance tracking

**Images Page (`/images`)**
- Browse all product images with status indicators
- Filter by status: All, Pending, Approved, Requires Replacement, Rejected
- Visual status badges for quick identification
- Pagination and sorting controls
- Image quality verification tools
- Admin statistics panel for team performance tracking

**Approved Products (`/approved-products`)**
- Personal dashboard of confirmed products
- Admin statistics panel (for authorized users)
- Performance metrics and user activity
- Sorting and pagination controls

**Approved Images (`/approved-images`)**
- Personal dashboard of images confirmed by user
- Admin statistics panel showing team performance
- Confirmation counts by user email
- Sorting and pagination controls

**Rejected Images (`/rejected-images`)**
- List of all rejected images
- Image restoration functionality
- Sorting and filtering options
- Quality control review system

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

### Key Components

**Reusable UI Components**
- `ProductHeader` - Unified product card headers with metadata display
- `ProductSearch` - Real-time search with autocomplete dropdown
- `ProductImage` - Optimized image display with fallback handling
- `CategoryHeader` - Unified category card headers with hierarchy and metadata
- `CategorySearch` - Real-time category search with autocomplete dropdown
- `UserStatsPanel` - Universal statistics panel for admins (products, images, categories)
- `RejectButton` - Product rejection functionality
- `PaginationBar` - Pagination controls with progress indicators
- `RichTextEditorModal` - Content editing with HTML sanitization
- `SafeHtml` - Secure HTML rendering component

**Responsive Design**
- Mobile-first approach with adaptive navigation
- Collapsible mobile menu with smooth animations
- Touch-friendly interface elements
- Optimized layouts for all screen sizes

### Database Schema

The application works with two main tables:

**Products Table**

**Core Product Data**
- `id`, `uid`, `product_name`, `article`, `code_1c`
- `short_description`, `description` (HTML content)
- `image_optimized_url` (direct image links)

**Workflow Management**
- `description_added` (boolean)
- `description_confirmed` (boolean)
- `confirmed_by_email` (text)
- `locked_until` (timestamp)
- `is_rejected` (boolean) - Product rejection flag for quality control

**Image Workflow**
- `image_status` (enum: approved, rejected, replace_later)
- `image_confirmed` (boolean) - Legacy field for backward compatibility
- `image_rejected` (boolean) - Legacy field for backward compatibility
- `image_confirmed_by_email` (text)
- `image_url`, `image_optimized_url` (text)
- `is_optimized` (boolean)

**Audit Trail**
- `created_at`, `updated_at` (timestamps)
- `push_to_pim` (integration status)
- `link_pim` (external system links)

**Categories Table**

**Core Category Data**
- `id`, `parent_id`, `header` (category name)
- `sync_uid` (external system sync ID)
- `level` (hierarchy level)
- `product_count`, `product_count_additional` (product counts)
- `description` (HTML content)

**Workflow Management**
- `description_added` (boolean)
- `description_confirmed` (boolean)
- `confirmed_by_email` (text)
- `is_rejected` (boolean) - Category rejection flag for quality control

**Audit Trail**
- `created_at`, `updated_at` (timestamps)
- `push_to_pim` (integration status)

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
  ADD COLUMN IF NOT EXISTS image_optimized_url text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS description_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmed_by_email text,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz,
  ADD COLUMN IF NOT EXISTS is_rejected boolean NOT NULL DEFAULT false;

-- Create ENUM type for image status
CREATE TYPE public.image_status_enum AS ENUM ('approved', 'rejected', 'replace_later');

-- Add image workflow columns
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_status public.image_status_enum DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS image_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS image_rejected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS image_confirmed_by_email text;

-- Add required columns to categories table
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS description_added boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS description_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmed_by_email text,
  ADD COLUMN IF NOT EXISTS is_rejected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS push_to_pim boolean NOT NULL DEFAULT false;

-- Create update trigger for products
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

-- Create update trigger for categories
CREATE TRIGGER trg_set_updated_at_categories
  BEFORE UPDATE ON public.categories
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
- Navigate to `/admin/categories` for category review
- Navigate to `/admin/images` for image quality control
- Use `/products` to browse all products
- Use `/categories` to browse all categories
- Use `/images` to browse all images
- Check `/approved-products` for personal product dashboard
- Check `/approved-images` for personal images dashboard

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
- Review and edit product and category descriptions
- Approve or reject content with email tracking
- Manage image quality control with three-status system
- Search and filter products and categories with real-time autocomplete
- View personal confirmation history for products, images, and categories
- Access product images and metadata

**Admin Users**
- All standard user permissions
- Access to unified statistics panel across all entity types
- View confirmation counts by user for products, images, and categories
- Monitor team performance metrics with detailed breakdowns

### Security Features

- HTML content sanitization prevents XSS attacks
- User authentication with Supabase
- Row-level security policies
- Input validation and error handling
- Secure image loading with fallbacks
- Session management and auto-logout

### Performance Optimizations

- Image optimization with Next.js Image component
- Database query optimization with pagination and search indexing
- Real-time search with debounced API calls
- Client-side caching for better UX
- Efficient state management with React hooks
- Minimal bundle size with tree shaking
- Responsive design with mobile-first approach
