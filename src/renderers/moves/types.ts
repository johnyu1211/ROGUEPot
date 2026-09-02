export interface MoveEffectInfo {
  moveKey: string;
  moveName?: string;
  type: string;
  isSpecial: boolean;
  isPlayerAttacking: boolean;
  step?: number;
}

export interface MovePoint {
  x: number;
  y: number;
}

export type MoveRendererFn = (
  ctx: any,
  target: MovePoint,
  step?: number,
  start?: MovePoint
) => void;
