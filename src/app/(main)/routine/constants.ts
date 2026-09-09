export const ROUTINE_NAME_MAX_LENGTH = 80
export const ROUTINE_EXERCISE_MAX_COUNT = 50
export const EXERCISE_SEARCH_LIMIT = 30

export const MUSCLE_LABELS: Record<string, string> = {
  UPPER_CHEST: '윗가슴',
  MID_CHEST: '가슴',
  LOWER_CHEST: '아랫가슴',
  LATS: '광배근',
  UPPER_BACK: '등 상부',
  LOWER_BACK: '허리',
  FRONT_SHOULDER: '전면 어깨',
  LATERAL_SHOULDER: '측면 어깨',
  REAR_SHOULDER: '후면 어깨',
  QUADS: '대퇴사두',
  HAMSTRINGS: '햄스트링',
  GLUTES: '둔근',
  CALVES: '종아리',
  BICEPS: '이두',
  TRICEPS: '삼두',
  FOREARMS: '전완',
  ABS: '복근',
  OBLIQUES: '복사근',
  TRAPEZIUS: '승모근',
  HIP_FLEXORS: '고관절 굴곡근',
  WRIST_EXTENSORS: '손목 신전근',
  WRIST_FLEXORS: '손목 굴곡근',
}

export const EQUIPMENT_LABELS: Record<string, string> = {
  DUMBBELL: '덤벨',
  BARBELL: '바벨',
  MACHINE: '머신',
  CABLE: '케이블',
  BODYWEIGHT: '맨몸',
  ASSISTED: '보조 기구',
  BAND: '밴드',
  ROPE: '로프',
}

export const MUSCLE_FILTER_OPTIONS = [
  { value: '', label: '전체 부위' },
  ...Object.entries(MUSCLE_LABELS).map(([value, label]) => ({ value, label })),
]
