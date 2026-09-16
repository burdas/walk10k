import { useState, useCallback } from 'react';
import RouteForm from './RouteForm';
import RouteMap from './RouteMap';
import RouteCardList from './RouteCard';
import type { Coordinates, RouteResult } from '../types/routes';

type AppState = 'form' | 'loading' | 'results' | 'error';

export default function App() {
  const [state, setState] = useState<AppState>('form');
  const [origin, setOrigin] = useState<Coordinates | null>(null);
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

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-3 border-gray-300 border-t-black rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Generando rutas circulares...</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-sm text-red-600 text-center max-w-xs">{errorMsg}</p>
        <button
          type="button"
          onClick={handleBack}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
        >
          Volver
        </button>
      </div>
    );
  }

  if (state === 'results' && origin && routes.length > 0) {
    const selectedRoute = routes[selectedIdx];
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
        <div className="w-full">
          <RouteMap
            origin={origin}
            routeGeometry={selectedRoute.geometry}
            routeIndex={selectedIdx}
          />
        </div>
        <RouteCardList
          routes={routes}
          selectedIndex={selectedIdx}
          onSelect={setSelectedIdx}
        />
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={handleBack}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
          >
            Nueva búsqueda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <RouteForm onSubmit={handleFormReady} onError={handleError} />
      {state === 'error' && errorMsg && (
        <p className="text-sm text-red-600 mt-2">{errorMsg}</p>
      )}
    </div>
  );
}
