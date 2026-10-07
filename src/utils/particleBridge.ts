// Global lightweight bridge for 60/120fps GSAP ScrollTrigger to WebGL shader communication
// Eliminates React re-renders and ensures a single continuous particle canvas across sections
export interface ParticleState {
  overviewProgress: number; // 0.0 (OVERVIEW text) -> 1.0 (Dispersed cosmic nebula)
  skillsProgress: number;   // 0.0 (Dispersed nebula) -> 1.0 (Merged into SKILLS on top-left)
  objectProgress: number;   // 0.0 -> 1.0 (Morph into 3D geometric / mechanical object)
  activeWord: string;       // Current word being formed ("OVERVIEW", "SKILLS", etc.)
  isDarkActive: boolean;    // true when inside ParticleExperienceWrapper, false in Hero
}

export const particleBridge: ParticleState = {
  overviewProgress: 0,
  skillsProgress: 0,
  objectProgress: 0,
  activeWord: "OVERVIEW",
  isDarkActive: false,
};
