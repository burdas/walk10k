export const STEP_LENGTH_DEFAULT = 0.75;

export const STEP_OPTIONS = [5000, 8000, 10000, 12000, 15000] as const;
export type StepOption = (typeof STEP_OPTIONS)[number];

export const TOLERANCE_RATIO = 0.25;
export const SEED_COUNT = 8;
export const MAX_ROUTES_RETURNED = 4;

export const MIN_DISTANCE_M = 500;
export const MAX_DISTANCE_M = 50000;

export const WALKING_SPEED_KMH = 5;
