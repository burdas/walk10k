import type { APIRoute } from 'astro';
import { geocodeAddress } from '../../lib/geocoding';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { address } = body as { address?: string };

    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Direccion requerida' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await geocodeAddress(address.trim());

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    const status = message.includes('no encontrada') ? 404 : 500;
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
