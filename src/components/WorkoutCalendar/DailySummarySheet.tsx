'use client';

import React from 'react';
import styles from './WorkoutCalendar.module.css';

export interface ExerciseLog {
  id: string;
  name: string;
  volume: number;
  muscle: string;
}

interface Props {
  date: Date;
  logs: ExerciseLog[];
  totalVolume: number;
  onClose: () => void;
}

export const DailySummarySheet: React.FC<Props> = ({ date, logs, totalVolume, onClose }) => {
  const formattedDate = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;

  return (
    <div className={styles.sheetOverlay} onClick={onClose}>
      <div className={styles.sheetContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sheetHeader}>
          <h3 className={styles.sheetTitle}>{formattedDate} 운동 요약</h3>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.summarySection}>
          <div className={styles.summaryTitle}>총 운동 볼륨 (Clean Volume)</div>
          <div className={styles.summaryValue}>{totalVolume.toLocaleString()} kg</div>
        </div>

        <div className={styles.exerciseList}>
          {logs.map((log) => (
            <div key={log.id} className={styles.exerciseItem}>
              <div>
                <strong>{log.name}</strong>
                <div style={{ fontSize: '0.8rem', color: '#888' }}>{log.muscle}</div>
              </div>
              <div style={{ fontWeight: 500 }}>{log.volume.toLocaleString()} kg</div>
            </div>
          ))}
          {logs.length === 0 && (
            <div style={{ textAlign: 'center', color: '#888', padding: '20px 0' }}>
              기록된 운동이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
