import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// ES Module __dirname 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 최상위 .env.local 또는 .env 로드
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// RLS(행 레벨 보안)를 우회하여 일괄 삽입하기 위해 service_role 키가 반드시 필요합니다.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 에러: Supabase 환경 변수가 부족합니다.');
  console.log('\n💡 [해결 방법]');
  console.log('1. Supabase Dashboard > Project Settings > API 메뉴로 이동합니다.');
  console.log('2. "service_role" (secret) 키를 복사합니다.');
  console.log('3. .env.local 파일 하단에 아래와 같이 추가해 주세요:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=복사한_service_role_키_값\n');
  process.exit(1);
}

// Supabase 관리자 클라이언트 초기화 (RLS 우회)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const TRANSLATED_FILE_PATH = path.join(__dirname, 'translated_exercises.json');

async function uploadToSupabase() {
  console.log('🚀 Supabase 데이터 적재 프로세스를 시작합니다...');

  // 1. 번역된 파일 존재 여부 확인
  if (!fs.existsSync(TRANSLATED_FILE_PATH)) {
    console.error(`❌ 에러: 가공 완료된 파일이 존재하지 않습니다: ${TRANSLATED_FILE_PATH}`);
    console.log('먼저 node scripts/seed-exercises.js 스크립트를 완료해 주세요.');
    process.exit(1);
  }

  // 2. JSON 데이터 로드 및 컬럼 정제 (DB에 정의되지 않은 엉뚱한 컬럼 필터링 & 근육명 정규화)
  const VALID_MUSCLES = new Set([
    'UPPER_CHEST', 'MID_CHEST', 'LOWER_CHEST', 
    'LATS', 'UPPER_BACK', 'LOWER_BACK', 
    'FRONT_SHOULDER', 'LATERAL_SHOULDER', 'REAR_SHOULDER', 
    'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 
    'BICEPS', 'TRICEPS', 'FOREARMS', 
    'ABS', 'OBLIQUES',
    'TRAPEZIUS', 'HIP_FLEXORS', 'WRIST_EXTENSORS', 'WRIST_FLEXORS'
  ]);

  const MUSCLE_MAP = {
    'CHEST': 'MID_CHEST',
    'PECTORALIS_MAJOR': 'MID_CHEST',
    'PECTORALIS': 'MID_CHEST',
    'TRAPS': 'TRAPEZIUS',
    'MIDDLE_BACK': 'UPPER_BACK',
    'RHOMBOIDS': 'UPPER_BACK',
    'TERES_MAJOR': 'LATS',
    'BACK': 'UPPER_BACK',
    'SHOULDERS': 'LATERAL_SHOULDER',
    'SHOULDER': 'LATERAL_SHOULDER',
    'DELTOIDS': 'LATERAL_SHOULDER',
    'RECTUS_FEMORIS': 'HIP_FLEXORS',
    'ILIOPSEAS': 'HIP_FLEXORS',
    'TIBIALIS_ANTERIOR': 'CALVES',
    'SOLEUS': 'CALVES',
    'INNER_THIGH': 'QUADS',
    'ADDUCTORS': 'QUADS',
    'ABDUCTORS': 'GLUTES',
    'BRACHIALIS': 'BICEPS',
    'FOREARM': 'FOREARMS',
    'CORE': 'ABS',
    'TRANSVERSE_ABDOMINIS': 'ABS'
  };

  function normalizeMuscle(muscle) {
    if (!muscle) return null;
    const upper = muscle.toUpperCase().trim();
    if (VALID_MUSCLES.has(upper)) {
      return upper;
    }
    if (MUSCLE_MAP[upper]) {
      return MUSCLE_MAP[upper];
    }
    return null;
  }

  const VALID_EQUIPMENTS = new Set([
    'DUMBBELL', 'BARBELL', 'MACHINE', 'CABLE', 'BODYWEIGHT', 'ASSISTED', 'BAND', 'ROPE'
  ]);

  const EQUIPMENT_MAP = {
    'KETTLEBELL': 'DUMBBELL',
    'PLATE': 'BARBELL',
    'MEDICINE_BALL': 'BODYWEIGHT',
    'FITBALL': 'BODYWEIGHT',
    'STABILITY_BALL': 'BODYWEIGHT',
    'SLIDE_BOARD': 'BODYWEIGHT',
    'WHEEL_ROLLER': 'BODYWEIGHT'
  };

  function normalizeEquipment(eq) {
    if (!eq) return 'BODYWEIGHT';
    const upper = eq.toUpperCase().trim();
    if (VALID_EQUIPMENTS.has(upper)) {
      return upper;
    }
    if (EQUIPMENT_MAP[upper]) {
      return EQUIPMENT_MAP[upper];
    }
    return 'BODYWEIGHT';
  }

  let exercises = [];
  try {
    const rawData = fs.readFileSync(TRANSLATED_FILE_PATH, 'utf-8');
    const parsedData = JSON.parse(rawData);

    // 실제 PostgreSQL exercises 테이블의 정식 컬럼 리스트
    const ALLOWED_COLUMNS = [
      'name', 
      'original_name', 
      'target_muscle', 
      'synergist_muscles', 
      'equipment_type', 
      'weight_multiplier', 
      'is_unilateral', 
      'posture_guide', 
      'safety_tips', 
      'spinal_compression_level', 
      'shoulder_impingement_risk', 
      'gif_url', 
      'image'
    ];

    exercises = parsedData.map(item => {
      const cleanItem = {};
      ALLOWED_COLUMNS.forEach(col => {
        if (item[col] !== undefined) {
          if (col === 'target_muscle') {
            cleanItem[col] = normalizeMuscle(item[col]) || 'ABS'; // 기본값으로 ABS 지정 (에러방지)
          } else if (col === 'synergist_muscles') {
            const rawSynergists = Array.isArray(item[col]) ? item[col] : [];
            const cleanSynergists = new Set();
            rawSynergists.forEach(m => {
              const norm = normalizeMuscle(m);
              if (norm && norm !== cleanItem['target_muscle']) { // 주동근과 겹치지 않는 협응근만 추가
                cleanSynergists.add(norm);
              }
            });
            cleanItem[col] = Array.from(cleanSynergists);
          } else if (col === 'equipment_type') {
            cleanItem[col] = normalizeEquipment(item[col]);
          } else {
            cleanItem[col] = item[col];
          }
        }
      });
      return cleanItem;
    });

    // 중복 제거 (original_name 기준)
    const seenNames = new Set();
    const uniqueExercises = [];
    let dupCount = 0;
    exercises.forEach(item => {
      if (!seenNames.has(item.original_name)) {
        seenNames.add(item.original_name);
        uniqueExercises.push(item);
      } else {
        dupCount++;
      }
    });
    if (dupCount > 0) {
      console.log(`⚠️ 중복된 original_name ${dupCount}개 발견. 최초 1개씩만 적재 대상에 포함합니다.`);
    }
    exercises = uniqueExercises;

  } catch (error) {
    console.error('❌ 에러: JSON 파일을 읽거나 파싱하는 데 실패했습니다:', error.message);
    process.exit(1);
  }

  console.log(`📦 총 ${exercises.length}개의 운동 데이터를 Supabase로 전송할 준비를 마쳤습니다.`);

  // 3. 청크(Chunk) 단위로 쪼개어 업로드 (대용량 전송 안정성 확보)
  const CHUNK_SIZE = 100;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < exercises.length; i += CHUNK_SIZE) {
    const chunk = exercises.slice(i, i + CHUNK_SIZE);
    console.log(`\n📤 데이터 전송 중... (${i + 1} ~ ${Math.min(i + CHUNK_SIZE, exercises.length)}번째)`);

    try {
      // upsert를 사용하여 중복(original_name 기준)이 있을 경우 업데이트하고, 없으면 새로 삽입합니다.
      const { error } = await supabase
        .from('exercises')
        .upsert(chunk, { onConflict: 'original_name' });

      if (error) {
        throw error;
      }

      successCount += chunk.length;
      console.log(`✅ ${chunk.length}개 적재 성공.`);
    } catch (err) {
      console.error(`❌ 청크 업로드 실패 (인덱스 ${i}부터):`, err.message);
      failCount += chunk.length;
    }
  }

  console.log('\n==================================================');
  console.log('🎉 데이터 적재 결과 보고');
  console.log(`• 성공한 운동 수: ${successCount}개`);
  console.log(`• 실패한 운동 수: ${failCount}개`);
  console.log('==================================================');

  if (failCount === 0) {
    console.log('🏆 모든 운동 마스터 데이터베이스가 Supabase에 안전하게 구축되었습니다!');
  } else {
    console.log('⚠️ 일부 데이터 적재에 실패했습니다. 로그를 확인하고 다시 시도해 주세요.');
  }
}

uploadToSupabase();
