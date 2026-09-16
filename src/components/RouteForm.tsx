import { useState } from 'react';
import { Button } from '@/components/ui/button';
import StepSelector from './StepSelector';
import OriginSelector from './OriginSelector';
import type { Coordinates } from '../types/routes';

interface Props {
  onSubmit: (origin: Coordinates, steps: number, stepLength: number) => void;
  onError: (msg: string) => void;
  onOriginPreview: (origin: Coordinates | null) => void;
  stepLength: number;
}

export default function RouteForm({ onSubmit, onError, onOriginPreview, stepLength }: Props) {
  const [steps, setSteps] = useState(10000);
  const [origin, setOrigin] = useState<Coordinates | null>(null);

  function handleSubmit() {
    if (!origin) {
      onError('Selecciona un punto de inicio');
      return;
    }
    onSubmit(origin, steps, stepLength);
  }

  return (
    <div className="liquid-glass-strong rounded-2xl px-8 py-10 flex flex-col items-center gap-6 w-full">
      <h1 className="text-3xl font-bold tracking-tight">Walk10K</h1>
      <StepSelector value={steps} onChange={setSteps} />
      <OriginSelector
        onLocation={(lat, lon) => {
          const nextOrigin = { lat, lon };
          setOrigin(nextOrigin);
          onOriginPreview(nextOrigin);
        }}
      />
      <Button
        onClick={handleSubmit}
        disabled={!origin}
        className="w-full"
        size="lg"
      >
        GENERAR RUTAS
      </Button>
    </div>
  );
}
