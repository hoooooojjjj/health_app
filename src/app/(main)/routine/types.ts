export type ExerciseSummary = {
  id: string
  name: string
  targetMuscle: string
  equipmentType: string
  imageUrl: string | null
}

export type RoutineExercise = ExerciseSummary & {
  position: number
}

export type RoutineSummary = {
  id: string
  name: string
  createdAt: string
  exerciseCount: number
  targetMuscles: string[]
}

export type RoutineDetail = {
  id: string
  name: string
  createdAt: string
  exercises: RoutineExercise[]
}

export type CreateRoutineActionState = {
  status: 'idle' | 'error'
  message: string
  fieldErrors?: {
    name?: string
    exercises?: string
  }
}
