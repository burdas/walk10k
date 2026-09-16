import { useEffect, useRef, useState } from 'react';
import { Settings as SettingsIcon, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { sanitizeSettings, type Settings } from '@/lib/settings';
import {
  DEFAULT_SETTINGS,
  MAX_STEP_LENGTH_M,
  MAX_TOLERANCE_RATIO,
  MIN_STEP_LENGTH_M,
  MIN_TOLERANCE_RATIO,
} from '@/lib/constants';

interface Props {
  settings: Settings;
  onChange: (settings: Settings) => void;
}

const STEP_PRESETS = [0.6, 0.75, 0.9];
const TOLERANCE_PRESETS = [0.1, 0.25, 0.4];

export default function SettingsButton({ settings, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [stepDraft, setStepDraft] = useState(String(settings.stepLength));
  const [toleranceDraft, setToleranceDraft] = useState(
    String(Math.round(settings.toleranceRatio * 100))
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStepDraft(String(settings.stepLength));
    setToleranceDraft(String(Math.round(settings.toleranceRatio * 100)));
  }, [settings]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function commitStep(value: string) {
    const parsed = Number.parseFloat(value.replace(',', '.'));
    const next = sanitizeSettings({ ...settings, stepLength: parsed });
    onChange(next);
    setStepDraft(String(next.stepLength));
  }

  function commitTolerance(value: string) {
    const parsed = Number.parseFloat(value.replace(',', '.'));
    const next = sanitizeSettings({ ...settings, toleranceRatio: parsed / 100 });
    onChange(next);
    setToleranceDraft(String(Math.round(next.toleranceRatio * 100)));
  }

  const isDefault =
    settings.stepLength === DEFAULT_SETTINGS.stepLength &&
    settings.toleranceRatio === DEFAULT_SETTINGS.toleranceRatio;

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="outline"
        size="icon-lg"
        className="liquid-glass liquid-glass-interactive rounded-xl border-transparent! bg-transparent! text-foreground hover:bg-transparent! aria-expanded:bg-transparent!"
        aria-label="Ajustes"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <SettingsIcon
          className={cn('transition-transform duration-300', open && 'rotate-90')}
        />
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Ajustes de cálculo"
          className="liquid-glass-strong absolute right-0 top-full z-20 mt-2 w-72 origin-top-right rounded-2xl p-5 flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200 fill-mode-both"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Ajustes</h2>
            <Button
              variant="ghost"
              size="xs"
              disabled={isDefault}
              onClick={() => onChange(DEFAULT_SETTINGS)}
            >
              <RotateCcw />
              Restablecer
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="step-length" className="text-xs text-muted-foreground">
              Longitud del paso (metros)
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="step-length"
                type="number"
                inputMode="decimal"
                min={MIN_STEP_LENGTH_M}
                max={MAX_STEP_LENGTH_M}
                step={0.05}
                value={stepDraft}
                onChange={(e) => setStepDraft(e.target.value)}
                onBlur={() => commitStep(stepDraft)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitStep(stepDraft);
                }}
              />
              <span className="text-sm text-muted-foreground">m</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STEP_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  variant={settings.stepLength === preset ? 'default' : 'outline'}
                  size="xs"
                  onClick={() => onChange({ ...settings, stepLength: preset })}
                >
                  {preset} m
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="tolerance" className="text-xs text-muted-foreground">
              Margen de las rutas (%)
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="tolerance"
                type="number"
                inputMode="numeric"
                min={MIN_TOLERANCE_RATIO * 100}
                max={MAX_TOLERANCE_RATIO * 100}
                step={1}
                value={toleranceDraft}
                onChange={(e) => setToleranceDraft(e.target.value)}
                onBlur={() => commitTolerance(toleranceDraft)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitTolerance(toleranceDraft);
                }}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TOLERANCE_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  variant={settings.toleranceRatio === preset ? 'default' : 'outline'}
                  size="xs"
                  onClick={() => onChange({ ...settings, toleranceRatio: preset })}
                >
                  ±{Math.round(preset * 100)}%
                </Button>
              ))}
            </div>
          </div>

          <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
            El margen define cuánto puede alejarse la distancia real de la ruta de tu
            objetivo.
          </p>
        </div>
      )}
    </div>
  );
}
