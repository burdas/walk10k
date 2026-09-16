import { useEffect, useRef } from 'react';
import type { Coordinates } from '../types/routes';

interface RouteMapProps {
  origin: Coordinates | null;
  routeGeometry: Coordinates[];
  routeIndex: number;
  showRoute: boolean;
}

const NEUTRAL_VIEW: Coordinates = { lat: 40.0, lon: -3.7 };
const NEUTRAL_ZOOM = 5;
const FOCUS_ZOOM = 16;

function createMarkerIcon(L: typeof import('leaflet')) {
  return L.divIcon({
    className: '',
    html: '<div style="width:20px;height:20px;background:#000;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export default function RouteMap({ origin, routeGeometry, routeIndex, showRoute }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<import('leaflet').Map | null>(null);
  const originMarker = useRef<import('leaflet').Marker | null>(null);
  const routeLayer = useRef<import('leaflet').Polyline | null>(null);

  const stateRef = useRef({ origin, routeGeometry, showRoute });
  stateRef.current = { origin, routeGeometry, showRoute };

  function applyState(L: typeof import('leaflet')) {
    const map = mapObj.current;
    if (!map) return;

    const { origin, routeGeometry, showRoute } = stateRef.current;

    if (origin) {
      if (originMarker.current) {
        originMarker.current.setLatLng([origin.lat, origin.lon]);
      } else {
        originMarker.current = L.marker([origin.lat, origin.lon], {
          icon: createMarkerIcon(L),
        }).addTo(map);
      }
    } else if (originMarker.current) {
      originMarker.current.remove();
      originMarker.current = null;
    }

    routeLayer.current?.remove();
    routeLayer.current = null;

    if (showRoute && routeGeometry.length > 0) {
      const latlngs = routeGeometry.map((c) => [c.lat, c.lon] as [number, number]);
      routeLayer.current = L.polyline(latlngs, {
        color: '#000',
        weight: 4,
        opacity: 0.8,
      }).addTo(map);
      map.fitBounds(routeLayer.current.getBounds(), { padding: [30, 30] });
    } else if (origin) {
      map.flyTo([origin.lat, origin.lon], FOCUS_ZOOM);
    }
  }

  useEffect(() => {
    if (!mapRef.current || mapObj.current) return;

    let cancelled = false;

    async function init() {
      const L = await import('leaflet');
      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        zoomControl: false,
        scrollWheelZoom: true,
      }).setView([NEUTRAL_VIEW.lat, NEUTRAL_VIEW.lon], NEUTRAL_ZOOM);

      L.control.zoom({ position: 'topright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapObj.current = map;
      applyState(L);
    }

    init();

    return () => {
      cancelled = true;
      mapObj.current?.remove();
      mapObj.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapObj.current) return;

    let cancelled = false;

    async function update() {
      const L = await import('leaflet');
      if (cancelled || !mapObj.current) return;
      applyState(L);
    }

    update();

    return () => {
      cancelled = true;
    };
  }, [origin, routeIndex, routeGeometry, showRoute]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
    />
  );
}
