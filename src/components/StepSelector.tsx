import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { STEP_OPTIONS } from '../lib/constants';

interface Props {
  value: number;
  onChange: (steps: number) => void;
}

export default function StepSelector({ value, onChange }: Props) {
  const isCustom = !STEP_OPTIONS.includes(value as (typeof STEP_OPTIONS)[number]);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <label className="text-xs text-gray-500">¿Cuántos pasos quieres dar?</label>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            const idx = STEP_OPTIONS.indexOf(value as (typeof STEP_OPTIONS)[number]);
            if (idx > 0) onChange(STEP_OPTIONS[idx - 1]);
            else if (isCustom) onChange(STEP_OPTIONS[STEP_OPTIONS.length - 1]);
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
            else if (isCustom) onChange(STEP_OPTIONS[0]);
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
      <div className="flex items-center gap-2">
        <label htmlFor="custom-steps" className="text-xs text-gray-400">
          Custom:
        </label>
        <Input
          id="custom-steps"
          type="number"
          min={100}
          max={100000}
          step={500}
          value={value}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v) && v >= 100 && v <= 100000) onChange(v);
          }}
          className="w-24 text-center"
        />
      </div>
    </div>
  );
}
