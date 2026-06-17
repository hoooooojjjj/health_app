'use client';

import React, { useState, useEffect } from 'react';
import { DailySummarySheet, ExerciseLog } from './DailySummarySheet';
import styles from './WorkoutCalendar.module.css';

// Mock DB Schema
interface WorkoutSessionLog {
  session_id: string;
  session_start_timestamp: string; // ISO String
  session_end_timestamp: string;
  exercises: ExerciseLog[];
}

// ── Mock Data ─────────────────────────────────────────────────────────────
const MOCK_DATA: WorkoutSessionLog[] = [
  {
    session_id: 's1',
    // 자정 교차 테스트: 23:30에 시작해서 01:00에 끝남 (전날 귀속)
    session_start_timestamp: new Date(new Date().setHours(-1, 30, 0, 0)).toISOString(), // Yesterday 23:30
    session_end_timestamp: new Date(new Date().setHours(1, 0, 0, 0)).toISOString(), // Today 01:00
    exercises: [
      { id: 'e1', name: '벤치 프레스', volume: 2000, muscle: 'UPPER_CHEST' },
      { id: 'e2', name: '인클라인 덤벨 프레스', volume: 1500, muscle: 'UPPER_CHEST' },
    ]
  },
  {
    session_id: 's2',
    // 오늘 새벽 운동 테스트: 01:30 시작 (오늘 귀속)
    session_start_timestamp: new Date(new Date().setHours(1, 30, 0, 0)).toISOString(), // Today 01:30
    session_end_timestamp: new Date(new Date().setHours(3, 0, 0, 0)).toISOString(),
    exercises: [
      { id: 'e3', name: '풀업', volume: 1800, muscle: 'LATS' },
      { id: 'e4', name: '바벨 로우', volume: 2200, muscle: 'UPPER_BACK' },
    ]
  }
];

// 데이터 패치 최적화를 위한 Mock 함수 (해당 월만 쿼리)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function fetchLogsByMonth(_year: number, _month: number): Promise<WorkoutSessionLog[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 실제라면 DB에서 year, month에 해당하는 데이터만 필터링해서 가져옴
      resolve(MOCK_DATA);
    }, 300);
  });
}

// ── Helper ──────────────────────────────────────────────────────────────
const getDotClass = (muscle: string) => {
  if (muscle.includes('CHEST') || muscle.includes('SHOULDER')) return styles.dotPush;
  if (muscle.includes('BACK') || muscle.includes('LATS')) return styles.dotPull;
  if (muscle.includes('QUADS') || muscle.includes('HAMSTRINGS') || muscle.includes('GLUTES')) return styles.dotLegs;
  if (muscle.includes('ABS')) return styles.dotCore;
  return styles.dotOther;
};

// ── Component ────────────────────────────────────────────────────────────
export const WorkoutCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<WorkoutSessionLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchLogsByMonth(currentDate.getFullYear(), currentDate.getMonth());
      setLogs(data);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // 특정 날짜의 세션 찾기 (자정 교차 엄격 적용 - start_timestamp 기준)
  const getSessionsForDate = (date: number) => {
    return logs.filter(log => {
      const start = new Date(log.session_start_timestamp);
      return start.getFullYear() === currentDate.getFullYear() &&
             start.getMonth() === currentDate.getMonth() &&
             start.getDate() === date;
    });
  };

  const handleDayClick = (date: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), date));
  };

  const renderDays = () => {
    const cells = [];
    // 빈 셀 (월 시작일 전)
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className={`${styles.dayCell} ${styles.empty}`} />);
    }

    // 날짜 셀
    for (let d = 1; d <= daysInMonth; d++) {
      const daySessions = getSessionsForDate(d);
      
      // 해당 날짜의 고유한 타겟 근육들 추출
      const muscles = new Set<string>();
      daySessions.forEach(s => s.exercises.forEach(e => muscles.add(e.muscle)));
      
      cells.push(
        <div key={d} className={styles.dayCell} onClick={() => handleDayClick(d)}>
          <div className={styles.dateNumber}>{d}</div>
          <div className={styles.dotsContainer}>
            {Array.from(muscles).slice(0, 3).map((m, idx) => (
              <div key={idx} className={`${styles.dot} ${getDotClass(m)}`} />
            ))}
          </div>
        </div>
      );
    }
    return cells;
  };

  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

  // 선택된 날짜의 요약 데이터 계산
  const selectedSessions = selectedDate ? getSessionsForDate(selectedDate.getDate()) : [];
  const selectedExercises = selectedSessions.flatMap(s => s.exercises);
  const totalVolume = selectedExercises.reduce((sum, e) => sum + e.volume, 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.navButton} onClick={prevMonth}>&lt;</button>
        <div>{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</div>
        <button className={styles.navButton} onClick={nextMonth}>&gt;</button>
      </div>

      <div className={styles.grid}>
        {WEEKDAYS.map(d => <div key={d} className={styles.weekday}>{d}</div>)}
        {renderDays()}
      </div>

      {selectedDate && (
        <DailySummarySheet
          date={selectedDate}
          logs={selectedExercises}
          totalVolume={totalVolume}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
};
