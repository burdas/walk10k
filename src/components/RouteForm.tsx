import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import StepSelector from './StepSelector';
import OriginSelector from './OriginSelector';
import type { Coordinates, GeocodeSuggestion } from '../types/routes';
import type { OriginSelectorHandle } from './OriginSelector';

interface Props {
  onSubmit: (origin: Coordinates, steps: number, stepLength: number) => void;
  onSaveAddress?: (item: GeocodeSuggestion) => void;
  onRemoveAddress?: (id: string) => void;
  onError: (msg: string) => void;
  onOriginPreview: (origin: Coordinates | null) => void;
  stepLength: number;
  recentAddresses: GeocodeSuggestion[];
}

export default function RouteForm({ onSubmit, onSaveAddress, onRemoveAddress, onError, onOriginPreview, stepLength, recentAddresses }: Props) {
  const [steps, setSteps] = useState(10000);
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const originRef = useRef<OriginSelectorHandle>(null);

  function handleSubmit() {
    if (!origin) {
      onError('Selecciona un punto de inicio');
      return;
    }
    const selected = originRef.current?.getSelectedAddress();
    if (selected && onSaveAddress) {
      onSaveAddress(selected);
    }
    onSubmit(origin, steps, stepLength);
  }

  return (
    <div className="liquid-glass-strong rounded-2xl px-4 py-6 sm:px-8 sm:py-10 flex flex-col items-center gap-3 sm:gap-6 w-full">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Walk10K</h1>

      {/* Búsqueda: ancho completo en ambos layouts */}
      <div className="w-full">
        <OriginSelector
          ref={originRef}
          recentAddresses={recentAddresses}
          onRemoveAddress={onRemoveAddress}
          onLocation={(lat, lon) => {
            const nextOrigin = { lat, lon };
            setOrigin(nextOrigin);
            onOriginPreview(nextOrigin);
          }}
        />
      </div>

      {/* Móvil: chips + botón en fila */}
      <div className="flex gap-2 items-center w-full sm:hidden">
        <StepSelector value={steps} onChange={setSteps} compact />
        <Button
          onClick={handleSubmit}
          disabled={!origin}
          className="shrink-0"
        >
          GENERAR
        </Button>
      </div>

      {/* Desktop: chips centrados + botón full width */}
      <div className="hidden sm:flex sm:flex-col sm:items-center sm:gap-6 sm:w-full">
        <StepSelector value={steps} onChange={setSteps} />
        <Button
          onClick={handleSubmit}
          disabled={!origin}
          className="w-full"
          size="lg"
        >
          GENERAR RUTAS
        </Button>
      </div>
    </div>
  );
}
