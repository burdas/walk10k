import type { GeocodeSuggestion } from '../types/routes';

const PHOTON_URL = 'https://photon.komoot.io/api/';
const CARTOCIUDAD_URL = 'https://www.cartociudad.es/geocoder/api/geocoder/candidates';
const USER_AGENT = 'Walk10K/1.0 (https://github.com/walk10k)';
const MAX_CACHE_ENTRIES = 200;
const CARTOCIUDAD_MAX_VARIANTS = 3;

const cache = new Map<string, GeocodeSuggestion[]>();

interface PhotonFeature {
  properties: {
    osm_type?: string;
    osm_id?: number;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    type?: string;
  };
  geometry: {
    coordinates: [number, number];
  };
}

interface CartoCiudadCandidate {
  id?: string;
  address?: string;
  muni?: string;
  poblacion?: string;
  province?: string;
  postalCode?: string;
  tip_via?: string;
  portalNumber?: number | null;
  lat?: number | string;
  lng?: number | string;
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/(^|[\s/(.-])(\p{L})/gu, (_match, separator: string, char: string) => {
      return separator + char.toUpperCase();
    });
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1);
}

function buildQueryVariants(query: string): string[] {
  const variants = [query];
  const segments = query
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length > 1) {
    for (let end = segments.length - 1; end >= 1; end--) {
      variants.push(segments.slice(0, end).join(', '));
    }
  } else {
    const words = query.split(/\s+/).filter(Boolean);
    if (words.length > 3) {
      variants.push(words.slice(0, -1).join(' '));
    }
  }

  return [...new Set(variants)].slice(0, CARTOCIUDAD_MAX_VARIANTS);
}

function buildPhotonPrimary(p: PhotonFeature['properties']): string {
  if (p.name) return p.name;
  if (p.street && p.housenumber) return `${p.street} ${p.housenumber}`;
  if (p.street) return p.street;
  if (p.city) return p.city;
  if (p.county) return p.county;
  return p.state ?? p.country ?? 'Lugar';
}

function buildPhotonSecondary(p: PhotonFeature['properties'], primary: string): string {
  const primaryKey = primary.toLowerCase();
  const parts: Array<string | undefined> = [];
  if (p.street && p.housenumber) parts.push(`${p.street} ${p.housenumber}`);
  else if (p.street) parts.push(p.street);
  parts.push(p.district, p.city, p.county, p.state, p.postcode, p.country);

  const seen = new Set<string>();
  return parts
    .filter((part): part is string => Boolean(part))
    .filter((part) => {
      const key = part.toLowerCase();
      if (key === primaryKey || primaryKey.includes(key)) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(', ');
}

function photonToSuggestion(feature: PhotonFeature, index: number): GeocodeSuggestion {
  const p = feature.properties;
  const [lon, lat] = feature.geometry.coordinates;
  const primary = buildPhotonPrimary(p);
  const secondary = buildPhotonSecondary(p, primary);
  const id = p.osm_type && p.osm_id ? `osm:${p.osm_type}${p.osm_id}` : `osm:${lat},${lon},${index}`;

  return {
    id,
    lat,
    lon,
    primary,
    secondary,
    label: secondary ? `${primary}, ${secondary}` : primary,
  };
}

function cartoCiudadToSuggestion(candidate: CartoCiudadCandidate): GeocodeSuggestion | null {
  const lat = typeof candidate.lat === 'string' ? Number.parseFloat(candidate.lat) : candidate.lat;
  const lon = typeof candidate.lng === 'string' ? Number.parseFloat(candidate.lng) : candidate.lng;

  if (typeof lat !== 'number' || typeof lon !== 'number' || Number.isNaN(lat) || Number.isNaN(lon)) {
    return null;
  }

  const rawAddress = (candidate.address ?? '').trim();
  const [streetPart, ...rest] = rawAddress.split(',');
  const primarySource =
    (streetPart || '').trim() ||
    [candidate.tip_via, candidate.portalNumber].filter(Boolean).join(' ').trim();

  const primary = titleCase(primarySource || 'Dirección');
  const primaryKey = primary.toLowerCase();

  const tail = titleCase(rest.join(',').trim() || candidate.muni || candidate.poblacion || '');
  const parts: Array<string | undefined> = [tail, candidate.province, candidate.postalCode];

  const seen = new Set<string>();
  const secondary = parts
    .filter((part): part is string => Boolean(part))
    .filter((part) => {
      const key = part.toLowerCase();
      if (key === primaryKey || primaryKey.includes(key)) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(', ');

  const id = candidate.id ? `cc:${candidate.id}` : `cc:${lat},${lon}`;

  return {
    id,
    lat,
    lon,
    primary,
    secondary,
    label: secondary ? `${primary}, ${secondary}` : primary,
  };
}

async function searchPhoton(query: string, limit: number): Promise<GeocodeSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });

  const res = await fetch(`${PHOTON_URL}?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Photon error: ${res.status}`);
  }

  const data = (await res.json()) as { features?: PhotonFeature[] };
  return (data.features ?? []).map(photonToSuggestion);
}

async function fetchCartoCiudad(query: string, limit: number): Promise<GeocodeSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });

  const res = await fetch(`${CARTOCIUDAD_URL}?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`CartoCiudad error: ${res.status}`);
  }

  const data = (await res.json()) as CartoCiudadCandidate[];
  if (!Array.isArray(data)) return [];

  return data
    .map(cartoCiudadToSuggestion)
    .filter((suggestion): suggestion is GeocodeSuggestion => suggestion !== null);
}

async function searchCartoCiudad(query: string, limit: number): Promise<GeocodeSuggestion[]> {
  const variants = buildQueryVariants(query);
  const responses = await Promise.all(
    variants.map((variant) => fetchCartoCiudad(variant, limit).catch(() => []))
  );

  const seen = new Set<string>();
  const suggestions: GeocodeSuggestion[] = [];
  for (const list of responses) {
    for (const suggestion of list) {
      if (seen.has(suggestion.id)) continue;
      seen.add(suggestion.id);
      suggestions.push(suggestion);
    }
  }

  return suggestions;
}

function dedupeByCoordinates(suggestions: GeocodeSuggestion[]): GeocodeSuggestion[] {
  const seen = new Set<string>();
  const out: GeocodeSuggestion[] = [];

  for (const suggestion of suggestions) {
    const key = `${suggestion.lat.toFixed(6)},${suggestion.lon.toFixed(6)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(suggestion);
  }

  return out;
}

function relevanceScore(suggestion: GeocodeSuggestion, queryTokens: string[]): number {
  const haystack = `${suggestion.primary} ${suggestion.secondary}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  let score = 0;
  for (const token of queryTokens) {
    if (haystack.includes(token)) score += 1;
  }
  return score;
}

export async function searchAddresses(
  address: string,
  limit = 10
): Promise<GeocodeSuggestion[]> {
  const query = address.trim();
  if (!query) return [];

  const key = normalizeQuery(query);
  const cached = cache.get(key);
  if (cached) return cached;

  const [photon, cartoCiudad] = await Promise.all([
    searchPhoton(query, limit).catch(() => [] as GeocodeSuggestion[]),
    searchCartoCiudad(query, limit),
  ]);

  const queryTokens = tokenize(query);
  const ranked = dedupeByCoordinates([...cartoCiudad, ...photon])
    .map((suggestion, index) => ({
      suggestion,
      index,
      score: relevanceScore(suggestion, queryTokens),
      fromCartoCiudad: suggestion.id.startsWith('cc:'),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.fromCartoCiudad !== b.fromCartoCiudad) return a.fromCartoCiudad ? -1 : 1;
      return a.index - b.index;
    })
    .map((entry) => entry.suggestion)
    .slice(0, limit);

  cache.set(key, ranked);
  if (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }

  return ranked;
}
