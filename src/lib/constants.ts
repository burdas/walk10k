export const STEP_LENGTH_DEFAULT = 0.75;
export const MIN_STEP_LENGTH_M = 0.4;
export const MAX_STEP_LENGTH_M = 1.2;

export const STEP_OPTIONS = [5000, 8000, 10000, 12000, 15000] as const;
export type StepOption = (typeof STEP_OPTIONS)[number];

export const TOLERANCE_RATIO = 0.20;
export const MIN_TOLERANCE_RATIO = 0.05;
export const MAX_TOLERANCE_RATIO = 0.5;
export const SEED_COUNT = 10;
export const ORS_CONCURRENCY = 3;
export const ORS_STAGGER_MS = 150;
export const ROUTES_CACHE_TTL_MS = 5 * 60 * 1000;
export const MAX_ROUTES_RETURNED = 6;

export const MIN_DISTANCE_M = 500;
export const MAX_DISTANCE_M = 50000;

export const WALKING_SPEED_KMH = 5;

export const LAST_ADDRESS_KEY = 'walk10k:lastAddress';
export const SETTINGS_KEY = 'walk10k:settings';

export const DEFAULT_SETTINGS = {
  stepLength: STEP_LENGTH_DEFAULT,
  toleranceRatio: TOLERANCE_RATIO,
};
