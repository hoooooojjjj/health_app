'use client';

import React from 'react';
import { useRestTimer } from '../../hooks/useRestTimer';
import styles from './RestTimer.module.css';

export type MuscleGroup = 
  | 'UPPER_CHEST' | 'MID_CHEST' | 'LOWER_CHEST'
  | 'LATS' | 'UPPER_BACK' | 'LOWER_BACK'
  | 'FRONT_SHOULDER' | 'LATERAL_SHOULDER' | 'REAR_SHOULDER'
  | 'QUADS' | 'HAMSTRINGS' | 'GLUTES' | 'CALVES'
  | 'BICEPS' | 'TRICEPS' | 'FOREARMS'
  | 'ABS' | 'OBLIQUES';

interface Props {
  targetMuscle: MuscleGroup;
}

const LARGE_MUSCLES: MuscleGroup[] = [
  'UPPER_CHEST', 'MID_CHEST', 'LOWER_CHEST',
  'LATS', 'UPPER_BACK', 'LOWER_BACK',
  'QUADS', 'HAMSTRINGS', 'GLUTES'
];

export const RestTimer: React.FC<Props> = ({ targetMuscle }) => {
  const { status, remainingSeconds, start, adjustTime, skip } = useRestTimer();

  const isLargeMuscle = LARGE_MUSCLES.includes(targetMuscle);
  const defaultDuration = isLargeMuscle ? 90 : 60;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (status === 'idle' || status === 'done') {
    return (
      <div className={styles.container}>
        <div className={styles.muscleBadge}>{targetMuscle.replace('_', ' ')} (권장 휴식: {defaultDuration}초)</div>
        <button className={`${styles.button} ${styles.startButton}`} onClick={() => start(defaultDuration)}>
          타이머 시작
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.muscleBadge}>휴식 중...</div>
      <div className={styles.timeDisplay}>{formatTime(remainingSeconds)}</div>
      
      <div className={styles.controls}>
        <button className={styles.button} onClick={() => adjustTime(-10)}>-10초</button>
        <button className={`${styles.button} ${styles.skipButton}`} onClick={skip}>Skip</button>
        <button className={styles.button} onClick={() => adjustTime(30)}>+30초</button>
      </div>
    </div>
  );
};
