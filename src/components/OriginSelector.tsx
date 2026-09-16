import {
  Autocomplete,
  AutocompleteInput,
  AutocompletePortal,
  AutocompletePositioner,
  AutocompletePopup,
  AutocompleteList,
  AutocompleteItem,
  AutocompleteEmpty,
  AutocompleteStatus,
} from '@/components/ui/autocomplete';
import { useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { GeocodeSuggestion } from '../types/routes';
import { LAST_ADDRESS_KEY } from '../lib/constants';

interface Props {
  onLocation: (lat: number, lon: number, label?: string) => void;
}

const MIN_QUERY_LENGTH = 3;

function readStoredAddress(): GeocodeSuggestion | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LAST_ADDRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GeocodeSuggestion;
    if (
      typeof parsed?.lat !== 'number' ||
      typeof parsed?.lon !== 'number' ||
      typeof parsed?.label !== 'string' ||
      parsed.label.length === 0
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export default function OriginSelector({ onLocation }: Props) {
  const [storedAddress] = useState(readStoredAddress);
  const [address, setAddress] = useState(() => storedAddress?.label ?? '');
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  const debouncedAddress = useDebouncedValue(address, 350);
  const selectedLabelRef = useRef<string | null>(storedAddress?.label ?? null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!storedAddress) return;
    onLocation(storedAddress.lat, storedAddress.lon, storedAddress.label);
    // Restaura el origen solo una vez al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const query = debouncedAddress.trim();

    if (selectedLabelRef.current !== null && debouncedAddress === selectedLabelRef.current) {
      selectedLabelRef.current = null;
      return;
    }

    if (query.length < MIN_QUERY_LENGTH) {
      abortRef.current?.abort();
      setSuggestions([]);
      setSearching(false);
      setOpen(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSearching(true);
    setOpen(true);

    fetch(`/api/geocode?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((res) => res.json() as Promise<{ suggestions?: GeocodeSuggestion[] }>)
      .then((data) => {
        if (controller.signal.aborted) return;
        setSuggestions(data.suggestions ?? []);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (controller.signal.aborted) return;
        setSuggestions([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setSearching(false);
      });

    return () => controller.abort();
  }, [debouncedAddress]);

  function handleSelect(item: GeocodeSuggestion) {
    selectedLabelRef.current = item.label;
    setAddress(item.label);
    setSuggestions([]);
    setOpen(false);
    try {
      window.localStorage.setItem(LAST_ADDRESS_KEY, JSON.stringify(item));
    } catch {
      // localStorage no disponible (modo privado o cuota); se ignora
    }
    onLocation(item.lat, item.lon, item.label);
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="w-full">
        <Autocomplete
          items={suggestions}
          filter={null}
          value={address}
          onValueChange={(value) => setAddress(value)}
          itemToStringValue={(item) => item.label}
          open={open}
          onOpenChange={setOpen}
          autoHighlight
        >
          <AutocompleteInput placeholder="Calle Mayor 15, Peralta" />
          <AutocompletePortal>
            <AutocompletePositioner>
              <AutocompletePopup>
                <AutocompleteList>
                  {(item: GeocodeSuggestion) => (
                    <AutocompleteItem
                      key={item.id}
                      value={item}
                      onClick={() => handleSelect(item)}
                    >
                      <span className="font-medium">{item.primary}</span>
                      {item.secondary && (
                        <span className="text-xs text-muted-foreground">{item.secondary}</span>
                      )}
                    </AutocompleteItem>
                  )}
                </AutocompleteList>
                {searching && (
                  <AutocompleteStatus>Buscando direcciones…</AutocompleteStatus>
                )}
                {!searching && suggestions.length === 0 && (
                  <AutocompleteEmpty>Sin resultados</AutocompleteEmpty>
                )}
                <div className="border-t border-border px-3 py-1.5 text-[10px] leading-tight text-muted-foreground">
                  Datos: CartoCiudad (IGN) · OpenStreetMap
                </div>
              </AutocompletePopup>
            </AutocompletePositioner>
          </AutocompletePortal>
        </Autocomplete>
      </div>
    </div>
  );
}
