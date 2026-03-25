-- Migration: Add email verification fields to User table
-- Apply this in the Supabase SQL Editor

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "emailVerified"     BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "emailVerifyToken"  TEXT      UNIQUE,
  ADD COLUMN IF NOT EXISTS "emailVerifyExpiry" TIMESTAMP WITH TIME ZONE;

-- Change the default status for NEW users to PENDING
-- (existing users keep their current status)
ALTER TABLE "User"
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Index for fast token lookups during verification
CREATE INDEX IF NOT EXISTS "User_emailVerifyToken_idx" ON "User" ("emailVerifyToken");
