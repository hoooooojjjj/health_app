export type EquipmentType = 'DUMBBELL' | 'BARBELL' | 'MACHINE' | 'CABLE' | 'BODYWEIGHT' | 'ASSISTED';

export interface VolumeCalcParams {
  weight: number;
  cleanReps: number;
  equipmentType: EquipmentType;
  bodyWeight?: number; // ASSISTED 장비인 경우 필수
}

/**
 * 운동 세트의 실제 볼륨(Volume)을 계산합니다.
 * @param params 계산에 필요한 파라미터 (무게, 정자세 횟수, 장비 종류, 사용자 체중)
 * @returns 계산된 총 볼륨
 */
export function calculateSetVolume(params: VolumeCalcParams): number {
  const { weight, cleanReps, equipmentType, bodyWeight } = params;

  if (equipmentType === 'ASSISTED') {
    // 어시스트 머신의 경우 (체중 - 보조 무게) * 횟수
    const bw = bodyWeight ?? 0;
    const effectiveWeight = Math.max(0, bw - weight); // 보조 무게가 체중보다 클 경우 음수 방지
    return effectiveWeight * cleanReps;
  }

  // 덤벨은 양손의 무게를 합산하기 위해 2배수 적용, 그 외는 1배수
  const multiplier = equipmentType === 'DUMBBELL' ? 2.0 : 1.0;
  return weight * cleanReps * multiplier;
}
