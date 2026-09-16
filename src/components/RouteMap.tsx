import { useEffect, useRef } from 'react';
import type { Coordinates } from '../types/routes';

interface RouteMapProps {
  origin: Coordinates;
  routeGeometry: Coordinates[];
  routeIndex: number;
}

export default function RouteMap({ origin, routeGeometry, routeIndex }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<import('leaflet').Map | null>(null);
  const routeLayer = useRef<import('leaflet').Polyline | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapObj.current) return;

    let cancelled = false;

    async function init() {
      const L = await import('leaflet');
      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: true })
        .setView([origin.lat, origin.lon], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: '',
        html: '<div style="width:20px;height:20px;background:#000;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker([origin.lat, origin.lon], { icon }).addTo(map);

      mapObj.current = map;
      drawRoute(L);
    }

    function drawRoute(L: typeof import('leaflet')) {
      if (!mapObj.current) return;
      routeLayer.current?.remove();

      const latlngs = routeGeometry.map((c) => [c.lat, c.lon] as [number, number]);
      if (latlngs.length === 0) return;

      routeLayer.current = L.polyline(latlngs, {
        color: '#000',
        weight: 4,
        opacity: 0.8,
      }).addTo(mapObj.current);

      mapObj.current.fitBounds(routeLayer.current.getBounds(), { padding: [30, 30] });
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

    async function update() {
      const L = await import('leaflet');
      if (!mapObj.current) return;

      routeLayer.current?.remove();
      const latlngs = routeGeometry.map((c) => [c.lat, c.lon] as [number, number]);
      if (latlngs.length === 0) return;

      routeLayer.current = L.polyline(latlngs, {
        color: '#000',
        weight: 4,
        opacity: 0.8,
      }).addTo(mapObj.current);

      mapObj.current.fitBounds(routeLayer.current.getBounds(), { padding: [30, 30] });
    }

    update();
  }, [routeIndex, routeGeometry]);

  return (
    <div
      ref={mapRef}
      className="w-full h-[400px] rounded-xl overflow-hidden border border-gray-200"
    />
  );
}
