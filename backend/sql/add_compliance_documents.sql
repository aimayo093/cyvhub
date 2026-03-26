-- Migration: Add driver_compliance_documents table
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "DriverComplianceDocument" (
  "id"                  TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT PRIMARY KEY,
  "driverId"            TEXT        NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "documentType"        TEXT        NOT NULL,
  "fileName"            TEXT        NOT NULL,
  "fileUrl"             TEXT        NOT NULL,
  "mimeType"            TEXT,
  "fileSize"            INTEGER,
  "issueDate"           TIMESTAMP WITH TIME ZONE,
  "expiryDate"          TIMESTAMP WITH TIME ZONE,
  "status"              TEXT        NOT NULL DEFAULT 'pending_review',
  "adminNote"           TEXT,
  "rejectionReason"     TEXT,
  "verifiedByAdminId"   TEXT        REFERENCES "User"("id") ON DELETE SET NULL,
  "verifiedAt"          TIMESTAMP WITH TIME ZONE,
  "createdAt"           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indices for fast driver and status lookups
CREATE INDEX IF NOT EXISTS "DriverComplianceDocument_driverId_idx"
  ON "DriverComplianceDocument" ("driverId");

CREATE INDEX IF NOT EXISTS "DriverComplianceDocument_status_idx"
  ON "DriverComplianceDocument" ("status");

-- Auto-update updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW."updatedAt" = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_compliance_doc_updated_at ON "DriverComplianceDocument";
CREATE TRIGGER update_compliance_doc_updated_at
  BEFORE UPDATE ON "DriverComplianceDocument"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
