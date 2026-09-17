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
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { GeocodeSuggestion } from '../types/routes';

export interface OriginSelectorHandle {
  getSelectedAddress: () => GeocodeSuggestion | null;
}

interface Props {
  onLocation: (lat: number, lon: number, label?: string) => void;
  onRemoveAddress?: (id: string) => void;
  recentAddresses: GeocodeSuggestion[];
  ref?: React.Ref<OriginSelectorHandle>;
}

const MIN_QUERY_LENGTH = 3;

export default function OriginSelector({ onLocation, onRemoveAddress, recentAddresses, ref }: Props) {
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  const debouncedAddress = useDebouncedValue(address, 350);
  const selectedLabelRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const selectedAddressRef = useRef<GeocodeSuggestion | null>(null);

  useImperativeHandle(ref, () => ({
    getSelectedAddress: () => selectedAddressRef.current,
  }));

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
    selectedAddressRef.current = item;
    setAddress(item.label);
    setSuggestions([]);
    setOpen(false);
    onLocation(item.lat, item.lon, item.label);
  }

  function handleRecentClick(item: GeocodeSuggestion) {
    selectedLabelRef.current = item.label;
    selectedAddressRef.current = item;
    setAddress(item.label);
    setOpen(false);
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

      {recentAddresses.length > 0 && (
        <div className="w-full flex flex-col gap-2">
          <span className="text-xs text-muted-foreground px-1">Últimas direcciones</span>
          {recentAddresses.map((item) => (
            <div
              key={item.id}
              className="liquid-glass liquid-glass-interactive group relative w-full text-left px-4 py-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => handleRecentClick(item)}
            >
              <span className="block text-sm font-medium truncate pr-6">{item.primary}</span>
              {item.secondary && (
                <span className="block text-xs text-muted-foreground truncate pr-6">{item.secondary}</span>
              )}
              {onRemoveAddress && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveAddress(item.id);
                  }}
                  className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors opacity-50 md:opacity-0 md:group-hover:opacity-100"
                  aria-label={`Eliminar ${item.primary}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
