-- Import legacy cleaners into auth.users and public.profiles.
-- Source: cleaners_rows (2).sql from the other app.
-- Each cleaner gets: auth.users row (so they can sign in with existing password) and public.profiles with role=cleaner.
-- Placeholder email for most: <uuid>@cleaner-import.local (unique per user). Beaulla and Chrissy keep their real emails.
-- Run via: Supabase Dashboard → SQL Editor, or `supabase db push` / migration up.
-- Requires: at least one user already in auth.users (so we can read instance_id), or auth.instances populated.

-- Use existing instance_id from auth (required for auth.users).
DO $$
DECLARE
  _instance_id uuid;
  _aud text := 'authenticated';
  _role text := 'authenticated';
  _app_meta jsonb := '{"provider":"email","providers":["email"]}'::jsonb;
BEGIN
  SELECT instance_id INTO _instance_id FROM auth.users LIMIT 1;
  IF _instance_id IS NULL THEN
    SELECT id INTO _instance_id FROM auth.instances LIMIT 1;
  END IF;
  IF _instance_id IS NULL THEN
    RAISE EXCEPTION 'No auth.instance_id found. Ensure at least one user exists or auth.instances has a row.';
  END IF;

  -- Insert into auth.users (trigger will create profile with role from raw_user_meta_data).
  -- confirmed_at is a generated column in Supabase and must not be set.
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    raw_user_meta_data, raw_app_meta_data, created_at, updated_at
  )
  SELECT
    v.id,
    _instance_id,
    _aud,
    _role,
    (v.id::text || '@cleaner-import.local') AS email,
    v.password_hash,
    jsonb_build_object('name', v.name, 'email', v.id::text || '@cleaner-import.local', 'role', 'cleaner'),
    _app_meta,
    COALESCE(v.created_at, now()),
    COALESCE(v.updated_at, now())
  FROM (
    VALUES
      ('04d5ae12-5f78-464b-92c8-46d61df5b5cd'::uuid, 'Silibaziso Moyo', '', '+27845559202', '$2a$10$NSGukyJeIMDM2LXvaFjkHOoBYwduVvhh9uTKRYzrF8hUdwFTsZrpa', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-03-02 23:19:55.390404+00'::timestamptz),
      ('19e3eb27-5be0-4e8e-a654-e42d27586ada'::uuid, 'Natasha Magashito', '', '+27678316466', '$2a$10$1eU7EHDVizm5dmXBybM.Eeza3K3COZWxVB6jKnhLVmzLeZS/O.9WC', '2025-10-16 22:22:13.815891+00'::timestamptz, '2026-01-23 13:05:52.354525+00'::timestamptz),
      ('21c9ed33-7054-49af-b91a-396a40746a51'::uuid, 'Ngwira Madalitso', null, '+27680582573', '$2a$10$.6NarDx6CQIXs4uJ4xP1g.9zkaFQHLAw8KgYn3OapN2uMyabv2CXS', '2025-12-05 02:00:28.101478+00'::timestamptz, '2026-02-04 20:29:51.543222+00'::timestamptz),
      ('22304709-7c94-4d6b-b4bc-ed35e1c26fce'::uuid, 'Lucia Pazvakavambwa', '', '+27812736804', '$2a$10$3REWZwPMjFhiKR12n9NmFOt37cXpiDUSj/vgd1hox5EuanK1KqF7C', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-02-10 17:30:08.460769+00'::timestamptz),
      ('2231fa06-1ba5-43d6-bf2d-ca757368a05a'::uuid, 'Normatter Mazhinji', '', '+27742649775', '$2a$10$LdOp7Pk5PvbtvJjBOmDcQ.0oSr0IUKCPRImPj6gp0y1FntfLw3hsW', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-02-28 16:20:48.596701+00'::timestamptz),
      ('2a92664c-7e6c-4cbc-9d1b-6387f1c2b021'::uuid, 'Beaulla Chemugarira', '', '+27810768318', '$2a$10$PIliBblMAKKBK5pCjnrwl.0eiRqkXmZarKd8TFLD4wWMcslWzu2mK', '2025-10-19 12:45:52.990962+00'::timestamptz, '2026-01-16 15:19:32.736901+00'::timestamptz),
      ('2ba4ac8f-f271-4ce3-9811-58dbca218dc1'::uuid, 'Magaret Jiri', null, '+27658193061', '$2a$10$0OiDYu67OTGB7PFiIRn6x.5gQWoYAkr6XQIxt6KQQ9GgCR.0vtSpi', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-03-01 16:46:35.582169+00'::timestamptz),
      ('45427254-968d-4115-9285-b5f1b03010eb'::uuid, 'Princess Saidi', '', '+27738111327', '$2a$10$Ox8c1uIBv3jy.jZf9EWOEuXN6dXXjoqnhENx20AaE9D02PxQ5qM3a', '2025-11-07 18:25:30.82194+00'::timestamptz, '2026-02-10 18:02:37.412935+00'::timestamptz),
      ('53f7c0c0-684a-4cbe-aeec-8aa9758940c3'::uuid, 'Nicole James', '', '+27694069060', '$2a$10$Ilft/t28X7MET.3eeqTSX.xVTpKkcn2iWrzgB6zhrT7Fgisq779vK', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-02-04 19:55:09.539134+00'::timestamptz),
      ('555cf8fc-9669-4d86-8857-570fc667e3f0'::uuid, 'Emarald Nyamoto', '', '+27719382131', '$2a$10$OD4Eb.W3Nidk/8z7lRiXCOtJ3V7veDEjFHR7jJGFK5073rU1k6pQW', '2025-10-16 22:22:13.815891+00'::timestamptz, '2026-01-07 03:58:49.318311+00'::timestamptz),
      ('5d31128f-8508-40e7-b63f-b37ccb166cdf'::uuid, 'Sinikiwe Murire', null, '+27843640805', '$2a$10$A7JMs4ED1UUVjYZlF0DHDOQgMj4RRhyq3NKf2yNk/nS352h1E5.76', '2025-12-05 01:56:05.84902+00'::timestamptz, '2026-01-16 15:19:32.736901+00'::timestamptz),
      ('6fd4f144-92a8-44fd-bcd6-64005a5d0ba6'::uuid, 'Chrissy Roman', null, '+27752175328', '$2a$10$RSx8ckAiYgHkxzJe5WXjUeFmI/064h3jI2lRm8vOinblRd05uCMWm', '2025-12-05 02:04:43.018937+00'::timestamptz, '2026-01-07 03:58:49.318311+00'::timestamptz),
      ('72642f1a-4745-47e1-9a13-1edbb19b20d0'::uuid, 'Lucia Chiuta', '', '+27785567309', '$2a$10$vD83iT..y9XrlGEHfx4JBeg9yUK8a0kZYlKf7PjemClAU01oKRsx2', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-02-05 14:11:48.298929+00'::timestamptz),
      ('74ddb79f-8cdc-4483-954a-1e6d5ab562eb'::uuid, 'Ruvarashe Pazvakavambwa', '', '+27627958190', '$2a$10$EIOMawVmpAJixkttxgR09OAxzupFG3Mx1BF66WJN5TJZtTdxjpi6C', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-01-16 15:19:32.736901+00'::timestamptz),
      ('7590892c-6177-4efe-8c5f-7263b7bf19cd'::uuid, 'Tsungaimunashe Mbera', '', '+27699192765', '$2a$10$k8aJudooGV8ae/4mF/YOIu.Zxt3.YrIE07D69lUoyDuuxj1aff2Y2', '2025-10-16 22:22:13.815891+00'::timestamptz, '2026-02-20 00:48:38.141123+00'::timestamptz),
      ('796e3ad7-07f3-44eb-b4cf-bed439a59f8b'::uuid, 'Nyasha Mudani', '', '+27697567515', '$2a$10$4u89SOx7ibT3AzYtLhYmGOd6o/7l4uM61QelLkRi2FnvkoO2J6KeG', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-02-28 16:20:47.551674+00'::timestamptz),
      ('869b80b9-00e2-4b34-9e42-7b87d42b4aac'::uuid, 'Mary Mugari', null, '+27814857486', '$2a$10$t1MzFqfJvS78rcrvbgw3Ou.KVXRAE00PCi6gZcTsuGgf4FZP.Geva', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-01-16 15:19:32.736901+00'::timestamptz),
      ('8aabdbfb-1428-44d5-8ff9-7661a0b355aa'::uuid, 'Shyleen Pfende', '', '+27641940583', '$2a$10$K/EeoHBEBRJ9onxoHJDguuzI7GQJB48qjlciy2MnGhXtl4FnVkwxO', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-01-16 15:19:32.736901+00'::timestamptz),
      ('91068f7f-bb91-476f-ad73-ddfe376d5e4c'::uuid, 'Jacqueline Maphosa', '', '+27693893953', '$2a$10$tX/JSb0lPqq3p2O9fTO23OkfS7majHa/U/ueZ.Q081DFYhQnddFsG', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-01-07 03:58:49.318311+00'::timestamptz),
      ('914b3acf-40e8-4ad5-a5a2-9e2de711849a'::uuid, 'Ethel Chizombe', '', '+27743214943', '$2a$10$VRqI1TdedAY3b1SFRe8We.CcTSsl8g5ZRwWFYIdfw5B0Ftm2uOsYK', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-02-28 16:20:48.341729+00'::timestamptz),
      ('ac73ea99-48b3-4c30-9d6b-5a8beab40f33'::uuid, 'Mavis Thandeka Gurajena', '', '+27629474955', '$2a$10$eZdLOyBnVbr.pXSPmfq50O0qa7MluRQZbmusOJYmrtwjvP6Bg1EVu', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-02-24 04:41:52.970456+00'::timestamptz),
      ('b748ccf2-983e-43aa-9ab2-7ff27882fbe4'::uuid, 'Primrose Chinohamba', '', '+27815404023', '$2a$10$nVYhlW6a97TEPqnxpUf5JewoNSHts79ms7aY2vIbALfYllXcpdOi.', '2025-10-16 22:22:13.815891+00'::timestamptz, '2026-02-28 16:20:46.571596+00'::timestamptz),
      ('c0771cf5-3a83-4299-99ee-b0e399e8745f'::uuid, 'Mitchell Piyo', '', '+27607222189', '$2a$10$FU/FrEzgHX4eQgDYbpS7MeeZQNI/fD.0ARUy7Dqrfz6QhJIUkiY/S', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-02-28 16:20:47.963218+00'::timestamptz),
      ('d8a75570-4b3f-44bc-848a-ad9f33857c91'::uuid, 'Estery Phiri', '', '+27691445709', '$2a$10$.6cW9l5TUtRZpnqloH8EN.iEzJDWBhVI42Kd0T2rOoSRkum37WYK6', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-02-17 05:42:24.079718+00'::timestamptz),
      ('e7e2e61a-608d-4fc7-b7d7-865988039d4a'::uuid, 'Rutendo Shamba', '', '+27842676534', '$2a$10$88fwoph1T13/XIDSDr6o1O9AeKWdK10G4iLBbvmUX7jvDDn2i5aU2', '2025-10-16 22:22:13.815891+00'::timestamptz, '2026-02-15 14:21:40.39013+00'::timestamptz),
      ('f781f062-dbed-4a33-84eb-f3bef3493063'::uuid, 'Marvellous Muneri', null, '+27603634903', '$2a$10$LjUEg8Dew7rQXHT1GXYxhe/loEEG12Jbzq3T0mbdjU0i/KwGUXc.S', '2025-12-04 19:58:11.739+00'::timestamptz, '2026-02-04 20:36:32.913319+00'::timestamptz)
  ) AS v(id, name, photo_url, phone, password_hash, created_at, updated_at),
  LATERAL (
    SELECT
      CASE WHEN v.phone IS NOT NULL AND trim(v.phone) <> '' THEN v.id::text || '@cleaner-import.local' ELSE v.id::text || '@cleaner-import.local' END AS email
  ) AS e
  WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v.id);

  -- Fix email for the two cleaners who had email in the source.
  UPDATE auth.users u SET email = 'beaullachemugarira@gmail.com', raw_user_meta_data = raw_user_meta_data || '{"email":"beaullachemugarira@gmail.com"}'::jsonb WHERE u.id = '2a92664c-7e6c-4cbc-9d1b-6387f1c2b021'::uuid;
  UPDATE auth.users u SET email = 'jagadrey@gmail.com', raw_user_meta_data = raw_user_meta_data || '{"email":"jagadrey@gmail.com"}'::jsonb WHERE u.id = '6fd4f144-92a8-44fd-bcd6-64005a5d0ba6'::uuid;
  UPDATE public.profiles p SET email = 'beaullachemugarira@gmail.com' WHERE p.id = '2a92664c-7e6c-4cbc-9d1b-6387f1c2b021'::uuid;
  UPDATE public.profiles p SET email = 'jagadrey@gmail.com' WHERE p.id = '6fd4f144-92a8-44fd-bcd6-64005a5d0ba6'::uuid;
END $$;

-- Update profiles with phone, avatar (from photo_url), and timestamps from legacy data.
UPDATE public.profiles p SET
  phone = v.phone,
  avatar = NULLIF(trim(v.photo_url), ''),
  created_at = v.created_at,
  updated_at = v.updated_at
FROM (VALUES
  ('04d5ae12-5f78-464b-92c8-46d61df5b5cd'::uuid, '', '+27845559202', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-03-02 23:19:55.390404+00'::timestamptz),
  ('19e3eb27-5be0-4e8e-a654-e42d27586ada'::uuid, '', '+27678316466', '2025-10-16 22:22:13.815891+00'::timestamptz, '2026-01-23 13:05:52.354525+00'::timestamptz),
  ('21c9ed33-7054-49af-b91a-396a40746a51'::uuid, null, '+27680582573', '2025-12-05 02:00:28.101478+00'::timestamptz, '2026-02-04 20:29:51.543222+00'::timestamptz),
  ('22304709-7c94-4d6b-b4bc-ed35e1c26fce'::uuid, '', '+27812736804', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-02-10 17:30:08.460769+00'::timestamptz),
  ('2231fa06-1ba5-43d6-bf2d-ca757368a05a'::uuid, '', '+27742649775', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-02-28 16:20:48.596701+00'::timestamptz),
  ('2a92664c-7e6c-4cbc-9d1b-6387f1c2b021'::uuid, '', '+27810768318', '2025-10-19 12:45:52.990962+00'::timestamptz, '2026-01-16 15:19:32.736901+00'::timestamptz),
  ('2ba4ac8f-f271-4ce3-9811-58dbca218dc1'::uuid, null, '+27658193061', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-03-01 16:46:35.582169+00'::timestamptz),
  ('45427254-968d-4115-9285-b5f1b03010eb'::uuid, '', '+27738111327', '2025-11-07 18:25:30.82194+00'::timestamptz, '2026-02-10 18:02:37.412935+00'::timestamptz),
  ('53f7c0c0-684a-4cbe-aeec-8aa9758940c3'::uuid, '', '+27694069060', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-02-04 19:55:09.539134+00'::timestamptz),
  ('555cf8fc-9669-4d86-8857-570fc667e3f0'::uuid, '', '+27719382131', '2025-10-16 22:22:13.815891+00'::timestamptz, '2026-01-07 03:58:49.318311+00'::timestamptz),
  ('5d31128f-8508-40e7-b63f-b37ccb166cdf'::uuid, null, '+27843640805', '2025-12-05 01:56:05.84902+00'::timestamptz, '2026-01-16 15:19:32.736901+00'::timestamptz),
  ('6fd4f144-92a8-44fd-bcd6-64005a5d0ba6'::uuid, null, '+27752175328', '2025-12-05 02:04:43.018937+00'::timestamptz, '2026-01-07 03:58:49.318311+00'::timestamptz),
  ('72642f1a-4745-47e1-9a13-1edbb19b20d0'::uuid, '', '+27785567309', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-02-05 14:11:48.298929+00'::timestamptz),
  ('74ddb79f-8cdc-4483-954a-1e6d5ab562eb'::uuid, '', '+27627958190', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-01-16 15:19:32.736901+00'::timestamptz),
  ('7590892c-6177-4efe-8c5f-7263b7bf19cd'::uuid, '', '+27699192765', '2025-10-16 22:22:13.815891+00'::timestamptz, '2026-02-20 00:48:38.141123+00'::timestamptz),
  ('796e3ad7-07f3-44eb-b4cf-bed439a59f8b'::uuid, '', '+27697567515', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-02-28 16:20:47.551674+00'::timestamptz),
  ('869b80b9-00e2-4b34-9e42-7b87d42b4aac'::uuid, null, '+27814857486', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-01-16 15:19:32.736901+00'::timestamptz),
  ('8aabdbfb-1428-44d5-8ff9-7661a0b355aa'::uuid, '', '+27641940583', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-01-16 15:19:32.736901+00'::timestamptz),
  ('91068f7f-bb91-476f-ad73-ddfe376d5e4c'::uuid, '', '+27693893953', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-01-07 03:58:49.318311+00'::timestamptz),
  ('914b3acf-40e8-4ad5-a5a2-9e2de711849a'::uuid, '', '+27743214943', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-02-28 16:20:48.341729+00'::timestamptz),
  ('ac73ea99-48b3-4c30-9d6b-5a8beab40f33'::uuid, '', '+27629474955', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-02-24 04:41:52.970456+00'::timestamptz),
  ('b748ccf2-983e-43aa-9ab2-7ff27882fbe4'::uuid, '', '+27815404023', '2025-10-16 22:22:13.815891+00'::timestamptz, '2026-02-28 16:20:46.571596+00'::timestamptz),
  ('c0771cf5-3a83-4299-99ee-b0e399e8745f'::uuid, '', '+27607222189', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-02-28 16:20:47.963218+00'::timestamptz),
  ('d8a75570-4b3f-44bc-848a-ad9f33857c91'::uuid, '', '+27691445709', '2025-10-17 19:38:30.924719+00'::timestamptz, '2026-02-17 05:42:24.079718+00'::timestamptz),
  ('e7e2e61a-608d-4fc7-b7d7-865988039d4a'::uuid, '', '+27842676534', '2025-10-16 22:22:13.815891+00'::timestamptz, '2026-02-15 14:21:40.39013+00'::timestamptz),
  ('f781f062-dbed-4a33-84eb-f3bef3493063'::uuid, null, '+27603634903', '2025-12-04 19:58:11.739+00'::timestamptz, '2026-02-04 20:36:32.913319+00'::timestamptz)
) AS v(id, photo_url, phone, created_at, updated_at)
WHERE p.id = v.id AND p.role = 'cleaner';