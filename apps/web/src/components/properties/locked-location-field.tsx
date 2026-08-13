"use client";

import { Pencil } from "lucide-react";

interface LockedLocationFieldProps {
  label: string;
  value: string;
  onClear: () => void;
  required?: boolean;
  emptyHint?: string;
}

// District (and similar location fields resolved from the map/search picker
// above) used to be a plain free-text input a seller could retype over the
// autofilled value -- the reason the same real district ends up in the data
// as a dozen casing/spelling variants. Once a value is set, this renders it
// read-only with an explicit "Change" action that clears it back to empty so
// the seller re-resolves it via the location picker instead of hand-typing.
export function LockedLocationField({ label, value, onClear, required, emptyHint }: LockedLocationFieldProps) {
  return (
    <div>
      <label className="mb-2 block font-body text-sm text-cream/81">
        {label} {required && "*"}
      </label>
      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-cream/10 bg-onyx-800/50 px-4 py-3">
          <span className="truncate text-sm text-cream">{value}</span>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gold hover:underline"
          >
            <Pencil className="h-3 w-3" />
            Change
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-cream/15 bg-onyx-800/30 px-4 py-3 text-sm text-cream/70">
          {emptyHint || "Search or pick a location above to fill this in"}
        </div>
      )}
    </div>
  );
}
