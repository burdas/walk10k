import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
    <div className="space-y-2">
      {routes.map((route, i) => (
        <button
          key={route.seed}
          type="button"
          onClick={() => onSelect(i)}
          className="w-full text-left"
        >
          <Card
            className={cn(
              'liquid-glass bg-transparent! shadow-sm cursor-pointer transition-all hover:brightness-105',
              selectedIndex === i ? 'ring-2! ring-foreground/70' : 'ring-0!'
            )}
            size="sm"
          >
            <CardContent className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm">Ruta {i + 1}</span>
                <Badge variant="secondary">
                  {formatDistance(route.distance)}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{metersToSteps(route.distance, STEP_LENGTH_DEFAULT).toLocaleString('es-ES')} pasos</span>
                <span>{formatDuration(route.duration)}</span>
              </div>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}
