import { useState } from 'react';
import StepSelector from './StepSelector';
import OriginSelector from './OriginSelector';
import type { Coordinates } from '../types/routes';
import { STEP_LENGTH_DEFAULT } from '../lib/constants';

interface Props {
  onSubmit: (origin: Coordinates, steps: number, stepLength: number) => void;
  onError: (msg: string) => void;
}

export default function RouteForm({ onSubmit, onError }: Props) {
  const [steps, setSteps] = useState(10000);
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [originLabel, setOriginLabel] = useState<string>('');

  function handleSubmit() {
    if (!origin) {
      onError('Selecciona un punto de inicio');
      return;
    }
    onSubmit(origin, steps, STEP_LENGTH_DEFAULT);
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <h1 className="text-4xl font-bold tracking-tight">Walk10K</h1>
      <StepSelector value={steps} onChange={setSteps} />
      <OriginSelector
        onLocation={(lat, lon, label) => {
          setOrigin({ lat, lon });
          setOriginLabel(label || '');
        }}
        onError={onError}
      />
      {originLabel && (
        <p className="text-xs text-gray-400 max-w-xs text-center truncate">{originLabel}</p>
      )}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!origin}
        className="w-full max-w-xs px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        GENERAR RUTAS
      </button>
    </div>
  );
}
