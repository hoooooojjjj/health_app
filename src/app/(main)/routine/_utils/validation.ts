import {
  ROUTINE_EXERCISE_MAX_COUNT,
  ROUTINE_NAME_MAX_LENGTH,
} from '../constants'
import type { CreateRoutineActionState } from '../types'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type ValidatedRoutineInput = {
  name: string
  exerciseIds: string[]
}

type ValidationResult =
  | { success: true; data: ValidatedRoutineInput }
  | { success: false; state: CreateRoutineActionState }

export function validateCreateRoutineInput(formData: FormData): ValidationResult {
  const nameValue = formData.get('name')
  const exerciseIdsValue = formData.get('exerciseIds')
  const name = typeof nameValue === 'string' ? nameValue.trim() : ''
  let exerciseIds: unknown = []

  if (typeof exerciseIdsValue === 'string') {
    try {
      exerciseIds = JSON.parse(exerciseIdsValue)
    } catch {
      exerciseIds = []
    }
  }

  const fieldErrors: NonNullable<CreateRoutineActionState['fieldErrors']> = {}

  if (!name) {
    fieldErrors.name = '루틴 이름을 입력해 주세요.'
  } else if (name.length > ROUTINE_NAME_MAX_LENGTH) {
    fieldErrors.name = `루틴 이름은 ${ROUTINE_NAME_MAX_LENGTH}자 이하로 입력해 주세요.`
  }

  if (!Array.isArray(exerciseIds) || exerciseIds.length === 0) {
    fieldErrors.exercises = '운동을 한 개 이상 추가해 주세요.'
  } else if (exerciseIds.length > ROUTINE_EXERCISE_MAX_COUNT) {
    fieldErrors.exercises = `운동은 최대 ${ROUTINE_EXERCISE_MAX_COUNT}개까지 추가할 수 있습니다.`
  } else if (!exerciseIds.every((id) => typeof id === 'string' && UUID_PATTERN.test(id))) {
    fieldErrors.exercises = '올바르지 않은 운동 정보가 포함되어 있습니다.'
  } else if (new Set(exerciseIds).size !== exerciseIds.length) {
    fieldErrors.exercises = '같은 운동을 중복해서 추가할 수 없습니다.'
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      state: {
        status: 'error',
        message: '입력 내용을 다시 확인해 주세요.',
        fieldErrors,
      },
    }
  }

  return {
    success: true,
    data: {
      name,
      exerciseIds: exerciseIds as string[],
    },
  }
}

export function isUuid(value: string) {
  return UUID_PATTERN.test(value)
}
