# 🗃️ 운동 마스터 데이터베이스 명세서 (Master Data Spec)

이 문서는 요추 디스크 주의 및 어깨 불균형을 겪는 사용자 맞춤형 트레이닝과 가동범위 추적을 위해 구축된 **운동 마스터 데이터베이스(Master Database)**의 상세 설계 및 구축 운영 명세서입니다.

---

## 📌 1. 개요 및 데이터 소스

*   **구축 목적**: 부상 방지 궤적 설계, 신체 제약에 따른 운동 실시간 필터링 및 동적 대체 운동 추천을 위한 기틀 마련.
*   **원본 데이터 소스**: `hasaneyldrm/exercises-dataset` (ExerciseDB 기반 오픈소스 데이터셋)
*   **확보 데이터 수**: 총 **1,324개** 운동
*   **미디어 자산**: 운동별 정석 동작을 구현한 **움직이는 GIF 가이드** 및 **대표 썸네일 이미지** 절대 주소 연동 (GitHub CDN 호스팅 활용)

---

## 🗂️ 2. 데이터베이스 테이블 스키마 (`exercises`)

Supabase PostgreSQL에 반영되는 테이블 구조입니다.

| 컬럼명 | 데이터 타입 | Nullable | 기본값 | 설명 |
| :--- | :--- | :---: | :---: | :--- |
| **id** | `UUID` | N | `gen_random_uuid()` | 고유 식별자 (Primary Key) |
| **name** | `TEXT` | N | - | 자연스러운 한국어 운동 명칭 |
| **original_name** | `TEXT` | N | - | 번역 전 원본 영문명 (중복 체크용, UNIQUE) |
| **target_muscle** | `muscle_group_enum` | N | - | 운동의 주동근 (세부 Enum) |
| **synergist_muscles** | `muscle_group_enum[]` | Y | `'{}'` | 운동의 협응근 배열 (세부 Enum) |
| **equipment_type** | `equipment_type_enum` | N | - | 운동에 필요한 장비 종류 (Enum) |
| **weight_multiplier** | `NUMERIC` | Y | `1.0` | 덤벨 좌우 합산 및 무게 연산 비중 (덤벨은 2.0, 그 외 1.0) |
| **is_unilateral** | `BOOLEAN` | Y | `FALSE` | 한 팔/한 다리씩 따로 하는 편측성 운동 여부 |
| **posture_guide** | `TEXT` | Y | - | 일반 정석 자세 가이드 (**넘버링 및 줄바꿈 포함**) |
| **safety_tips** | `TEXT` | Y | - | **디스크/어깨/긴 리치 맞춤 부상 방지 팁 및 대체 운동** |
| **spinal_compression_level** | `INTEGER` | Y | `0` | 요추 수직 압박 및 굴곡 위험도 (0: 없음, 1: 보통, 2: 높음) |
| **shoulder_impingement_risk**| `BOOLEAN` | Y | `FALSE` | 어깨 찝힘(충돌 증후군) 위험도 여부 |
| **gif_url** | `TEXT` | Y | - | 움직이는 자세 GIF 가이드 절대 URL |
| **image** | `TEXT` | Y | - | 정적 대표 썸네일 이미지 절대 URL |
| **created_at** | `TIMESTAMPTZ` | Y | `now()` | 데이터 생성 시간 |

---

## 🏷️ 3. Enum (열거형) 규격 정의

### 1) 세부 근육군 Enum (`muscle_group_enum`)
정밀한 트레이닝 알고리즘 및 3분할 스위칭을 위해 18개 근육군으로 세분화합니다.

```sql
CREATE TYPE muscle_group_enum AS ENUM (
    'UPPER_CHEST', 'MID_CHEST', 'LOWER_CHEST',        -- 가슴 상/중/하
    'LATS', 'UPPER_BACK', 'LOWER_BACK',               -- 광배, 상부 등, 척추기립근(하부 등)
    'FRONT_SHOULDER', 'LATERAL_SHOULDER', 'REAR_SHOULDER', -- 어깨 전/측/후면
    'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES',        -- 대퇴사두, 햄스트링, 둔근, 종아리
    'BICEPS', 'TRICEPS', 'FOREARMS',                  -- 이두, 삼두, 전완근
    'ABS', 'OBLIQUES'                                 -- 복직근, 외복사근(옆구리)
);
```

### 2) 장비 Enum (`equipment_type_enum`)
```sql
CREATE TYPE equipment_type_enum AS ENUM (
    'DUMBBELL', 'BARBELL', 'MACHINE', 'CABLE', 'BODYWEIGHT', 'ASSISTED'
);
```

---

## 🤖 4. AI 변환 및 포맷팅 규칙

Gemini 2.5 Flash가 원본 텍스트를 정제할 때 따르는 엄격한 가이드라인입니다.

1.  **줄바꿈 문자 이스케이프 (`\n`)**:
    *   앱 UI 렌더링을 고려하여, 문장 및 단계가 넘어갈 때 실제 줄바꿈 대신 반드시 명시적인 **`\n` 이스케이프 기호**가 JSON에 주입되도록 프롬프트를 설계했습니다.
2.  **`posture_guide` (정석 가이드)**:
    *   일반인 기준 정석 자세를 설명하며, 반드시 **넘버링 포맷(`1. [준비]\n2. [진행]\n3. [마무리]\n`)**으로 세분화합니다. 여기에는 개인 맞춤 경고는 배제하여 범용성을 지킵니다.
3.  **`safety_tips` (사용자 맞춤 주의사항)**:
    *   오직 사용자의 신체 조건(요추 디스크 환자, 왼쪽 어깨 가동성 부족, 183cm의 긴 팔다리)에 따른 실전 리스크와 대처 방안을 매핑합니다.
    *   해당 운동이 디스크/어깨에 너무 치명적일 경우, 이를 대체할 수 있는 구체적인 안전 운동 목록(ex: `"대체 운동: 플랭크, 데드버그, 버드독"`)을 마지막에 반드시 서술합니다.

---

## 🏃 5. 데이터 가공 스크립트 실행 및 관리

모든 스크립트는 프로젝트의 `/scripts` 폴더 내에 위치합니다.

### 1) 원본 데이터 수집 및 전처리
```bash
node scripts/fetch_raw_data.js
```
*   `hasaneyldrm/exercises-dataset`에서 1,324개 원본을 긁어와 이미지/GIF 주소를 절대 경로로 변환한 뒤 `scripts/raw_exercises.json`에 임시 세이브합니다.

### 2) AI 번역 및 마스터 데이터 빌드 (Claude 연동)
```bash
node scripts/seed-exercises.js --delay=100
```
*   **옵션**: 
    *   `--delay=100` (추천): 유료 크레딧을 연동하여 빠르게 돌릴 때 딜레이를 단축해 15분 만에 완성합니다.
    *   `--limit=N`: 디버깅용으로 N개만 번역하고 종료하고 싶을 때 사용합니다.
*   **Resumable (재개 가능)**: 번역 도중 끊기더라도 다시 실행하면 `scripts/translated_exercises.json`에 이미 기록된 운동들은 자동으로 필터링 및 건너뛰기 처리하여 API 할당량을 보호합니다.

### 3) 가공 완료된 데이터를 Supabase DB에 적재
```bash
node scripts/upload-to-supabase.js
```
*   **사전 요구사항**: RLS(행 레벨 보안)를 안전하게 우회하여 데이터를 일괄 갱신(Upsert)하기 위해, `.env.local` 파일에 Supabase 관리자 권한 키(`SUPABASE_SERVICE_ROLE_KEY`)를 등록해주어야 작동합니다.
*   **중복 방지**: `original_name`이 겹치는 경우 기존 데이터를 덮어쓰기(Upsert)하여 중복 삽입 없이 안전하게 여러 번 반복 실행할 수 있습니다.
