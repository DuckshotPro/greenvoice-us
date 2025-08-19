import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CURRENCY_OPTIONS, getCurrenciesByRegion } from "@/types/invoice";

interface CurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showRegions?: boolean;
}

export function CurrencySelector({
  value,
  onChange,
  label = "Currency",
  placeholder = "Select currency",
  className,
  disabled = false,
  showRegions = true
}: CurrencySelectorProps) {
  const { core, caribbean, global } = getCurrenciesByRegion();

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="currency-selector" className="text-sm font-medium">
          {label}
        </Label>
      )}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="currency-selector" className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {showRegions ? (
            <>
              {/* Core Regional Currencies */}
              {core.length > 0 && (
                <div>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b">
                    Core Regional
                  </div>
                  {core.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{currency.symbol}</span>
                        <span>{currency.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              )}

              {/* Caribbean Currencies */}
              {caribbean.length > 0 && (
                <div>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b">
                    Caribbean
                  </div>
                  {caribbean.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{currency.symbol}</span>
                        <span>{currency.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              )}

              {/* Global Currencies */}
              {global.length > 0 && (
                <div>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b">
                    Global
                  </div>
                  {global.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{currency.symbol}</span>
                        <span>{currency.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Simple list without regions */
            CURRENCY_OPTIONS.map((currency) => (
              <SelectItem key={currency.value} value={currency.value}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{currency.symbol}</span>
                  <span>{currency.label}</span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}