import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type {
  ExerciseSummary,
  RoutineDetail,
  RoutineSummary,
} from '../types'

type ExerciseRow = {
  id: string
  name: string
  target_muscle: string
  equipment_type: string
  image: string | null
}

type RoutineExerciseRow = {
  position: number
  exercise: ExerciseRow | null
}

type RoutineRow = {
  id: string
  name: string
  created_at: string
  routine_exercises: RoutineExerciseRow[]
}

async function getAuthenticatedClient() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return { supabase, user }
}

function toExerciseSummary(row: ExerciseRow): ExerciseSummary {
  return {
    id: row.id,
    name: row.name,
    targetMuscle: row.target_muscle,
    equipmentType: row.equipment_type,
    imageUrl: row.image,
  }
}

export async function getUserRoutines(): Promise<RoutineSummary[]> {
  const { supabase, user } = await getAuthenticatedClient()
  const { data, error } = await supabase
    .from('routines')
    .select(`
      id,
      name,
      created_at,
      routine_exercises (
        position,
        exercise:exercises (
          id,
          name,
          target_muscle,
          equipment_type,
          image
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`루틴 목록을 불러오지 못했습니다: ${error.message}`)
  }

  return ((data ?? []) as unknown as RoutineRow[]).map((routine) => ({
    id: routine.id,
    name: routine.name,
    createdAt: routine.created_at,
    exerciseCount: routine.routine_exercises.length,
    targetMuscles: Array.from(
      new Set(
        routine.routine_exercises
          .map(({ exercise }) => exercise?.target_muscle)
          .filter((muscle): muscle is string => Boolean(muscle))
      )
    ),
  }))
}

export async function getRoutineById(routineId: string): Promise<RoutineDetail | null> {
  const { supabase, user } = await getAuthenticatedClient()
  const { data, error } = await supabase
    .from('routines')
    .select(`
      id,
      name,
      created_at,
      routine_exercises (
        position,
        exercise:exercises (
          id,
          name,
          target_muscle,
          equipment_type,
          image
        )
      )
    `)
    .eq('id', routineId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    throw new Error(`루틴을 불러오지 못했습니다: ${error.message}`)
  }

  if (!data) {
    return null
  }

  const routine = data as unknown as RoutineRow

  return {
    id: routine.id,
    name: routine.name,
    createdAt: routine.created_at,
    exercises: routine.routine_exercises
      .filter((item): item is RoutineExerciseRow & { exercise: ExerciseRow } => Boolean(item.exercise))
      .sort((a, b) => a.position - b.position)
      .map(({ exercise, position }) => ({
        ...toExerciseSummary(exercise),
        position,
      })),
  }
}

export async function getExercises(options?: {
  search?: string
  targetMuscle?: string
  limit?: number
}): Promise<ExerciseSummary[]> {
  const { supabase } = await getAuthenticatedClient()
  const limit = Math.min(Math.max(options?.limit ?? 30, 1), 50)
  let query = supabase
    .from('exercises')
    .select('id, name, target_muscle, equipment_type, image')
    .order('name')
    .limit(limit)

  if (options?.search) {
    const escapedSearch = options.search.replace(/[\\%_]/g, '\\$&')
    query = query.ilike('name', `%${escapedSearch}%`)
  }

  if (options?.targetMuscle) {
    query = query.eq('target_muscle', options.targetMuscle)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`운동 목록을 불러오지 못했습니다: ${error.message}`)
  }

  return ((data ?? []) as ExerciseRow[]).map(toExerciseSummary)
}
