import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, TrendingUp } from "lucide-react";
import { CurrencySelector } from "./currency-selector";
import { currencyServiceClient } from "@/lib/currency-service";
import { formatCurrency } from "@/types/invoice";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface CurrencyConverterProps {
  initialAmount?: number;
  initialFromCurrency?: string;
  initialToCurrency?: string;
  className?: string;
}

export function CurrencyConverter({
  initialAmount = 100,
  initialFromCurrency = "USD",
  initialToCurrency = "CAD",
  className
}: CurrencyConverterProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState(initialAmount);
  const [fromCurrency, setFromCurrency] = useState(initialFromCurrency);
  const [toCurrency, setToCurrency] = useState(initialToCurrency);

  // Get exchange rates
  const { data: ratesData, isLoading, refetch, error } = useQuery({
    queryKey: ['currency-rates', fromCurrency],
    queryFn: () => currencyServiceClient.getExchangeRates(fromCurrency),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    retry: 2
  });

  // Calculate converted amount
  const convertedAmount = React.useMemo(() => {
    if (!ratesData?.rates?.[toCurrency] || !amount) return 0;
    return amount * ratesData.rates[toCurrency];
  }, [amount, toCurrency, ratesData]);

  const exchangeRate = ratesData?.rates?.[toCurrency] || 0;
  const lastUpdated = ratesData?.cacheInfo?.lastUpdated;

  const handleRefreshRates = async () => {
    try {
      await refetch();
      toast({
        title: "Exchange rates updated",
        description: "Latest currency exchange rates have been fetched."
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Could not refresh exchange rates. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <TrendingUp className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>Unable to load exchange rates</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshRates}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span>Currency Converter</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshRates}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* From Currency */}
        <div className="space-y-2">
          <Label>From</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="font-mono"
              />
            </div>
            <div className="flex-1">
              <CurrencySelector
                value={fromCurrency}
                onChange={setFromCurrency}
                label=""
                showRegions={false}
              />
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwapCurrencies}
            className="h-8 w-8 p-0 rounded-full"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>

        {/* To Currency */}
        <div className="space-y-2">
          <Label>To</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="h-10 px-3 py-2 border rounded-md bg-muted font-mono text-right">
                  {formatCurrency(convertedAmount, toCurrency)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <CurrencySelector
                value={toCurrency}
                onChange={setToCurrency}
                label=""
                showRegions={false}
              />
            </div>
          </div>
        </div>

        {/* Exchange Rate Info */}
        {!isLoading && exchangeRate > 0 && (
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Exchange Rate:</span>
                <span className="font-mono">
                  1 {fromCurrency} = {exchangeRate.toFixed(6)} {toCurrency}
                </span>
              </div>
              {lastUpdated && (
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span>{new Date(lastUpdated).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}