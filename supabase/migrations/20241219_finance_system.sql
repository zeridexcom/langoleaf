
-- Finance & Commission System Migration
-- This migration establishes the commissions and payouts tables

-- 1. Create commission_status type if not exists
DO $$ BEGIN
    CREATE TYPE commission_status AS ENUM (
        'not_applicable',
        'pending',
        'approved',
        'invoiced',
        'paid',
        'disputed'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status commission_status NOT NULL DEFAULT 'pending',
    invoice_number TEXT,
    payout_id UUID, -- Will be foreign key later
    notes TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create payouts table
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
    reference_number TEXT,
    notes TEXT,
    processed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Add payout_id foreign key to commissions
ALTER TABLE commissions ADD CONSTRAINT fk_commissions_payout FOREIGN KEY (payout_id) REFERENCES payouts(id) ON DELETE SET NULL;

-- 5. Enable RLS
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for Commissions
-- Freelancers can view their own commissions
CREATE POLICY "Freelancers can view own commissions"
    ON commissions FOR SELECT
    USING (freelancer_id = auth.uid());

-- Admins can view all commissions
CREATE POLICY "Admins can view all commissions"
    ON commissions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    ));

-- Admins can manage all commissions
CREATE POLICY "Admins can manage all commissions"
    ON commissions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    ));

-- 7. RLS Policies for Payouts
-- Freelancers can view their own payouts
CREATE POLICY "Freelancers can view own payouts"
    ON payouts FOR SELECT
    USING (freelancer_id = auth.uid());

-- Admins can manage all payouts
CREATE POLICY "Admins can manage all payouts"
    ON payouts FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    ));

-- 8. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_commissions_application ON commissions(application_id);
CREATE INDEX IF NOT EXISTS idx_commissions_freelancer ON commissions(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_payouts_freelancer ON payouts(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);

-- 9. Updated At Triggers
CREATE TRIGGER trg_commissions_timestamp BEFORE UPDATE ON commissions FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_payouts_timestamp BEFORE UPDATE ON payouts FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
