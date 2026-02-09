-- =====================================================
-- Phase 3: Exported Reports Table
-- =====================================================
-- This migration creates the exported_reports table for storing
-- generated PDF journals, CSV exports, and date range summaries.
-- Includes sharing functionality with optional ticker obfuscation.
-- Includes RLS policies for user isolation.
-- =====================================================

-- Create exported_reports table
CREATE TABLE IF NOT EXISTS exported_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK (report_type IN ('pdf_journal', 'csv_export', 'date_range_summary')),
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    filters JSONB, -- Stores any filters applied to the report (e.g., strategies, tickers)
    file_url TEXT, -- URL to the generated file in storage
    file_size_bytes INTEGER,
    is_public BOOLEAN DEFAULT FALSE, -- Whether the report can be accessed via share link
    share_token TEXT UNIQUE, -- Unique token for public sharing (nullable)
    obfuscate_tickers BOOLEAN DEFAULT FALSE, -- Whether to hide ticker symbols when sharing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Optional expiration for shared links
    download_count INTEGER DEFAULT 0 -- Track how many times the report has been downloaded
);

-- Create indexes for efficient lookups
CREATE INDEX idx_exported_reports_user ON exported_reports(user_id);
CREATE INDEX idx_exported_reports_token ON exported_reports(share_token);

-- Add table comment
COMMENT ON TABLE exported_reports IS 'Generated reports (PDFs, CSVs) with optional public sharing via token';

-- Add column comments
COMMENT ON COLUMN exported_reports.report_type IS 'Type of report: pdf_journal, csv_export, or date_range_summary';
COMMENT ON COLUMN exported_reports.date_range_start IS 'Start date of the reporting period';
COMMENT ON COLUMN exported_reports.date_range_end IS 'End date of the reporting period';
COMMENT ON COLUMN exported_reports.filters IS 'JSONB containing applied filters (strategies, tickers, tags, etc.)';
COMMENT ON COLUMN exported_reports.file_url IS 'Storage URL for the generated report file';
COMMENT ON COLUMN exported_reports.file_size_bytes IS 'File size in bytes';
COMMENT ON COLUMN exported_reports.is_public IS 'Whether the report is publicly accessible via share_token';
COMMENT ON COLUMN exported_reports.share_token IS 'Unique token for sharing report publicly';
COMMENT ON COLUMN exported_reports.obfuscate_tickers IS 'Whether to hide ticker symbols in shared reports';
COMMENT ON COLUMN exported_reports.expires_at IS 'Optional expiration timestamp for shared links';
COMMENT ON COLUMN exported_reports.download_count IS 'Number of times the report has been downloaded';

-- Enable Row Level Security
ALTER TABLE exported_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can SELECT their own reports
CREATE POLICY "Users can view their own exported reports"
    ON exported_reports
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Users can INSERT their own reports
CREATE POLICY "Users can create their own exported reports"
    ON exported_reports
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can UPDATE their own reports
CREATE POLICY "Users can update their own exported reports"
    ON exported_reports
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can DELETE their own reports
CREATE POLICY "Users can delete their own exported reports"
    ON exported_reports
    FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policy: Public access to reports via share_token
-- This allows unauthenticated users to view reports if they have the share token
CREATE POLICY "Public can view shared reports via token"
    ON exported_reports
    FOR SELECT
    USING (
        is_public = TRUE 
        AND share_token IS NOT NULL
        AND (expires_at IS NULL OR expires_at > NOW())
    );

-- Create function to generate unique share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
DECLARE
    token TEXT;
    done BOOLEAN := FALSE;
BEGIN
    WHILE NOT done LOOP
        -- Generate a random 32-character token
        token := encode(gen_random_bytes(24), 'base64');
        -- Remove URL-unsafe characters
        token := replace(replace(replace(token, '/', ''), '+', ''), '=', '');
        -- Check if token already exists
        done := NOT EXISTS (SELECT 1 FROM exported_reports WHERE share_token = token);
    END LOOP;
    RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-generate share_token when is_public is set to TRUE
CREATE OR REPLACE FUNCTION auto_generate_share_token()
RETURNS TRIGGER AS $$
BEGIN
    -- If is_public is TRUE and share_token is NULL, generate one
    IF NEW.is_public = TRUE AND NEW.share_token IS NULL THEN
        NEW.share_token := generate_share_token();
    END IF;
    -- If is_public is changed to FALSE, clear the share_token
    IF NEW.is_public = FALSE THEN
        NEW.share_token := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate share tokens
CREATE TRIGGER set_exported_reports_share_token
    BEFORE INSERT OR UPDATE ON exported_reports
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_share_token();
