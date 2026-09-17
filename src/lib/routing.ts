import type { Coordinates, RouteResult } from '../types/routes';
import {
  SEED_COUNT,
  ORS_CONCURRENCY,
  ORS_STAGGER_MS,
  ROUTES_CACHE_TTL_MS,
  TOLERANCE_RATIO,
  MAX_ROUTES_RETURNED,
} from './constants';

const ORS_URL = 'https://api.heigit.org/openrouteservice/v2/directions/foot-walking/geojson';

export class OrsServiceError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = 'OrsServiceError';
    this.status = status;
  }
}

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchRoundTrip(
  lat: number,
  lon: number,
  lengthM: number,
  seed: number,
  points: number,
  signal?: AbortSignal
): Promise<OrsGeoJsonFeature> {
  const apiKey = getApiKey();
  if (!apiKey) throw new OrsServiceError('ORS_API_KEY no configurada', 500);

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
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new OrsServiceError(
      `ORS error ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`,
      res.status
    );
  }

  const data = await res.json();
  if (!data.features || data.features.length === 0) {
    throw new Error('ORS no devolvio rutas');
  }

  return data.features[0];
}

function pickPoints(distanceM: number): number {
  if (distanceM < 3000) return 6;
  if (distanceM < 10000) return 5;
  return 4;
}

function compensateLength(targetM: number): number {
  return Math.round(targetM * 0.65);
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      try {
        await sleep(ORS_STAGGER_MS);
        results[index] = { status: 'fulfilled', value: await fn(items[index]) };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  }

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

const cache = new Map<string, { routes: RouteResult[]; expiresAt: number }>();
const MAX_CACHE_ENTRIES = 100;

function cacheKey(
  lat: number,
  lon: number,
  targetDistance: number,
  stepLength: number,
  toleranceRatio: number
): string {
  return `${lat.toFixed(5)},${lon.toFixed(5)},${Math.round(targetDistance)},${stepLength},${toleranceRatio}`;
}

export async function generateRoutes(
  lat: number,
  lon: number,
  targetDistance: number,
  stepLength: number,
  toleranceRatio: number = TOLERANCE_RATIO,
  signal?: AbortSignal
): Promise<RouteResult[]> {
  const key = cacheKey(lat, lon, targetDistance, stepLength, toleranceRatio);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    cache.delete(key);
    cache.set(key, cached);
    return cached.routes;
  }

  const points = pickPoints(targetDistance);
  const orsLength = compensateLength(targetDistance);
  const seeds = Array.from({ length: SEED_COUNT }, (_, i) => i + 1);

  const results = await mapWithConcurrency(seeds, ORS_CONCURRENCY, (seed) =>
    fetchRoundTrip(lat, lon, orsLength, seed, points, signal).then((feature) => {
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
  );

  const candidates: RouteResult[] = [];
  const failures: unknown[] = [];

  for (const r of results) {
    if (r.status === 'fulfilled') candidates.push(r.value);
    else failures.push(r.reason);
  }

  if (candidates.length === 0) {
    const orsErrors = failures.filter((e): e is OrsServiceError => e instanceof OrsServiceError);
    if (orsErrors.length > 0) {
      if (orsErrors.some((e) => e.status === 429)) {
        throw new OrsServiceError(
          'El servicio de rutas está saturado (límite de peticiones alcanzado). Inténtalo dentro de unos minutos.',
          429
        );
      }
      if (orsErrors.some((e) => e.status === 403)) {
        throw new OrsServiceError(
          'Se ha alcanzado el límite diario del servicio de rutas. Inténtalo de nuevo más tarde.',
          503
        );
      }
      if (orsErrors.some((e) => e.status === 401)) {
        throw new OrsServiceError('El servicio de rutas no está configurado correctamente.', 500);
      }
      const status = orsErrors[0].status >= 500 ? orsErrors[0].status : 502;
      throw new OrsServiceError(
        'El servicio de rutas no está disponible en este momento. Inténtalo de nuevo más tarde.',
        status
      );
    }
  }

  const toleranceLow = targetDistance * (1 - toleranceRatio);
  const toleranceHigh = targetDistance * (1 + toleranceRatio);

  const filtered = candidates.filter(
    (r) => r.distance >= toleranceLow && r.distance <= toleranceHigh
  );

  const sorted = (filtered.length >= 2 ? filtered : candidates).sort(
    (a, b) => Math.abs(a.distance - targetDistance) - Math.abs(b.distance - targetDistance)
  );

  const routes = sorted.slice(0, MAX_ROUTES_RETURNED);

  if (routes.length > 0) {
    cache.set(key, { routes, expiresAt: Date.now() + ROUTES_CACHE_TTL_MS });
    if (cache.size > MAX_CACHE_ENTRIES) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
  }

  return routes;
}
