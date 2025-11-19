export interface Vector2 {
  x: number;
  y: number;
}

export interface Body {
  id: string;
  position: Vector2;
  velocity: Vector2;
  mass: number;
  radius: number;
  color: string;
  isPlanet?: boolean; // To distinguish the planet (Trisolaris) from Suns
  trail: Vector2[];
}

export enum SimulationPreset {
  STABLE_FIGURE_8 = 'Stable Figure-8',
  CHAOTIC_RANDOM = 'Chaotic Random',
  HIERARCHICAL = 'Hierarchical (Sun-Earth-Moon-like)',
  COLLISION_COURSE = 'Collision Course'
}

export interface SimulationState {
  bodies: Body[];
  timeScale: number;
  isRunning: boolean;
  gConstant: number;
  softening: number;
}

export interface OracleResponse {
  era: 'Stable Era' | 'Chaotic Era';
  description: string;
  recommendation: string;
}