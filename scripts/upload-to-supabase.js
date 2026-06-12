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

  // 2. JSON 데이터 로드
  let exercises = [];
  try {
    const rawData = fs.readFileSync(TRANSLATED_FILE_PATH, 'utf-8');
    exercises = JSON.parse(rawData);
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
