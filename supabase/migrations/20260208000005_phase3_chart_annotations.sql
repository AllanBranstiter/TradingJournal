-- =====================================================
-- Phase 3: Chart Annotations Table
-- =====================================================
-- This migration creates the chart_annotations table for storing
-- user-drawn annotations on trade charts (lines, arrows, shapes, text).
-- Includes RLS policies for user isolation.
-- =====================================================

-- Create chart_annotations table
CREATE TABLE IF NOT EXISTS chart_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    annotation_type TEXT NOT NULL CHECK (annotation_type IN ('line', 'arrow', 'rectangle', 'circle', 'text', 'freehand')),
    coordinates JSONB NOT NULL, -- Stores annotation geometry (points, bounds, etc.)
    color TEXT DEFAULT '#3b82f6', -- Hex color code for annotation
    text_content TEXT, -- Text for text-type annotations (nullable)
    line_style TEXT DEFAULT 'solid' CHECK (line_style IN ('solid', 'dashed', 'dotted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient trade-based lookups
CREATE INDEX idx_chart_annotations_trade ON chart_annotations(trade_id);

-- Add table comment
COMMENT ON TABLE chart_annotations IS 'User-drawn annotations on trade charts for marking key levels, patterns, and notes';

-- Add column comments
COMMENT ON COLUMN chart_annotations.annotation_type IS 'Type of annotation: line, arrow, rectangle, circle, text, or freehand';
COMMENT ON COLUMN chart_annotations.coordinates IS 'JSONB containing annotation geometry (e.g., start/end points, bounding box)';
COMMENT ON COLUMN chart_annotations.color IS 'Hex color code for the annotation';
COMMENT ON COLUMN chart_annotations.text_content IS 'Text content for text-type annotations';
COMMENT ON COLUMN chart_annotations.line_style IS 'Line style: solid, dashed, or dotted';

-- Enable Row Level Security
ALTER TABLE chart_annotations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can SELECT their own annotations
CREATE POLICY "Users can view their own chart annotations"
    ON chart_annotations
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Users can INSERT their own annotations
CREATE POLICY "Users can create their own chart annotations"
    ON chart_annotations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can UPDATE their own annotations
CREATE POLICY "Users can update their own chart annotations"
    ON chart_annotations
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can DELETE their own annotations
CREATE POLICY "Users can delete their own chart annotations"
    ON chart_annotations
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chart_annotations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at on modifications
CREATE TRIGGER set_chart_annotations_updated_at
    BEFORE UPDATE ON chart_annotations
    FOR EACH ROW
    EXECUTE FUNCTION update_chart_annotations_updated_at();
