-- Step 10a — viability schema baseline changes
-- Per phase-2-implementation-plan.md §3 Step 10
-- Per pre-extraction-punch-list.md §2 (dead super_admin policy) + §3 (unused is_project_owner_check)
-- Per Q1-Q7-Decisions.md Q2 (business_id linkage)
-- Per phase-2.5-hub-viability-spec.md §6.2 (archived_at) + §7 (archive RLS)
--
-- Pre-apply drift check (executed 2026-05-09): all 6 expected states matched.
-- Backup gate: logical backup of business_scenarios, collaborators,
-- project_invites, project_content_uploads taken via Supabase dashboard
-- prior to apply.

-- 1. DROP dead super_admin policy on business_scenarios
-- Punch-list §2: 0 super_admin rows in platform_roles → policy is permanent no-op
DROP POLICY "Super users can read all business scenarios" ON business_scenarios;

-- 2. DROP unused is_project_owner_check overloads
-- Punch-list §3: no pg_policies row references either function; no src/ code references them
DROP FUNCTION IF EXISTS is_project_owner_check(uuid);
DROP FUNCTION IF EXISTS is_project_owner_check(uuid, uuid);

-- 3. ADD business_id column for Q2 viability ↔ 360 business linkage
-- ON DELETE SET NULL so deleting a 360 business does not cascade-delete
-- historical viability assessments — they remain accessible standalone.
ALTER TABLE business_scenarios
  ADD COLUMN business_id uuid REFERENCES businesses(id) ON DELETE SET NULL;
CREATE INDEX idx_business_scenarios_business_id
  ON business_scenarios(business_id) WHERE business_id IS NOT NULL;

-- 4. (Phase 2.5 bundle) ADD archived_at column for archive UI
-- Phase-2.5 spec §6.2: partial index optimised for the default
-- "Active assessments" list query (business_id, updated_at DESC).
ALTER TABLE business_scenarios
  ADD COLUMN archived_at timestamptz;
CREATE INDEX idx_business_scenarios_business_active
  ON business_scenarios(business_id, updated_at DESC) WHERE archived_at IS NULL;

-- 5. (Phase 2.5 bundle) Archive RLS policies on business_scenarios
-- Phase-2.5 spec §7.2-§7.3: business members of business_id can SELECT;
-- business owners/admins can UPDATE (archive/unarchive) and DELETE.
-- Policies are ADDITIVE — existing user_id and collaborator policies
-- continue to work via OR semantics across multiple matching policies.

CREATE POLICY "Business members can view linked assessments"
  ON business_scenarios
  FOR SELECT
  TO authenticated
  USING (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM business_memberships
      WHERE business_memberships.business_id = business_scenarios.business_id
        AND business_memberships.user_id = (SELECT auth.uid())
        AND business_memberships.is_active = true
    )
  );

CREATE POLICY "Business owners can update linked assessments"
  ON business_scenarios
  FOR UPDATE
  TO authenticated
  USING (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM business_memberships
      WHERE business_memberships.business_id = business_scenarios.business_id
        AND business_memberships.user_id = (SELECT auth.uid())
        AND business_memberships.is_active = true
        AND business_memberships.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Business owners can delete linked assessments"
  ON business_scenarios
  FOR DELETE
  TO authenticated
  USING (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM business_memberships
      WHERE business_memberships.business_id = business_scenarios.business_id
        AND business_memberships.user_id = (SELECT auth.uid())
        AND business_memberships.is_active = true
        AND business_memberships.role IN ('owner', 'admin')
    )
  );

-- 6. (Phase 2.5 bundle) project_content_uploads parity
-- Phase-2.5 spec §7.4: business members can also read uploads for linked
-- assessments (SELECT only — uploads are not edited inside 360, only viewed).
CREATE POLICY "Business members can view uploads of linked assessments"
  ON project_content_uploads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_scenarios
      WHERE business_scenarios.id = project_content_uploads.project_id
        AND business_scenarios.business_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM business_memberships
          WHERE business_memberships.business_id = business_scenarios.business_id
            AND business_memberships.user_id = (SELECT auth.uid())
            AND business_memberships.is_active = true
        )
    )
  );
