ALTER TABLE vehicles DROP CONSTRAINT vehicles_body_style_check;

ALTER TABLE vehicles
    ADD CONSTRAINT vehicles_body_style_check
    CHECK (body_style IS NULL OR body_style IN ('sedan', 'suv', 'hatchback', 'pickup', 'minivan'));
