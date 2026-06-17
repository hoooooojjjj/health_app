'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WorkoutSetRow, SetData } from './WorkoutSetRow';
import styles from './WorkoutSession.module.css';

interface Props {
  exerciseId: string;
  exerciseName: string;
  initialSets?: SetData[];
}

const EMPTY_ARRAY: SetData[] = [];

export const WorkoutSession: React.FC<Props> = ({ exerciseId, exerciseName, initialSets = EMPTY_ARRAY }) => {
  const [sets, setSets] = useState<SetData[]>([]);
  const draftKey = `workout_draft_${exerciseId}`;

  const createEmptySet = useCallback((placeholderWeight = '', placeholderCleanReps = ''): SetData => ({
    id: crypto.randomUUID(),
    weight: '',
    cleanReps: '',
    dirtyReps: '',
    completed: false,
    placeholderWeight,
    placeholderCleanReps,
  }), []);

  // 로컬 드래프트 불러오기 또는 초기 세팅
  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSets(JSON.parse(savedDraft));
        return;
      } catch (e) {
        console.error('Failed to parse workout draft', e);
      }
    }

    if (initialSets.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSets(initialSets);
    } else {
      // 초기값이 없으면 빈 세트 1개 생성
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSets([createEmptySet()]);
    }
  }, [exerciseId, initialSets, draftKey, createEmptySet]);

  // 자동 저장 로직
  const saveToLocalDraft = useCallback((currentSets: SetData[]) => {
    localStorage.setItem(draftKey, JSON.stringify(currentSets));
  }, [draftKey]);

  const handleSetChange = (id: string, field: keyof SetData, value: string | boolean) => {
    setSets(prevSets => {
      const newSets = prevSets.map(set => 
        set.id === id ? { ...set, [field]: value } : set
      );
      
      // 완료 토글 시 즉시 저장 트리거
      if (field === 'completed') {
        saveToLocalDraft(newSets);
      }
      return newSets;
    });
  };

  const handleAddSet = () => {
    setSets(prevSets => {
      // 직전 세트 찾기
      const lastSet = prevSets.length > 0 ? prevSets[prevSets.length - 1] : null;
      
      // 직전 세트의 기록을 플레이스홀더로 사용
      const placeholderW = lastSet && lastSet.weight ? lastSet.weight : lastSet?.placeholderWeight || '';
      const placeholderC = lastSet && lastSet.cleanReps ? lastSet.cleanReps : lastSet?.placeholderCleanReps || '';
      
      const newSet = createEmptySet(placeholderW, placeholderC);
      const newSets = [...prevSets, newSet];
      
      // 세트 추가시에도 저장 트리거
      saveToLocalDraft(newSets);
      return newSets;
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{exerciseName}</h2>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sets.map((set, index) => (
          <WorkoutSetRow
            key={set.id}
            index={index}
            data={set}
            onChange={handleSetChange}
          />
        ))}
      </div>

      <button className={styles.addButton} onClick={handleAddSet}>
        + 세트 추가
      </button>
    </div>
  );
};
