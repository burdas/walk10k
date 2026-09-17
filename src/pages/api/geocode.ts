import type { APIRoute } from 'astro';
import { searchAddresses } from '../../lib/geocoding';
import { checkRateLimit } from '../../lib/rate-limit';

export const prerender = false;

const MIN_QUERY_LENGTH = 3;
const MAX_REQUESTS = 30;
const WINDOW_MS = 60_000;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ url, clientAddress }) => {
  const ip = clientAddress ?? 'unknown';
  const { allowed, retryAfterMs } = checkRateLimit(`geocode:${ip}`, MAX_REQUESTS, WINDOW_MS);

  if (!allowed) {
    return json(
      { error: 'Demasiadas peticiones. Inténtalo de nuevo más tarde.' },
      429
    );
  }

  const query = url.searchParams.get('q')?.trim() ?? '';

  if (query.length < MIN_QUERY_LENGTH) {
    return json({ suggestions: [] });
  }

  try {
    const suggestions = await searchAddresses(query);
    return json({ suggestions });
  } catch {
    return json({ suggestions: [] }, 500);
  }
};
