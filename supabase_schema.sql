-- ============================================================
-- SwaDesi Complete Database Schema
-- ============================================================
-- This schema includes all tables needed for the SwaDesi app
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
-- Main user profile table with gamification and preferences
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Points and Gamification
  points INTEGER DEFAULT 100,
  pointsLifetime INTEGER DEFAULT 100,
  pointsTier TEXT DEFAULT 'bronze' CHECK (pointsTier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond', 'emerald', 'ruby', 'cosmic', 'infinite')),
  level INTEGER DEFAULT 1,
  streakDays INTEGER DEFAULT 0,
  lastLoginDate TIMESTAMPTZ DEFAULT NOW(),
  
  -- Statistics
  totalSpent DECIMAL(10,2) DEFAULT 0,
  dailyLoginCount INTEGER DEFAULT 0,
  referralCount INTEGER DEFAULT 0,
  reviewCount INTEGER DEFAULT 0,
  billUploadCount INTEGER DEFAULT 0,
  
  -- Arrays for lists
  achievements TEXT[] DEFAULT '{}',
  completedChallenges TEXT[] DEFAULT '{}',
  favoriteProducts TEXT[] DEFAULT '{}',
  wishlist TEXT[] DEFAULT '{}',
  recentSearches TEXT[] DEFAULT '{}',
  
  -- JSON fields for complex data
  weeklyProgress JSONB DEFAULT '{}',
  savedAddresses JSONB DEFAULT '[]',
  defaultAddressId TEXT,
  preferences JSONB DEFAULT '{
    "favoriteVendors": [],
    "favoriteCategories": [],
    "dietaryRestrictions": [],
    "priceRange": [0, 10000],
    "deliveryPreference": "fast",
    "notificationSettings": {
      "orderUpdates": true,
      "promotions": true,
      "achievements": true,
      "social": true
    }
  }',
  socialProfile JSONB DEFAULT '{
    "isPublic": true,
    "followersCount": 0,
    "followingCount": 0,
    "reviewsWritten": 0,
    "helpfulVotes": 0
  }',
  personalizedOffers JSONB DEFAULT '[]',
  seasonalProgress JSONB DEFAULT '{}',
  friendsList TEXT[] DEFAULT '{}',
  blockedUsers TEXT[] DEFAULT '{}',
  privacySettings JSONB DEFAULT '{
    "showRealName": true,
    "showOrderHistory": false,
    "showAchievements": true,
    "allowFriendRequests": true
  }',
  
  -- Subscription
  subscriptionTier TEXT DEFAULT 'free' CHECK (subscriptionTier IN ('free', 'premium', 'elite')),
  subscriptionExpiry TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_points_idx ON users(points);
CREATE INDEX IF NOT EXISTS users_level_idx ON users(level);

-- ============================================================
-- CART ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_data JSONB NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cart"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS cart_items_user_id_idx ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS cart_items_product_id_idx ON cart_items(product_id);

-- ============================================================
-- ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Order details
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  
  -- Points
  points_earned INTEGER DEFAULT 0,
  points_used INTEGER DEFAULT 0,
  
  -- Delivery
  delivery_address JSONB,
  delivery_person JSONB,
  tracking_steps JSONB DEFAULT '[]',
  
  -- Timestamps
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estimated_delivery TIMESTAMPTZ,
  delivery_time TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_placed_at_idx ON orders(placed_at DESC);

-- ============================================================
-- BILL UPLOADS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS bill_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Bill details
  vendor_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  points_earned INTEGER NOT NULL,
  image_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE bill_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bills"
  ON bill_uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bills"
  ON bill_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bills"
  ON bill_uploads FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS bill_uploads_user_id_idx ON bill_uploads(user_id);
CREATE INDEX IF NOT EXISTS bill_uploads_verified_idx ON bill_uploads(verified);
CREATE INDEX IF NOT EXISTS bill_uploads_uploaded_at_idx ON bill_uploads(uploaded_at DESC);

-- ============================================================
-- POINTS ACTIVITY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS points_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Activity details
  type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed')),
  amount INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('order', 'bill_upload', 'referral', 'review', 'streak', 'first_purchase', 'bonus', 'achievement', 'daily_challenge', 'weekly_challenge', 'level_up')),
  description TEXT NOT NULL,
  
  -- References
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  achievement_id TEXT,
  challenge_id TEXT,
  
  -- Timestamp
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE points_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own points activity"
  ON points_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points activity"
  ON points_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS points_activity_user_id_idx ON points_activity(user_id);
CREATE INDEX IF NOT EXISTS points_activity_date_idx ON points_activity(date DESC);
CREATE INDEX IF NOT EXISTS points_activity_type_idx ON points_activity(type);
CREATE INDEX IF NOT EXISTS points_activity_source_idx ON points_activity(source);

-- ============================================================
-- VENDORS TABLE (Optional - for vendor management)
-- ============================================================
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  gstin TEXT,
  
  -- Vendor details
  category TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  address JSONB,
  
  -- Statistics
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  -- Status
  verified BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for vendors
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view their own profile"
  ON vendors FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Vendors can update their own profile"
  ON vendors FOR UPDATE
  USING (auth.uid() = id);

-- Create indexes
CREATE INDEX IF NOT EXISTS vendors_email_idx ON vendors(email);
CREATE INDEX IF NOT EXISTS vendors_category_idx ON vendors(category);
CREATE INDEX IF NOT EXISTS vendors_verified_idx ON vendors(verified);
CREATE INDEX IF NOT EXISTS vendors_active_idx ON vendors(active);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Create storage bucket for bill images
INSERT INTO storage.buckets (id, name, public)
VALUES ('bill-images', 'bill-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for vendor logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-logos', 'vendor-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for bill-images
CREATE POLICY "Users can upload their own bills"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'bill-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view bill images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'bill-images');

CREATE POLICY "Users can delete their own bills"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'bill-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policies for vendor-logos
CREATE POLICY "Vendors can upload their logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'vendor-logos');

CREATE POLICY "Anyone can view vendor logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vendor-logos');

-- Storage policies for product-images
CREATE POLICY "Vendors can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to all tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bill_uploads_updated_at
  BEFORE UPDATE ON bill_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================

-- Note: Uncomment below to insert sample data for testing
/*
-- Sample vendor
INSERT INTO vendors (id, email, name, business_name, phone, category, description, verified, active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'vendor@example.com',
  'Vendor Name',
  'Test Business',
  '+91 9876543210',
  'food',
  'A test vendor for development',
  true,
  true
);
*/

-- ============================================================
-- FUNCTIONS FOR ANALYTICS (Optional)
-- ============================================================

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_orders', COUNT(DISTINCT o.id),
    'total_spent', COALESCE(SUM(o.total), 0),
    'total_points_earned', COALESCE(SUM(pa.amount) FILTER (WHERE pa.type = 'earned'), 0),
    'total_points_redeemed', COALESCE(SUM(pa.amount) FILTER (WHERE pa.type = 'redeemed'), 0),
    'bills_uploaded', COUNT(DISTINCT b.id),
    'current_level', u.level,
    'current_tier', u.pointsTier,
    'streak_days', u.streakDays
  ) INTO result
  FROM users u
  LEFT JOIN orders o ON o.user_id = u.id
  LEFT JOIN points_activity pa ON pa.user_id = u.id
  LEFT JOIN bill_uploads b ON b.user_id = u.id
  WHERE u.id = user_uuid
  GROUP BY u.id, u.level, u.pointsTier, u.streakDays;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- COMPLETION MESSAGE
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ SwaDesi database schema created successfully!';
  RAISE NOTICE '📋 Tables created: users, cart_items, orders, bill_uploads, points_activity, vendors';
  RAISE NOTICE '🗂️  Storage buckets created: bill-images, vendor-logos, product-images';
  RAISE NOTICE '🔒 Row Level Security (RLS) policies applied to all tables';
  RAISE NOTICE '⚡ Triggers and indexes created for optimal performance';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next steps:';
  RAISE NOTICE '   1. Deploy the edge function from /supabase/functions/make-server/index.ts';
  RAISE NOTICE '   2. Test the authentication flow';
  RAISE NOTICE '   3. Start using the app!';
END $$;
