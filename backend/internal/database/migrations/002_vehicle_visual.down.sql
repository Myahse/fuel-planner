ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_paint_color_check;
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_body_style_check;
ALTER TABLE vehicles
    DROP COLUMN IF EXISTS body_style,
    DROP COLUMN IF EXISTS model_3d_url,
    DROP COLUMN IF EXISTS paint_color;
