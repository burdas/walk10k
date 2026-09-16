import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface Props {
  onLocation: (lat: number, lon: number, label?: string) => void;
  onError: (msg: string) => void;
}

export default function OriginSelector({ onLocation, onError }: Props) {
  const [mode, setMode] = useState<'idle' | 'gps' | 'address'>('idle');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  function useGeolocation() {
    setMode('gps');
    if (!navigator.geolocation) {
      onError('Tu navegador no soporta geolocalización');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocation(pos.coords.latitude, pos.coords.longitude, 'Tu ubicación actual');
      },
      () => {
        onError('No se pudo obtener tu ubicación. Permite el acceso a la ubicación.');
        setMode('idle');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function searchAddress() {
    if (!address.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error || 'Dirección no encontrada');
        return;
      }
      onLocation(data.lat, data.lon, data.displayName);
    } catch {
      onError('Error al buscar la dirección');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-xs text-gray-500">Punto de inicio</span>
      <Button
        variant="outline"
        onClick={useGeolocation}
        disabled={mode === 'gps'}
        className="w-full"
      >
        {mode === 'gps' ? 'Obteniendo ubicación...' : '📍 Usar mi ubicación'}
      </Button>
      <span className="text-xs text-gray-400">o</span>
      <div className="flex flex-col items-center gap-2 w-full">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchAddress()}
          placeholder="Calle Mayor 15, Peralta"
        />
        <Button
          variant="outline"
          onClick={searchAddress}
          disabled={loading || !address.trim()}
          className="w-full"
        >
          {loading ? 'Buscando...' : 'Buscar dirección'}
        </Button>
      </div>
    </div>
  );
}
