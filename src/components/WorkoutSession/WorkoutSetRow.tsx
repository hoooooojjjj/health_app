import React, { useEffect, useState } from 'react';
import styles from './WorkoutSession.module.css';

export interface SetData {
  id: string;
  weight: string;
  cleanReps: string;
  dirtyReps: string;
  completed: boolean;
  placeholderWeight: string;
  placeholderCleanReps: string;
}

interface Props {
  index: number;
  data: SetData;
  onChange: (id: string, field: keyof SetData, value: string | boolean) => void;
}

export const WorkoutSetRow: React.FC<Props> = ({ index, data, onChange }) => {
  const [localWeight, setLocalWeight] = useState(data.weight);
  const [localCleanReps, setLocalCleanReps] = useState(data.cleanReps);
  const [localDirtyReps, setLocalDirtyReps] = useState(data.dirtyReps);

  // Sync local state when parent data changes (e.g. initial load)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalWeight(data.weight);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalCleanReps(data.cleanReps);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalDirtyReps(data.dirtyReps);
  }, [data.weight, data.cleanReps, data.dirtyReps]);

  const handleBlur = (field: keyof SetData, value: string) => {
    onChange(data.id, field, value);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    
    // 플레이스홀더 로직 적용: 빈 칸인 상태에서 완료 누르면 플레이스홀더 값으로 채움
    if (isChecked) {
      let updatedWeight = localWeight;
      let updatedCleanReps = localCleanReps;

      if (!localWeight && data.placeholderWeight) {
        updatedWeight = data.placeholderWeight;
        setLocalWeight(updatedWeight);
        onChange(data.id, 'weight', updatedWeight);
      }
      if (!localCleanReps && data.placeholderCleanReps) {
        updatedCleanReps = data.placeholderCleanReps;
        setLocalCleanReps(updatedCleanReps);
        onChange(data.id, 'cleanReps', updatedCleanReps);
      }
    }

    onChange(data.id, 'completed', isChecked);
  };

  const rowClass = data.completed ? `${styles.row} ${styles.rowCompleted}` : styles.row;

  return (
    <div className={rowClass}>
      <div className={styles.setIndex}>{index + 1}</div>
      
      <div className={styles.inputGroup}>
        <div className={styles.label}>kg</div>
        <input
          type="number"
          className={styles.input}
          placeholder={data.placeholderWeight || '-'}
          value={localWeight}
          onChange={(e) => setLocalWeight(e.target.value)}
          onBlur={() => handleBlur('weight', localWeight)}
          disabled={data.completed}
        />
      </div>

      <div className={styles.inputGroup}>
        <div className={styles.label}>Clean</div>
        <input
          type="number"
          className={`${styles.input} ${styles.cleanRepsInput}`}
          placeholder={data.placeholderCleanReps || '-'}
          value={localCleanReps}
          onChange={(e) => setLocalCleanReps(e.target.value)}
          onBlur={() => handleBlur('cleanReps', localCleanReps)}
          disabled={data.completed}
        />
      </div>

      <div className={styles.inputGroup}>
        <div className={styles.label}>Dirty</div>
        <input
          type="number"
          className={`${styles.input} ${styles.dirtyRepsInput}`}
          placeholder="-"
          value={localDirtyReps}
          onChange={(e) => setLocalDirtyReps(e.target.value)}
          onBlur={() => handleBlur('dirtyReps', localDirtyReps)}
          disabled={data.completed}
        />
      </div>

      <div>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={data.completed}
          onChange={handleCheckboxChange}
        />
      </div>
    </div>
  );
};
