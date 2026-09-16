import { STEP_OPTIONS } from '../lib/constants';

interface Props {
  value: number;
  onChange: (steps: number) => void;
}

export default function StepSelector({ value, onChange }: Props) {
  const isCustom = !STEP_OPTIONS.includes(value as (typeof STEP_OPTIONS)[number]);

  return (
    <div className="flex flex-col items-center gap-3">
      <label className="text-sm text-gray-500">¿Cuántos pasos quieres dar?</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const idx = STEP_OPTIONS.indexOf(value as (typeof STEP_OPTIONS)[number]);
            if (idx > 0) onChange(STEP_OPTIONS[idx - 1]);
            else if (isCustom) onChange(STEP_OPTIONS[STEP_OPTIONS.length - 1]);
          }}
          className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 text-xl font-bold flex items-center justify-center transition-colors"
          aria-label="Menos pasos"
        >
          −
        </button>
        <span className="text-3xl font-bold w-28 text-center tabular-nums">
          {value.toLocaleString('es-ES')}
        </span>
        <button
          type="button"
          onClick={() => {
            const idx = STEP_OPTIONS.indexOf(value as (typeof STEP_OPTIONS)[number]);
            if (idx >= 0 && idx < STEP_OPTIONS.length - 1) onChange(STEP_OPTIONS[idx + 1]);
            else if (isCustom) onChange(STEP_OPTIONS[0]);
          }}
          className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 text-xl font-bold flex items-center justify-center transition-colors"
          aria-label="Más pasos"
        >
          +
        </button>
      </div>
      <div className="flex flex-wrap justify-center gap-1.5 mt-1">
        {STEP_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              value === opt
                ? 'bg-black text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {opt.toLocaleString('es-ES')}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <label htmlFor="custom-steps" className="text-xs text-gray-400">
          Personalizado:
        </label>
        <input
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
          className="w-24 text-center border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>
    </div>
  );
}
