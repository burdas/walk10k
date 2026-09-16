import type { APIRoute } from 'astro';
import { searchAddresses } from '../../lib/geocoding';

export const prerender = false;

const MIN_QUERY_LENGTH = 3;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ url }) => {
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
