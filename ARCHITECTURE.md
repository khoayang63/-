# System Architecture

## Frontend (Next.js App Router)
- `/app/(auth)`: Login and registration flows.
- `/app/products`: Product listing and detail pages (`/products/[id]`).
- `/app/series`: Filtering products by series.
- `/app/cart`: Shopping cart overview.
- `/app/checkout`: Multi-step checkout including address geocoding, voucher application, and order summary.
- `/app/payment`: Payment status and QR code generation.
- `/components`: Reusable UI components (Header, Hero, FlashSale, etc.).
- `/context`: Global state management (`CartContext`).

## Backend & APIs
- **Supabase**: Serves as the primary database and authentication provider.
- **Next.js API Routes** (`/api/*`):
  - `/api/place-order`: Handles complex server-side validation, recalculates shipping, applies vouchers, checks stock, and securely inserts orders bypassing RLS with a service role key.

## Database Schema Highlights
- `users`: Managed by Supabase Auth.
- `figures`: Product catalog including stock, price, and pre-order status.
- `orders` & `order_items`: Order tracking.
- `vouchers` & `order_vouchers`: Discount logic and usage tracking.
- `carts` & `cart_items`: Persistent cart storage for logged-in users.

## External Integrations
- **Nominatim API**: Geocodes address strings into latitude/longitude.
- **OSRM API**: Calculates driving distance to determine dynamic shipping fees.
- **Open API VN**: Fetches administrative boundaries (Provinces, Districts, Wards).
