import { useState, useCallback, useEffect, useRef } from 'react';
import RouteForm from './RouteForm';
import RouteMap from './RouteMap';
import RouteCardList from './RouteCard';
import SettingsButton from './SettingsButton';
import type { Coordinates, GeocodeSuggestion, RouteResult } from '../types/routes';
import { loadSettings, saveSettings, type Settings } from '../lib/settings';
import { RECENT_ADDRESSES_KEY } from '../lib/constants';

type AppState = 'form' | 'loading' | 'results' | 'error';

const EMPTY_GEOMETRY: Coordinates[] = [];

const MAX_RECENT = 3;

function readRecentAddresses(): GeocodeSuggestion[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_ADDRESSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item: GeocodeSuggestion) =>
        typeof item?.lat === 'number' &&
        typeof item?.lon === 'number' &&
        !(item.lat === 0 && item.lon === 0) &&
        typeof item?.label === 'string' &&
        item.label.length > 0
    );
  } catch {
    return [];
  }
}

function saveRecentAddresses(addresses: GeocodeSuggestion[]) {
  try {
    window.localStorage.setItem(RECENT_ADDRESSES_KEY, JSON.stringify(addresses));
  } catch {
    // localStorage no disponible
  }
}

export default function App() {
  const [state, setState] = useState<AppState>('form');
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [previewOrigin, setPreviewOrigin] = useState<Coordinates | null>(null);
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [recentAddresses, setRecentAddresses] = useState<GeocodeSuggestion[]>(() => readRecentAddresses());
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const handleSettingsChange = useCallback((next: Settings) => {
    setSettings(next);
  }, []);

  const handleSaveAddress = useCallback((item: GeocodeSuggestion) => {
    setRecentAddresses((prev) => {
      const filtered = prev.filter((a) => a.id !== item.id);
      const next = [item, ...filtered].slice(0, MAX_RECENT);
      saveRecentAddresses(next);
      return next;
    });
  }, []);

  const handleRemoveAddress = useCallback((id: string) => {
    setRecentAddresses((prev) => {
      const next = prev.filter((a) => a.id !== id);
      saveRecentAddresses(next);
      return next;
    });
  }, []);

  const handleFormReady = useCallback(
    async (orig: Coordinates, stepCount: number, stepLength: number) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

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
            toleranceRatio: settings.toleranceRatio,
          }),
          signal: controller.signal,
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
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setErrorMsg('Error de red al generar las rutas');
        setState('error');
      }
    },
    [settings.toleranceRatio]
  );

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setState('form');
  }, []);

  const handleError = useCallback((msg: string) => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setErrorMsg(msg);
    setState('error');
    errorTimerRef.current = setTimeout(() => setState('form'), 4000);
  }, []);

  const handleBack = useCallback(() => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
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

      {/* Bottom sheet en móvil, panel lateral en desktop */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:inset-y-0 sm:bottom-auto sm:left-0 sm:right-auto sm:items-center sm:justify-start sm:p-6 pointer-events-none">
        <div className="pointer-events-auto w-full sm:max-w-sm max-h-[50vh] sm:max-h-[calc(100vh-2rem)] overflow-y-auto">
          {state === 'form' && (
            <div
              key="form"
              className="animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-left-4 zoom-in-95 duration-500 fill-mode-both"
            >
              <RouteForm
                onSubmit={handleFormReady}
                onSaveAddress={handleSaveAddress}
                onRemoveAddress={handleRemoveAddress}
                onError={handleError}
                onOriginPreview={setPreviewOrigin}
                stepLength={settings.stepLength}
                recentAddresses={recentAddresses}
              />
            </div>
          )}

          {state === 'loading' && (
            <div
              key="loading"
              role="status"
              aria-live="polite"
              className="liquid-glass-strong rounded-2xl px-8 py-10 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300 fill-mode-both"
            >
              <div className="w-8 h-8 border-3 border-gray-300 border-t-black rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Generando rutas circulares...</p>
              <button
                type="button"
                onClick={handleCancel}
                className="cursor-pointer px-4 py-2 rounded-lg text-sm transition-all hover:scale-[1.03] active:scale-95 bg-muted hover:bg-accent"
              >
                Cancelar
              </button>
            </div>
          )}

          {state === 'error' && (
            <div
              key="error"
              role="alert"
              aria-live="assertive"
              className="liquid-glass-strong rounded-2xl px-8 py-10 flex flex-col items-center gap-4 animate-[glass-shake_0.5s_ease-in-out_both]"
            >
              <p className="text-sm text-destructive text-center">{errorMsg}</p>
              <button
                type="button"
                onClick={handleBack}
                className="cursor-pointer px-4 py-2 rounded-lg text-sm transition-all hover:scale-[1.03] active:scale-95 bg-muted hover:bg-accent"
              >
                Volver
              </button>
            </div>
          )}

          {state === 'results' && routes.length > 0 && (
            <div
              key="results"
              role="list"
              aria-live="polite"
              className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-left-4 duration-500 fill-mode-both"
            >
              <div className="scrollbar-hidden scroll-fade-bottom overflow-y-auto overflow-x-hidden p-1 -m-1">
                <RouteCardList
                  routes={routes}
                  selectedIndex={selectedIdx}
                  onSelect={setSelectedIdx}
                />
              </div>
              <button
                type="button"
                onClick={handleBack}
                className="liquid-glass liquid-glass-interactive cursor-pointer w-full px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground"
              >
                Nueva búsqueda
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ajustes */}
      <div className="absolute top-4 left-4 pt-[max(0rem,env(safe-area-inset-top))] sm:left-auto sm:right-4 sm:top-6 z-20">
        <SettingsButton settings={settings} onChange={handleSettingsChange} />
      </div>
    </div>
  );
}
