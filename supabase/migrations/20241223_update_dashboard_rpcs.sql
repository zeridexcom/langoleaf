-- Update dashboard statistics functions to use commissions table

-- 1. Update get_freelancer_stats to use commissions and better conversion logic
CREATE OR REPLACE FUNCTION get_freelancer_stats(freelancer_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalStudents', (
        SELECT COUNT(*) 
        FROM students 
        WHERE students.freelancer_id = get_freelancer_stats.freelancer_id
    ),
    'totalApplications', (
        SELECT COUNT(*) 
        FROM applications 
        WHERE applications.freelancer_id = get_freelancer_stats.freelancer_id
    ),
    'totalEarnings', (
        SELECT COALESCE(SUM(amount), 0) 
        FROM commissions 
        WHERE commissions.freelancer_id = get_freelancer_stats.freelancer_id 
        AND status = 'paid'
    ),
    'pendingApplications', (
        SELECT COUNT(*) 
        FROM applications 
        WHERE applications.freelancer_id = get_freelancer_stats.freelancer_id 
        AND status NOT IN ('draft', 'enrolled', 'rejected')
    ),
    'conversionRate', (
        CASE 
            WHEN (SELECT COUNT(*) FROM students WHERE students.freelancer_id = get_freelancer_stats.freelancer_id) > 0 
            THEN ROUND(
                (SELECT COUNT(*) FROM students WHERE students.freelancer_id = get_freelancer_stats.freelancer_id AND status = 'enrolled')::NUMERIC / 
                (SELECT COUNT(*) FROM students WHERE students.freelancer_id = get_freelancer_stats.freelancer_id)::NUMERIC * 100, 
                1
            )
            ELSE 0 
        END
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure total_earnings in profile is syncable (optional but good for performance)
CREATE OR REPLACE FUNCTION sync_profile_earnings()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles
    SET total_earnings = (
        SELECT COALESCE(SUM(amount), 0)
        FROM commissions
        WHERE freelancer_id = NEW.freelancer_id
        AND status = 'paid'
    )
    WHERE id = NEW.freelancer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_commission_paid ON commissions;
CREATE TRIGGER on_commission_paid
AFTER UPDATE OF status ON commissions
FOR EACH ROW
WHEN (NEW.status = 'paid')
EXECUTE FUNCTION sync_profile_earnings();
