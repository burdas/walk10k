import type { APIRoute } from 'astro';
import { generateRoutes, OrsServiceError } from '../../lib/routing';
import { stepsToMeters } from '../../lib/distance';
import { MIN_DISTANCE_M, MAX_DISTANCE_M } from '../../lib/constants';
import { sanitizeSettings } from '../../lib/settings';
import { checkRateLimit } from '../../lib/rate-limit';

export const prerender = false;

const MAX_REQUESTS = 5;
const WINDOW_MS = 60_000;
const ROUTE_TIMEOUT_MS = 30_000;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress ?? 'unknown';
  const { allowed } = checkRateLimit(`routes:${ip}`, MAX_REQUESTS, WINDOW_MS);

  if (!allowed) {
    return new Response(
      JSON.stringify({ error: 'Demasiadas peticiones. Inténtalo de nuevo más tarde.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { lat, lon, steps, stepLength, toleranceRatio } = body as {
      lat?: number;
      lon?: number;
      steps?: number;
      stepLength?: number;
      toleranceRatio?: number;
    };

    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Coordenadas invalidas' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (typeof steps !== 'number' || steps < 100 || steps > 100000) {
      return new Response(
        JSON.stringify({ error: 'Numero de pasos invalido (100-100000)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { stepLength: effectiveStepLength, toleranceRatio: effectiveToleranceRatio } =
      sanitizeSettings({ stepLength, toleranceRatio });
    const targetDistance = stepsToMeters(steps, effectiveStepLength);

    if (targetDistance < MIN_DISTANCE_M || targetDistance > MAX_DISTANCE_M) {
      return new Response(
        JSON.stringify({
          error: `Distancia objetivo fuera de rango (${MIN_DISTANCE_M}m - ${MAX_DISTANCE_M}m)`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ROUTE_TIMEOUT_MS);

    try {
      const routes = await generateRoutes(
        lat,
        lon,
        targetDistance,
        effectiveStepLength,
        effectiveToleranceRatio,
        controller.signal
      );

      if (routes.length === 0) {
        return new Response(
          JSON.stringify({
            error: 'No se encontraron rutas adecuadas para esta ubicación. Prueba con otro número de pasos.',
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ targetDistance, routes }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return new Response(
        JSON.stringify({ error: 'La generación de rutas ha tardado demasiado. Inténtalo de nuevo.' }),
        { status: 504, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (err instanceof OrsServiceError) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: err.status, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
