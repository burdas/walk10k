import {
  DEFAULT_SETTINGS,
  MAX_STEP_LENGTH_M,
  MAX_TOLERANCE_RATIO,
  MIN_STEP_LENGTH_M,
  MIN_TOLERANCE_RATIO,
  SETTINGS_KEY,
} from './constants';

export interface Settings {
  stepLength: number;
  toleranceRatio: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function sanitizeSettings(input: Partial<Settings> | null | undefined): Settings {
  const stepLength =
    typeof input?.stepLength === 'number' && Number.isFinite(input.stepLength)
      ? clamp(input.stepLength, MIN_STEP_LENGTH_M, MAX_STEP_LENGTH_M)
      : DEFAULT_SETTINGS.stepLength;

  const toleranceRatio =
    typeof input?.toleranceRatio === 'number' && Number.isFinite(input.toleranceRatio)
      ? clamp(input.toleranceRatio, MIN_TOLERANCE_RATIO, MAX_TOLERANCE_RATIO)
      : DEFAULT_SETTINGS.toleranceRatio;

  return { stepLength, toleranceRatio };
}

export function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return sanitizeSettings(JSON.parse(raw) as Partial<Settings>);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Almacenamiento no disponible; se ignora.
  }
}
