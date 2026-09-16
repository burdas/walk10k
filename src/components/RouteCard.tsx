import type { RouteResult } from '../types/routes';
import { formatDistance, formatDuration, metersToSteps } from '../lib/distance';
import { STEP_LENGTH_DEFAULT } from '../lib/constants';

interface Props {
  routes: RouteResult[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export default function RouteCardList({ routes, selectedIndex, onSelect }: Props) {
  if (routes.length === 0) return null;

  return (
    <div className="w-full max-w-md space-y-3">
      <h2 className="text-sm font-medium text-gray-500 text-center">Rutas encontradas</h2>
      {routes.map((route, i) => (
        <button
          key={route.seed}
          type="button"
          onClick={() => onSelect(i)}
          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
            selectedIndex === i
              ? 'border-black bg-gray-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="font-semibold text-sm">Ruta {i + 1}</span>
              <span className="text-xs text-gray-400 ml-2">#{route.seed}</span>
            </div>
            <span className="text-xs text-gray-400">
              {formatDistance(route.distance)}
            </span>
          </div>
          <div className="mt-1 text-xs text-gray-500 space-x-3">
            <span>{metersToSteps(route.distance, STEP_LENGTH_DEFAULT).toLocaleString('es-ES')} pasos</span>
            <span>{formatDuration(route.duration)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
