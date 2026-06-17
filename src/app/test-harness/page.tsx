'use client';

import React from 'react';
import { WorkoutSession } from '../../components/WorkoutSession/WorkoutSession';
import { RestTimer } from '../../components/RestTimer/RestTimer';
import { WorkoutCalendar } from '../../components/WorkoutCalendar/WorkoutCalendar';
import { calculateSetVolume } from '../../utils/volumeCalc';

export default function TestHarnessPage() {
  // 간단한 볼륨 연산 테스트 UI
  const [volRes, setVolRes] = React.useState(0);
  const handleTestVolume = () => {
    const vol = calculateSetVolume({
      weight: 20,
      cleanReps: 10,
      equipmentType: 'DUMBBELL' // 덤벨이므로 20 * 10 * 2.0 = 400
    });
    setVolRes(vol);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px', backgroundColor: '#000', color: '#fff', minHeight: '100vh' }}>
      <h1>Test Harness</h1>
      
      <section>
        <h2>1. Core Domain (Volume Logic Test)</h2>
        <div style={{ backgroundColor: '#111', padding: '16px', borderRadius: '8px' }}>
          <p>Dumbbell 20kg x 10 reps (Clean)</p>
          <button onClick={handleTestVolume} style={{ padding: '8px', marginBottom: '8px' }}>계산하기</button>
          <p>결과 (예상 400): {volRes}</p>
        </div>
      </section>

      <section>
        <h2>2. Workout Session UI</h2>
        <WorkoutSession
          exerciseId="ex-123"
          exerciseName="덤벨 체스트 프레스"
        />
      </section>

      <section>
        <h2>3. Smart Rest Timer (Background Safe)</h2>
        <RestTimer targetMuscle="MID_CHEST" />
      </section>

      <section>
        <h2>4. Workout Calendar (Midnight Crossover Test)</h2>
        <WorkoutCalendar />
      </section>
    </div>
  );
}
