# 프리미엄 운동 기록 테스트 하네스 (Test Harness) 명세서

본 문서는 데이터 기반 프리미엄 운동 기록 앱을 위한 핵심 프론트엔드 기능(볼륨 계산 로직, 고급 운동 기록 UI, 백그라운드 세이프 스마트 타이머 확장, 캘린더 자정 교차 로직)에 대한 구조적 스펙을 문서화한 것입니다.

## 1. 볼륨 계산 공식 (Core Domain)
`src/utils/volumeCalc.ts`
운동의 실제 부하(Volume)를 계산하는 핵심 로직입니다.
- **기본 공식**: `Volume = weight * cleanReps * equipmentMultiplier`
- **장비 배수 (`equipmentMultiplier`)**:
  - `DUMBBELL`: 2.0 (양손 합산)
  - 기타 장비 (`BARBELL`, `MACHINE`, `CABLE` 등): 1.0
- **어시스트 머신 예외 (`ASSISTED`)**:
  - `Volume = (bodyWeight - weight) * cleanReps`
  - `bodyWeight`는 로그인된 전역 사용자 프로필(Session)에서 최신 체중 값을 참조합니다.

## 2. 고급 세트 기록 (Workout Session)
`src/components/WorkoutSession/`
운동 세트를 기록하는 핵심 UI 컴포넌트입니다.

* **듀얼 카운터 (Dual Counter)**:
  - `Clean Reps` (정자세 반복수 - 라임색 강조)와 `Dirty Reps` (치팅 반복수 - 붉은색 강조)를 별도의 Input으로 분리하여 입력받습니다.
* **플레이스홀더 자동화 (Placeholder Inheritance)**:
  - 새 운동을 시작할 때, 이전 세션의 마지막 기록을 기본값으로 불러옵니다.
  - 현재 세션에서 '세트 추가' 시, 직전 세트에 입력된 무게와 반복수를 플레이스홀더로 자동 표시합니다. (사용자가 빈칸으로 두고 체크박스를 누르면 플레이스홀더 값이 그대로 적용됩니다.)
* **Draft 자동 저장 (Auto-save)**:
  - 각 세트의 '완료(Checked)' 토글 시 `saveToLocalDraft()`를 호출하여 브라우저 로컬 저장소에 임시 저장(앱 크래시 대비).
* **화면 잠금 (Read-only)**:
  - 세트가 완료(Checked)되면 해당 행은 투명도가 낮아지며(Greyed out) `readOnly` 상태로 전환되어 실수로 인한 데이터 오염을 방지합니다.

## 3. 스마트 타이머 확장 (Rest Timer)
`src/components/RestTimer/`, `src/hooks/useRestTimer.ts`
기존에 구현된 백그라운드 세이프 로직(100ms 정밀도의 `targetEndTime` 기반 동기화)을 재사용하고 컨트롤을 확장합니다.

* **타이머 컨트롤 확장**:
  - `+30초`, `-10초` 시간 조절 기능 추가.
  - `Skip` (타이머 즉시 종료) 액션 추가.
* **부위별 동적 휴식 시간 (Dynamic Duration)**:
  - `MASTER_DATA`의 `muscle_group_enum`에 따라 휴식 시간을 자동 할당합니다.
  - 대근육(Chest, Back, Legs 등): 90초
  - 소근육(Arms, Calves 등): 60초

## 4. 캘린더 및 히스토리 (Workout Calendar)
`src/components/WorkoutCalendar/`
운동 내역을 조회하고 시각화하는 일간/월간 뷰입니다.

* **엄격한 자정 교차 그룹핑 (Midnight Crossover)**:
  - "밤 23:30 시작 ~ 새벽 01:00 종료" 세션은 `session_start_timestamp`(23:30)를 기준으로 반드시 전날(시작일)에 귀속됩니다.
  - 하루의 시작 기준 시간은 엄격한 자정(00:00)을 따릅니다. 새벽 01:30에 시작된 운동은 당일 운동으로 취급합니다.
* **근육군 별 도트 배지 (Dot Badges)**:
  - 캘린더 각 날짜 하단에 완료한 운동의 주동근에 따른 색상 배지를 표시합니다.
  - 예: 가슴(Push)=초록색, 등(Pull)=파란색.
* **일간 요약 모달 (Daily Summary Sheet)**:
  - 캘린더 날짜 클릭 시 Bottom Sheet 형태로 모달이 올라옵니다.
  - 표시 정보: 해당 날짜의 총 깔끔한 볼륨(Total Clean Volume) 및 수행한 운동 목록.
* **데이터 패치 최적화**:
  - 월 단위로 데이터를 쿼리하는 `fetchLogsByMonth(year, month)`를 통해 전체 DB 조회에 따른 성능 저하를 방지합니다.
