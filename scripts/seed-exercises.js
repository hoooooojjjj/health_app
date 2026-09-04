import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

// ES Module __dirname 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env.local을 우선 적용하고, 누락된 값은 .env에서 불러옵니다.
dotenv.config({
  path: [
    path.join(__dirname, '..', '.env.local'),
    path.join(__dirname, '..', '.env'),
  ].filter((envPath) => fs.existsSync(envPath)),
});

// 환경 변수에서 API 키를 읽습니다. (없으면 에러)
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('❌ 에러: ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다. .env.local에 추가해주세요.');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey });
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

// 파일 경로 설정
const RAW_FILE_PATH = path.join(__dirname, 'raw_exercises.json');
const OUTPUT_FILE_PATH = path.join(__dirname, 'translated_exercises.json');

// 유틸리티: 대기 시간(Delay)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 근육군/장비 정규화 데이터 정의
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

// CLI 인자 파싱
function parseArgs() {
  const args = process.argv.slice(2);
  let limit = 1000; // 기본 처리 개수 (거의 무제한)
  let delayMs = 5000; // 기본 대기 시간 5초 (Rate Limit 방어용)

  args.forEach((arg) => {
    if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--delay=')) {
      delayMs = parseInt(arg.split('=')[1], 10);
    }
  });

  return { limit, delayMs };
}

// 번역/정제 프롬프트 생성
function buildPrompt(exercise) {
  return `
다음 영문 피트니스 운동 정보를 분석하여 한국어 앱의 마스터 데이터에 맞게 의학적, 생리학적으로 매우 상세하고 정교하게 가공해 주세요.
결과는 반드시 JSON 형식으로만 반환해야 합니다. 다른 말은 절대 덧붙이지 마세요.

[사용자 신체 제약 조건 (safety_tips 반영용)]
- 요추 디스크(추간판 탈출증) 있음: 척추 수직 압박(Compression) 및 과신전(Extension) 극도로 주의.
- 왼쪽 어깨 불균형 및 가동성 부족: 상완골 외회전 제약, 어깨 찝힘(충돌 증후군) 발생 가능성 높음.
- 키 183cm, 긴 팔다리(Reach): 긴 가동 범위로 인한 관절 부하 증가 우려.

[원본 데이터]
- Name: ${exercise.name}
- Muscle Group: ${exercise.muscleGroup}
- Equipment: ${exercise.equipment}
- Instructions: ${exercise.instructions}

[응답 JSON 스키마 조건]
{
  "name": "운동의 자연스러운 한국어 명칭 (ex: 바벨 벤치 프레스)",
  "original_name": "${exercise.name}",
  "target_muscle": "주동근 (UPPER_CHEST, MID_CHEST, LOWER_CHEST, LATS, UPPER_BACK, LOWER_BACK, FRONT_SHOULDER, LATERAL_SHOULDER, REAR_SHOULDER, QUADS, HAMSTRINGS, GLUTES, CALVES, BICEPS, TRICEPS, FOREARMS, ABS, OBLIQUES 중 가장 적절한 것 1개 선택)",
  "synergist_muscles": ["협응근 배열 (위와 동일한 대문자 Enum 값 중 매핑)"],
  "equipment_type": "DUMBBELL, BARBELL, MACHINE, CABLE, BODYWEIGHT, ASSISTED 중 1개로 매핑",
  "weight_multiplier": 덤벨이면 2.0, 그 외 바벨/머신/케이블은 1.0. 맨몸/어시스트면 1.0,
  "is_unilateral": "한쪽씩 진행하는 운동(One Arm, Single Leg 등)이면 true, 아니면 false",
  "spinal_compression_level": "요추 압박 또는 허리 과신전 위험도 (0: 없음, 1: 보통, 2: 높음. 바벨 스쿼트, 데드리프트, 바벨 로우, 싯업 등 허리 굴곡/압박이 크면 2)",
  "shoulder_impingement_risk": "어깨 찝힘(충돌) 위험도 (업라이트 로우, 비하인드 넥 프레스, 과도한 내회전이 가해지는 운동 등은 true, 아니면 false)",
  "posture_guide": "일반인 기준 정석 자세 가이드입니다. 반드시 '1. [준비 자세]\\n2. [수행 동작]\\n3. [마무리]\\n' 포맷으로 작성하되, 각 단계별로 딱 1~2문장의 핵심만 짧고 직관적으로 작성해 주세요. (총 150자 내외로 매우 컴팩트하게 제한)",
  "safety_tips": "요추 디스크(허리 압박/굴곡), 왼쪽 어깨(찝힘), 긴 리치 조건에 맞는 핵심 부상 경고와 대처법만 부위별로 1문장씩 요약하여 서술해 주세요. 쓸데없이 길거나 전문적인 해부학 분석은 배제하고, 마지막 줄에 가장 적절한 대체 운동 1개만 추천하세요. (전체 250자 내외로 핵심만 강력히 요약 제한)"
}`;
}

async function main() {
  const { limit, delayMs } = parseArgs();
  console.log(`🚀 [시작] 번역 프로세스 시작 (목표 갯수: ${limit}개 / 딜레이: ${delayMs}ms)`);

  // 1. 원본 데이터 로드
  if (!fs.existsSync(RAW_FILE_PATH)) {
    console.error('❌ 원본 데이터 파일이 없습니다:', RAW_FILE_PATH);
    process.exit(1);
  }
  const rawData = JSON.parse(fs.readFileSync(RAW_FILE_PATH, 'utf-8'));

  // 2. 기존 진행 상황 로드 (Resumable 로직)
  let translatedData = [];
  let processedNames = new Set();

  if (fs.existsSync(OUTPUT_FILE_PATH)) {
    try {
      translatedData = JSON.parse(fs.readFileSync(OUTPUT_FILE_PATH, 'utf-8'));
      translatedData.forEach((item) => processedNames.add(item.original_name));
      console.log(`✅ 기존 번역된 데이터 로드 완료: ${translatedData.length}개 항목 확인.`);
    } catch (e) {
      console.warn('⚠️ 출력 파일 파싱 에러 (새로 시작합니다):', e.message);
    }
  }

  // 3. 번역 루프
  let processedCount = 0;

  for (const exercise of rawData) {
    if (processedCount >= limit) {
      console.log(`\n🛑 지정된 목표 갯수(${limit}개) 도달. 루프를 종료합니다.`);
      break;
    }

    // 이미 처리된 항목 건너뛰기
    if (processedNames.has(exercise.name)) {
      continue;
    }

    console.log(`\n⏳ 처리 중: [${exercise.name}]...`);

    try {
      const prompt = buildPrompt(exercise);
      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        system: "반드시 JSON 형식으로만 응답해야 합니다. 다른 말은 절대 덧붙이지 마세요.",
        messages: [{ role: 'user', content: prompt }]
      });
      const responseText = response.content[0].text;
      
      // JSON 파싱 시도 (마크다운 백틱 코드블록이 존재한다면 제거)
      let cleanText = responseText.trim();
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      }

      let parsedItem;
      try {
        parsedItem = JSON.parse(cleanText);
      } catch (err) {
        console.error(`❌ [${exercise.name}] JSON 파싱 실패. 응답 전문:`, responseText);
        // 에러가 나도 스크립트가 죽지 않도록 continue 처리
        continue;
      }

      // JSON 데이터 정규화 적용
      parsedItem.target_muscle = normalizeMuscle(parsedItem.target_muscle) || 'ABS';
      
      const rawSynergists = Array.isArray(parsedItem.synergist_muscles) ? parsedItem.synergist_muscles : [];
      const cleanSynergists = new Set();
      rawSynergists.forEach(m => {
        const norm = normalizeMuscle(m);
        if (norm && norm !== parsedItem.target_muscle) {
          cleanSynergists.add(norm);
        }
      });
      parsedItem.synergist_muscles = Array.from(cleanSynergists);
      parsedItem.equipment_type = normalizeEquipment(parsedItem.equipment_type);

      // 번역할 필요가 없는 이미지/GIF 절대 URL은 직접 병합합니다.
      parsedItem.gif_url = exercise.gif_url || '';
      parsedItem.image = exercise.image || '';

      // 결과 배열에 추가 및 로컬 파일에 즉시 쓰기 (세이브 포인트)
      translatedData.push(parsedItem);
      processedNames.add(exercise.name);
      fs.writeFileSync(OUTPUT_FILE_PATH, JSON.stringify(translatedData, null, 2), 'utf-8');

      console.log(`✅ 완료: [${parsedItem.name}] (장비: ${parsedItem.equipment_type})`);
      processedCount++;

      // Rate Limit 대기
      if (processedCount < limit) {
        console.log(`⏱️ API Rate Limit 보호를 위해 ${delayMs / 1000}초 대기합니다...`);
        await sleep(delayMs);
      }

    } catch (error) {
      console.error(`💥 [${exercise.name}] AI 요청 중 에러 발생:`, error.message);
      console.log('API 에러로 인해 잠시 추가 대기(10초) 후 진행합니다.');
      await sleep(10000);
    }
  }

  console.log(`\n🎉 프로세스 종료. 총 ${translatedData.length}개의 마스터 데이터가 누적 저장되었습니다.`);
  console.log(`👉 결과물 경로: ${OUTPUT_FILE_PATH}`);
}

main();
