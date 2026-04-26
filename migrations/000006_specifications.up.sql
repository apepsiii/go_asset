-- Add specifications JSON column to assets
ALTER TABLE assets ADD COLUMN specifications TEXT DEFAULT '{}';
