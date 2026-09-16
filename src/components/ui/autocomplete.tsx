import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete"
import { cn } from "cn"

const Autocomplete = AutocompletePrimitive.Root

function AutocompleteInput({ className, ...props }: AutocompletePrimitive.Input.Props) {
  return (
    <AutocompletePrimitive.Input
      data-slot="autocomplete-input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

function AutocompletePortal({ ...props }: AutocompletePrimitive.Portal.Props) {
  return <AutocompletePrimitive.Portal {...props} />
}

function AutocompletePositioner({ className, ...props }: AutocompletePrimitive.Positioner.Props) {
  return (
    <AutocompletePrimitive.Positioner
      sideOffset={4}
      className={cn("z-[1100] outline-none", className)}
      {...props}
    />
  )
}

function AutocompletePopup({ className, ...props }: AutocompletePrimitive.Popup.Props) {
  return (
    <AutocompletePrimitive.Popup
      data-slot="autocomplete-popup"
      className={cn(
        "max-h-[min(20rem,var(--available-height))] w-[var(--anchor-width)] overflow-hidden rounded-xl border border-border bg-popover/95 text-popover-foreground shadow-lg backdrop-blur-xl",
        "origin-[var(--transform-origin)] transition-[transform,opacity] data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function AutocompleteList({ className, ...props }: AutocompletePrimitive.List.Props) {
  return (
    <AutocompletePrimitive.List
      data-slot="autocomplete-list"
      className={cn("max-h-64 overflow-y-auto overscroll-contain p-1", className)}
      {...props}
    />
  )
}

function AutocompleteItem({ className, ...props }: AutocompletePrimitive.Item.Props) {
  return (
    <AutocompletePrimitive.Item
      data-slot="autocomplete-item"
      className={cn(
        "flex cursor-default flex-col gap-0.5 rounded-lg px-2.5 py-1.5 text-sm outline-none select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

function AutocompleteEmpty({ className, ...props }: AutocompletePrimitive.Empty.Props) {
  return (
    <AutocompletePrimitive.Empty
      data-slot="autocomplete-empty"
      className={cn("px-3 py-2 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function AutocompleteStatus({ className, ...props }: AutocompletePrimitive.Status.Props) {
  return (
    <AutocompletePrimitive.Status
      data-slot="autocomplete-status"
      className={cn("px-3 py-2 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Autocomplete,
  AutocompleteInput,
  AutocompletePortal,
  AutocompletePositioner,
  AutocompletePopup,
  AutocompleteList,
  AutocompleteItem,
  AutocompleteEmpty,
  AutocompleteStatus,
}
