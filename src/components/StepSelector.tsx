import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { STEP_OPTIONS } from '../lib/constants';

interface Props {
  value: number;
  onChange: (steps: number) => void;
  compact?: boolean;
}

const MIN_STEPS = 100;
const MAX_STEPS = 100000;

export default function StepSelector({ value, onChange, compact }: Props) {
  const [openCustom, setOpenCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  function handleCustomAccept() {
    const parsed = Number.parseInt(customValue, 10);
    if (!Number.isNaN(parsed) && parsed >= MIN_STEPS && parsed <= MAX_STEPS) {
      onChange(parsed);
      setOpenCustom(false);
      setCustomValue('');
    }
  }

  if (compact) {
    return (
      <>
        <div className="flex flex-wrap justify-center gap-1.5">
          {STEP_OPTIONS.map((opt) => (
            <Button
              key={opt}
              variant={value === opt ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange(opt)}
            >
              {opt.toLocaleString('es-ES')}
            </Button>
          ))}
          <Button
            variant={value > 0 && !STEP_OPTIONS.includes(value as (typeof STEP_OPTIONS)[number]) ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setCustomValue(String(value));
              setOpenCustom(true);
            }}
          >
            Custom
          </Button>
        </div>

        {openCustom && (
          <CustomDialog
            value={customValue}
            onChange={setCustomValue}
            onAccept={handleCustomAccept}
            onCancel={() => { setOpenCustom(false); setCustomValue(''); }}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <label className="text-xs text-muted-foreground">¿Cuántos pasos quieres dar?</label>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            const idx = STEP_OPTIONS.indexOf(value as (typeof STEP_OPTIONS)[number]);
            if (idx > 0) onChange(STEP_OPTIONS[idx - 1]);
          }}
          aria-label="Menos pasos"
        >
          −
        </Button>
        <span className="text-2xl font-bold w-24 text-center tabular-nums">
          {value.toLocaleString('es-ES')}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            const idx = STEP_OPTIONS.indexOf(value as (typeof STEP_OPTIONS)[number]);
            if (idx >= 0 && idx < STEP_OPTIONS.length - 1) onChange(STEP_OPTIONS[idx + 1]);
          }}
          aria-label="Más pasos"
        >
          +
        </Button>
      </div>
      <div className="flex flex-wrap sm:flex-nowrap justify-center gap-1.5">
        {STEP_OPTIONS.map((opt) => (
          <Button
            key={opt}
            variant={value === opt ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(opt)}
          >
            {opt.toLocaleString('es-ES')}
          </Button>
        ))}
      </div>
    </div>
  );
}

function CustomDialog({
  value,
  onChange,
  onAccept,
  onCancel,
}: {
  value: string;
  onChange: (v: string) => void;
  onAccept: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Pasos personalizados"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="liquid-glass-strong rounded-2xl p-6 w-72 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 fill-mode-both"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold">Pasos personalizados</h3>
        <Input
          type="number"
          inputMode="numeric"
          min={MIN_STEPS}
          max={MAX_STEPS}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onAccept(); }}
          placeholder={`${MIN_STEPS} – ${MAX_STEPS.toLocaleString('es-ES')}`}
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button onClick={onAccept}>Aceptar</Button>
        </div>
      </div>
    </div>
  );
}
