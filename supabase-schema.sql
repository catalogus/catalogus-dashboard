-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Hero Slides
CREATE TABLE hero_slides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  background_image TEXT NOT NULL,
  cta_text TEXT,
  cta_url TEXT,
  content_type TEXT DEFAULT 'generic',
  order_weight INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Authors
CREATE TABLE authors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  photo TEXT,
  phone TEXT,
  author_type TEXT,
  birth_date DATE,
  city TEXT,
  province TEXT,
  featured_video_url TEXT,
  website TEXT,
  linkedin TEXT,
  facebook TEXT,
  instagram TEXT,
  twitter TEXT,
  youtube TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles
CREATE TABLE articles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  author_id UUID REFERENCES authors(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'trash')),
  categories TEXT[] DEFAULT '{}',
  translation_status TEXT CHECK (translation_status IN ('pending', 'review', 'completed')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Books
CREATE TABLE books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_image TEXT,
  authors TEXT[] DEFAULT '{}',
  category TEXT,
  language TEXT DEFAULT 'pt',
  price DECIMAL(10,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  isbn TEXT,
  publisher TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'featured')),
  is_digital BOOLEAN DEFAULT false,
  original_price DECIMAL(10,2),
  promo_price DECIMAL(10,2),
  promo_start_date DATE,
  promo_end_date DATE,
  weight DECIMAL(10,2),
  dimensions TEXT,
  pages INTEGER,
  synopsis TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'author', 'user')),
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')),
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  total DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Author Claims
CREATE TABLE author_claims (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id UUID REFERENCES authors(id),
  claimed_by TEXT,
  user_id UUID REFERENCES users(id),
  verification_info TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mapas Literários
CREATE TABLE mapas_literarios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  pdf_file TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  pages INTEGER DEFAULT 1,
  display_mode TEXT DEFAULT 'single' CHECK (display_mode IN ('single', 'double')),
  width INTEGER DEFAULT 800,
  height INTEGER DEFAULT 600,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_author_claims_author ON author_claims(author_id);
CREATE INDEX idx_author_claims_status ON author_claims(status);

-- Enable RLS (Row Level Security)
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE author_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE mapas_literarios ENABLE ROW LEVEL SECURITY;

-- Create policies for anon access (for development)
CREATE POLICY "Allow anon read access" ON hero_slides FOR SELECT USING (true);
CREATE POLICY "Allow anon insert access" ON hero_slides FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update access" ON hero_slides FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete access" ON hero_slides FOR DELETE USING (true);

CREATE POLICY "Allow anon read access" ON authors FOR SELECT USING (true);
CREATE POLICY "Allow anon insert access" ON authors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update access" ON authors FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete access" ON authors FOR DELETE USING (true);

CREATE POLICY "Allow anon read access" ON articles FOR SELECT USING (true);
CREATE POLICY "Allow anon insert access" ON articles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update access" ON articles FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete access" ON articles FOR DELETE USING (true);

CREATE POLICY "Allow anon read access" ON books FOR SELECT USING (true);
CREATE POLICY "Allow anon insert access" ON books FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update access" ON books FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete access" ON books FOR DELETE USING (true);

CREATE POLICY "Allow anon read access" ON users FOR SELECT USING (true);
CREATE POLICY "Allow anon insert access" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update access" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete access" ON users FOR DELETE USING (true);

CREATE POLICY "Allow anon read access" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow anon insert access" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update access" ON orders FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete access" ON orders FOR DELETE USING (true);

CREATE POLICY "Allow anon read access" ON author_claims FOR SELECT USING (true);
CREATE POLICY "Allow anon insert access" ON author_claims FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update access" ON author_claims FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete access" ON author_claims FOR DELETE USING (true);

CREATE POLICY "Allow anon read access" ON mapas_literarios FOR SELECT USING (true);
CREATE POLICY "Allow anon insert access" ON mapas_literarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update access" ON mapas_literarios FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete access" ON mapas_literarios FOR DELETE USING (true);
