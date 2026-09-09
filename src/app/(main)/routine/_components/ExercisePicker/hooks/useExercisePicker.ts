'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { ROUTINE_EXERCISE_MAX_COUNT } from '../../../constants'
import type { ExerciseSummary } from '../../../types'

type ExerciseResponse = {
  exercises?: ExerciseSummary[]
  error?: string
}

export function useExercisePicker(initialExercises: ExerciseSummary[]) {
  const [query, setQuery] = useState('')
  const [targetMuscle, setTargetMuscle] = useState('')
  const [results, setResults] = useState(initialExercises)
  const [selectedExercises, setSelectedExercises] = useState<ExerciseSummary[]>([])
  const [resolvedRequestKey, setResolvedRequestKey] = useState('|')
  const [searchError, setSearchError] = useState('')
  const deferredQuery = useDeferredValue(query)
  const requestKey = `${deferredQuery.trim()}|${targetMuscle}`

  useEffect(() => {
    if (requestKey === '|') {
      return
    }

    const controller = new AbortController()
    const searchParams = new URLSearchParams()

    if (deferredQuery.trim()) {
      searchParams.set('search', deferredQuery.trim())
    }
    if (targetMuscle) {
      searchParams.set('muscle', targetMuscle)
    }

    fetch(`/api/exercises?${searchParams.toString()}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json() as ExerciseResponse

        if (!response.ok || !body.exercises) {
          throw new Error(body.error ?? '운동 목록을 불러오지 못했습니다.')
        }

        return body.exercises
      })
      .then((exercises) => {
        setResults(exercises)
        setResolvedRequestKey(requestKey)
        setSearchError('')
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        setResolvedRequestKey(requestKey)
        setSearchError(error instanceof Error ? error.message : '운동 목록을 불러오지 못했습니다.')
      })

    return () => controller.abort()
  }, [deferredQuery, initialExercises, requestKey, targetMuscle])

  const selectedIds = useMemo(
    () => new Set(selectedExercises.map(({ id }) => id)),
    [selectedExercises]
  )

  function addExercise(exercise: ExerciseSummary) {
    setSelectedExercises((current) => {
      if (current.some(({ id }) => id === exercise.id) || current.length >= ROUTINE_EXERCISE_MAX_COUNT) {
        return current
      }

      return [...current, exercise]
    })
  }

  function removeExercise(exerciseId: string) {
    setSelectedExercises((current) => current.filter(({ id }) => id !== exerciseId))
  }

  function updateQuery(value: string) {
    setQuery(value)

    if (!value.trim() && !targetMuscle) {
      setResults(initialExercises)
      setResolvedRequestKey('|')
      setSearchError('')
    }
  }

  function updateTargetMuscle(value: string) {
    setTargetMuscle(value)

    if (!value && !query.trim()) {
      setResults(initialExercises)
      setResolvedRequestKey('|')
      setSearchError('')
    }
  }

  return {
    query,
    setQuery: updateQuery,
    targetMuscle,
    setTargetMuscle: updateTargetMuscle,
    results,
    selectedExercises,
    selectedIds,
    addExercise,
    removeExercise,
    isSearching: query !== deferredQuery || requestKey !== resolvedRequestKey,
    searchError,
  }
}
