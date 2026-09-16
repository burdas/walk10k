import type { APIRoute } from 'astro';
import { generateRoutes } from '../../lib/routing';
import { stepsToMeters } from '../../lib/distance';
import { MIN_DISTANCE_M, MAX_DISTANCE_M, STEP_LENGTH_DEFAULT } from '../../lib/constants';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { lat, lon, steps, stepLength } = body as {
      lat?: number;
      lon?: number;
      steps?: number;
      stepLength?: number;
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

    const effectiveStepLength = stepLength || STEP_LENGTH_DEFAULT;
    const targetDistance = stepsToMeters(steps, effectiveStepLength);

    if (targetDistance < MIN_DISTANCE_M || targetDistance > MAX_DISTANCE_M) {
      return new Response(
        JSON.stringify({
          error: `Distancia objetivo fuera de rango (${MIN_DISTANCE_M}m - ${MAX_DISTANCE_M}m)`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const routes = await generateRoutes(lat, lon, targetDistance, effectiveStepLength);

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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
