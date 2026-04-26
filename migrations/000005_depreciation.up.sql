-- Add depreciation tracking fields to assets
ALTER TABLE assets ADD COLUMN useful_life_years INTEGER DEFAULT 5;
ALTER TABLE assets ADD COLUMN salvage_value REAL DEFAULT 0;
