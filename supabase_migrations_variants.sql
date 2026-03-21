-- Database Schema upgades for the Advanced Variant & SKU Engine

ALTER TABLE products
ADD COLUMN IF NOT EXISTS variants jsonb DEFAULT '[]'::jsonb;
