ALTER TABLE vehicles
    ADD COLUMN paint_color TEXT,
    ADD COLUMN model_3d_url TEXT,
    ADD COLUMN body_style TEXT;

ALTER TABLE vehicles
    ADD CONSTRAINT vehicles_body_style_check
    CHECK (body_style IS NULL OR body_style IN ('sedan', 'suv', 'hatchback'));

ALTER TABLE vehicles
    ADD CONSTRAINT vehicles_paint_color_check
    CHECK (paint_color IS NULL OR paint_color ~ '^#[0-9A-Fa-f]{6}$');
