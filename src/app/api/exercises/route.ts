import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SEARCH_LIMIT = 30
const VALID_MUSCLES = new Set([
  'UPPER_CHEST',
  'MID_CHEST',
  'LOWER_CHEST',
  'LATS',
  'UPPER_BACK',
  'LOWER_BACK',
  'FRONT_SHOULDER',
  'LATERAL_SHOULDER',
  'REAR_SHOULDER',
  'QUADS',
  'HAMSTRINGS',
  'GLUTES',
  'CALVES',
  'BICEPS',
  'TRICEPS',
  'FOREARMS',
  'ABS',
  'OBLIQUES',
  'TRAPEZIUS',
  'HIP_FLEXORS',
  'WRIST_EXTENSORS',
  'WRIST_FLEXORS',
])

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search')?.trim().slice(0, 80) ?? ''
  const requestedMuscle = request.nextUrl.searchParams.get('muscle') ?? ''
  const targetMuscle = VALID_MUSCLES.has(requestedMuscle) ? requestedMuscle : ''

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    let query = supabase
      .from('exercises')
      .select('id, name, target_muscle, equipment_type, image')
      .order('name')
      .limit(SEARCH_LIMIT)

    if (search) {
      const escapedSearch = search.replace(/[\\%_]/g, '\\$&')
      query = query.ilike('name', `%${escapedSearch}%`)
    }

    if (targetMuscle) {
      query = query.eq('target_muscle', targetMuscle)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    const exercises = (data ?? []).map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      targetMuscle: exercise.target_muscle,
      equipmentType: exercise.equipment_type,
      imageUrl: exercise.image,
    }))

    return NextResponse.json({ exercises })
  } catch {
    return NextResponse.json(
      { error: '운동 목록을 불러오지 못했습니다.' },
      { status: 500 }
    )
  }
}
