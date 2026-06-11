-- 1. 근육 부위 Enum
CREATE TYPE muscle_group_enum AS ENUM (
    'UPPER_CHEST', 'MID_CHEST', 'LOWER_CHEST', 
    'LATS', 'UPPER_BACK', 'LOWER_BACK', 
    'FRONT_SHOULDER', 'LATERAL_SHOULDER', 'REAR_SHOULDER', 
    'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 
    'BICEPS', 'TRICEPS', 'FOREARMS', 
    'ABS', 'OBLIQUES'
);

-- 2. 장비 타입 Enum
CREATE TYPE equipment_type_enum AS ENUM ('DUMBBELL', 'BARBELL', 'MACHINE', 'CABLE', 'BODYWEIGHT', 'ASSISTED');

-- 3. Exercises 테이블 생성
CREATE TABLE exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,                         -- 운동명 (한국어)
    original_name TEXT NOT NULL UNIQUE,         -- 번역 전 영문명 (중복 체크용)
    target_muscle muscle_group_enum NOT NULL,   -- 주동근 (Enum)
    synergist_muscles muscle_group_enum[] DEFAULT '{}', -- 협응근 배열 (Enum 배열)
    equipment_type equipment_type_enum NOT NULL,-- 장비 종류
    weight_multiplier NUMERIC DEFAULT 1.0,      -- 무게 곱셈 상수 (덤벨은 2.0 등)
    is_unilateral BOOLEAN DEFAULT FALSE,        -- 편측성 여부
    posture_guide TEXT,                         -- 자세 가이드
    safety_tips TEXT,                           -- 안전 주의사항
    spinal_compression_level INTEGER DEFAULT 0, -- 0: 없음, 1: 보통, 2: 높음
    shoulder_impingement_risk BOOLEAN DEFAULT FALSE, -- 어깨 찝힘 위험 여부
    images TEXT[] DEFAULT '{}',                 -- 자세 이미지 URL 리스트 (기존)
    gif_url TEXT,                               -- 움직이는 가이드 GIF URL (추가)
    image TEXT,                                 -- 정적 대표 이미지 URL (추가)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS 정책 설정 (읽기는 모두 가능, 쓰기는 서비스 롤만)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON exercises FOR SELECT USING (true);
