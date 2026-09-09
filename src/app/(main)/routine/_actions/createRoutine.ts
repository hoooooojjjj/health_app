'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { CreateRoutineActionState } from '../types'
import { validateCreateRoutineInput } from '../_utils/validation'

export async function createRoutine(
  _previousState: CreateRoutineActionState,
  formData: FormData
): Promise<CreateRoutineActionState> {
  const validation = validateCreateRoutineInput(formData)

  if (!validation.success) {
    return validation.state
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      status: 'error',
      message: '로그인 정보가 만료되었습니다. 다시 로그인해 주세요.',
    }
  }

  const { data: routineId, error } = await supabase.rpc('create_routine_with_exercises', {
    p_name: validation.data.name,
    p_exercise_ids: validation.data.exerciseIds,
  })

  if (error || typeof routineId !== 'string') {
    return {
      status: 'error',
      message: '루틴을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    }
  }

  revalidatePath('/routine')
  redirect(`/routine/${routineId}`)
}
