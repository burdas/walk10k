import { Button } from '@/components/ui/button';
import { STEP_OPTIONS } from '../lib/constants';

interface Props {
  value: number;
  onChange: (steps: number) => void;
}

export default function StepSelector({ value, onChange }: Props) {
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
      </div>
    </div>
  );
}
