
-- Finance Automation Triggers
-- Automates the creation of commission records when an application is enrolled

-- 1. Function to handle commission creation on enrollment
CREATE OR REPLACE FUNCTION fn_on_application_enrolled()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if status changed to 'enrolled'
    IF (NEW.status = 'enrolled' AND OLD.status != 'enrolled') THEN
        -- Only create if commission_amount > 0 and no record exists
        IF (NEW.commission_amount > 0) THEN
            INSERT INTO commissions (
                application_id,
                freelancer_id,
                amount,
                status,
                notes
            )
            VALUES (
                NEW.id,
                NEW.freelancer_id, -- Need to ensure freelancer_id is on applications or get from student
                NEW.commission_amount,
                'pending',
                'Auto-generated on enrollment'
            )
            ON CONFLICT (application_id) DO NOTHING; -- Assuming application_id unique in commissions
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger for application status change
-- Wait, I need to check if 'freelancer_id' is directly on applications or if I need to JOIN students
-- In the current schema (20240310), applications has no freelancer_id. It's on students.
-- Let's fix the function to fetch freelancer_id from student.

CREATE OR REPLACE FUNCTION fn_on_application_enrolled_v2()
RETURNS TRIGGER AS $$
DECLARE
    v_freelancer_id UUID;
BEGIN
    -- Get freelancer_id from students table
    SELECT freelancer_id INTO v_freelancer_id FROM students WHERE id = NEW.student_id;

    IF (NEW.status = 'enrolled' AND (OLD.status IS NULL OR OLD.status != 'enrolled')) THEN
        IF (NEW.commission_amount > 0) THEN
            -- Check if commission already exists
            IF NOT EXISTS (SELECT 1 FROM commissions WHERE application_id = NEW.id) THEN
                INSERT INTO commissions (
                    application_id,
                    freelancer_id,
                    amount,
                    status,
                    notes
                )
                VALUES (
                    NEW.id,
                    v_freelancer_id,
                    NEW.commission_amount,
                    'pending',
                    'Auto-generated on enrollment'
                );
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Trigger
DROP TRIGGER IF EXISTS trg_application_finance_sync ON applications;
CREATE TRIGGER trg_application_finance_sync
    AFTER UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION fn_on_application_enrolled_v2();

-- 4. Ensure application_id is unique in commissions for this logic
ALTER TABLE commissions ADD CONSTRAINT unq_commission_application UNIQUE (application_id);
