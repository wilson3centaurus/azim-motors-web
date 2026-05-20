-- ============================================================
-- AZIM MOTORS - Migration 007: Test Admin User
-- Run this in Supabase SQL Editor to create a test login.
-- Credentials: admin@admin.com / 123
-- ============================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if test user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@admin.com';

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@admin.com',
      crypt('123', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Test Admin"}',
      false, '', '', '', ''
    );
  ELSE
    -- Reset password in case it changed
    UPDATE auth.users
      SET encrypted_password = crypt('123', gen_salt('bf')), updated_at = now()
      WHERE id = v_user_id;
  END IF;

  -- Upsert profile as admin
  INSERT INTO azim_motors.user_profiles (id, full_name, role, is_active)
  VALUES (v_user_id, 'Test Admin', 'admin', true)
  ON CONFLICT (id) DO UPDATE SET role = 'admin', is_active = true;

END $$;
