import type { Coordinates, RouteResult } from '../types/routes';
import { SEED_COUNT, TOLERANCE_RATIO } from './constants';

const ORS_URL = 'https://api.openrouteservice.org/v2/directions/foot-walking/geojson';

function getApiKey(): string {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.ORS_API_KEY) {
    return (import.meta as any).env.ORS_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env?.ORS_API_KEY) {
    return process.env.ORS_API_KEY;
  }
  return '';
}

interface OrsGeoJsonFeature {
  geometry: {
    coordinates: [number, number][];
  };
  properties: {
    summary: {
      distance: number;
      duration: number;
    };
  };
}

async function fetchRoundTrip(
  lat: number,
  lon: number,
  lengthM: number,
  seed: number,
  points: number
): Promise<OrsGeoJsonFeature> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('ORS_API_KEY no configurada');

  const body = {
    coordinates: [[lon, lat]],
    radiuses: [5000],
    instructions: false,
    geometry: true,
    preference: 'recommended',
    options: {
      round_trip: {
        length: lengthM,
        points,
        seed,
      },
    },
  };

  const res = await fetch(ORS_URL, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ORS error ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (!data.features || data.features.length === 0) {
    throw new Error('ORS no devolvio rutas');
  }

  return data.features[0];
}

function pickPoints(distanceM: number): number {
  if (distanceM < 3000) return 6;
  if (distanceM < 8000) return 5;
  return 4;
}

function compensateLength(targetM: number): number {
  return Math.round(targetM * 0.55);
}

export async function generateRoutes(
  lat: number,
  lon: number,
  targetDistance: number,
  stepLength: number
): Promise<RouteResult[]> {
  const points = pickPoints(targetDistance);
  const orsLength = compensateLength(targetDistance);
  const candidates: RouteResult[] = [];

  const seeds = Array.from({ length: SEED_COUNT }, (_, i) => i + 1);

  const results = await Promise.allSettled(
    seeds.map((seed) =>
      fetchRoundTrip(lat, lon, orsLength, seed, points).then((feature) => {
        const geom = feature.geometry.coordinates.map(([lon, lat]) => ({ lat, lon }));
        const distance = Math.round(feature.properties.summary.distance);
        const duration = Math.round(feature.properties.summary.duration);
        const steps = Math.round(distance / stepLength);

        return {
          distance,
          duration,
          steps,
          geometry: geom,
          seed,
        } satisfies RouteResult;
      })
    )
  );

  for (const r of results) {
    if (r.status === 'fulfilled') candidates.push(r.value);
  }

  const toleranceLow = targetDistance * (1 - TOLERANCE_RATIO);
  const toleranceHigh = targetDistance * (1 + TOLERANCE_RATIO);

  const filtered = candidates.filter(
    (r) => r.distance >= toleranceLow && r.distance <= toleranceHigh
  );

  const sorted = (filtered.length >= 2 ? filtered : candidates).sort(
    (a, b) => Math.abs(a.distance - targetDistance) - Math.abs(b.distance - targetDistance)
  );

  return sorted.slice(0, 4);
}
