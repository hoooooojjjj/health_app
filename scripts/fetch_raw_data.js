import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 전 세계에서 가장 많이 쓰이는 오픈소스 피트니스 DB 덤프 URL (Free-Exercise-DB)
const DATA_URL = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json';
const OUTPUT_PATH = path.join(__dirname, 'raw_exercises.json');

async function fetchRawData() {
  console.log(`📥 [1/3] 오픈소스 데이터베이스에서 덤프 파일을 다운로드합니다...`);
  console.log(`🔗 URL: ${DATA_URL}`);
  
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    const rawData = await response.json();
    console.log(`✅ [2/3] 다운로드 완료! 총 ${rawData.length}개의 운동 데이터를 확보했습니다.`);
    
    // 데이터 맵핑 및 전처리 (우리의 LLM 프롬프트가 읽기 편한 구조로 정리)
    console.log(`⚙️ [3/3] 앱 스키마에 맞게 1차 전처리(필터링 및 정제)를 진행합니다...`);
    
    const processedData = rawData.map(ex => {
      // 상대경로를 GitHub Raw 절대 URL로 변환
      const gifUrl = ex.gif_url 
        ? `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/${ex.gif_url}`
        : '';
      const imageUrl = ex.image
        ? `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/${ex.image}`
        : '';

      return {
        name: ex.name,
        muscleGroup: ex.target || ex.body_part || 'Unknown',
        equipment: ex.equipment || 'body weight',
        // 영문 가이드 텍스트 추출 (객체 형태일 경우 en 사용)
        instructions: ex.instructions && ex.instructions.en
          ? ex.instructions.en
          : (ex.instruction_steps && Array.isArray(ex.instruction_steps.en)
              ? ex.instruction_steps.en.join(' ')
              : 'No instructions provided.'),
        gif_url: gifUrl,
        image: imageUrl
      };
    });
    
    // 가공된 데이터를 raw_exercises.json 파일로 덮어쓰기 저장
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(processedData, null, 2), 'utf-8');
    
    console.log(`🎉 모든 준비가 끝났습니다!`);
    console.log(`👉 저장 경로: ${OUTPUT_PATH}`);
    console.log(`\n💡 이제 다음 명령어를 실행하여 AI 번역 및 마스터 데이터 시딩을 시작하세요:`);
    console.log(`   node scripts/seed-exercises.js --limit=5 --delay=5000`);
    
  } catch (error) {
    console.error('❌ 데이터 패칭 중 에러 발생:', error.message);
  }
}

fetchRawData();
