import { WALKING_SPEED_KMH } from './constants';

export function stepsToMeters(steps: number, stepLength: number): number {
  return steps * stepLength;
}

export function metersToSteps(meters: number, stepLength: number): number {
  return Math.round(meters / stepLength);
}

export function durationSeconds(distanceM: number): number {
  const hours = distanceM / 1000 / WALKING_SPEED_KMH;
  return Math.round(hours * 3600);
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m} min`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`.replace('.', ',');
}
