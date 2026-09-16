const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

const cache = new Map<string, { lat: number; lon: number; displayName: string }>();

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lon: number; displayName: string }> {
  const key = normalizeAddress(address);
  const cached = cache.get(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    q: address,
    format: 'json',
    limit: '1',
    addressdetails: '1',
  });

  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: {
      'User-Agent': 'Walk10K/1.0 (https://github.com/walk10k)',
    },
  });

  if (!res.ok) {
    throw new Error(`Nominatim error: ${res.status}`);
  }

  const data = await res.json();

  if (!data || data.length === 0) {
    throw new Error('Direccion no encontrada');
  }

  const result = data[0];
  const response = {
    lat: parseFloat(result.lat),
    lon: parseFloat(result.lon),
    displayName: result.display_name,
  };

  cache.set(key, response);
  return response;
}
