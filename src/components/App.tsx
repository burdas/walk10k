import { useState, useCallback } from 'react';
import RouteForm from './RouteForm';
import RouteMap from './RouteMap';
import RouteCardList from './RouteCard';
import type { Coordinates, RouteResult } from '../types/routes';

type AppState = 'form' | 'loading' | 'results' | 'error';

const EMPTY_GEOMETRY: Coordinates[] = [];

export default function App() {
  const [state, setState] = useState<AppState>('form');
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [previewOrigin, setPreviewOrigin] = useState<Coordinates | null>(null);
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFormReady = useCallback(
    async (orig: Coordinates, stepCount: number, stepLength: number) => {
      setOrigin(orig);
      setState('loading');
      setErrorMsg('');
      try {
        const res = await fetch('/api/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: orig.lat,
            lon: orig.lon,
            steps: stepCount,
            stepLength,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'No se pudieron generar las rutas');
          setState('error');
          return;
        }
        setRoutes(data.routes);
        setSelectedIdx(0);
        setState('results');
      } catch {
        setErrorMsg('Error de red al generar las rutas');
        setState('error');
      }
    },
    []
  );

  const handleError = useCallback((msg: string) => {
    setErrorMsg(msg);
    setState('error');
    setTimeout(() => setState('form'), 4000);
  }, []);

  const handleBack = useCallback(() => {
    setState('form');
    setRoutes([]);
    setErrorMsg('');
  }, []);

  const mapOrigin = origin ?? previewOrigin;
  const showMap = state === 'results' && origin && routes.length > 0;

  return (
    <div className="relative h-screen w-screen">
      {/* Mapa siempre visible */}
      <div className="absolute inset-0 z-0">
        <RouteMap
          origin={mapOrigin}
          routeGeometry={showMap ? routes[selectedIdx].geometry : EMPTY_GEOMETRY}
          routeIndex={selectedIdx}
          showRoute={showMap}
        />
      </div>

      {/* UI flotante alineada a la izquierda */}
      <div className="absolute inset-y-0 left-0 z-10 flex items-center justify-start p-4 sm:p-6 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-xs sm:max-w-sm">
          {state === 'form' && (
            <RouteForm
              onSubmit={handleFormReady}
              onError={handleError}
              onOriginPreview={setPreviewOrigin}
            />
          )}

          {state === 'loading' && (
            <div className="liquid-glass-strong rounded-2xl px-8 py-10 flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-3 border-gray-300 border-t-black rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Generando rutas circulares...</p>
            </div>
          )}

          {state === 'error' && (
            <div className="liquid-glass-strong rounded-2xl px-8 py-10 flex flex-col items-center gap-4">
              <p className="text-sm text-destructive text-center">{errorMsg}</p>
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 rounded-lg text-sm transition-colors bg-muted hover:bg-accent"
              >
                Volver
              </button>
            </div>
          )}

          {state === 'results' && routes.length > 0 && (
            <div className="flex flex-col gap-3">
              <RouteCardList
                routes={routes}
                selectedIndex={selectedIdx}
                onSelect={setSelectedIdx}
              />
              <button
                type="button"
                onClick={handleBack}
                className="liquid-glass w-full px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Nueva búsqueda
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
