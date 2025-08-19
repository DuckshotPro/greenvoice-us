import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Zap,
  MapPin,
  Clock,
  RefreshCw
} from "lucide-react";
import { CurrencyConverter } from "@/components/currency/currency-converter";
import { CurrencySelector } from "@/components/currency/currency-selector";
import { CURRENCY_OPTIONS, getCurrenciesByRegion, formatCurrency } from "@/types/invoice";
import { currencyServiceClient } from "@/lib/currency-service";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function MultiCurrencyPage() {
  const [selectedBaseCurrency, setSelectedBaseCurrency] = useState("USD");
  
  // Get supported currencies data
  const { data: supportedData, isLoading: loadingSupported } = useQuery({
    queryKey: ['supported-currencies'],
    queryFn: () => currencyServiceClient.getSupportedCurrencies()
  });

  // Get exchange rates for multiple currencies
  const { data: multiRatesData, isLoading: loadingRates } = useQuery({
    queryKey: ['multi-currency-rates', selectedBaseCurrency],
    queryFn: async () => {
      const targetCurrencies = ['CAD', 'XCD', 'KYD', 'JMD', 'TTD', 'BBD', 'EUR', 'GBP'];
      return currencyServiceClient.getMultiCurrencyConversions(
        1000, // Base amount for comparison
        selectedBaseCurrency,
        targetCurrencies.filter(c => c !== selectedBaseCurrency)
      );
    },
    refetchInterval: 5 * 60 * 1000 // Refresh every 5 minutes
  });

  // Get cache info
  const { data: cacheInfo } = useQuery({
    queryKey: ['currency-cache'],
    queryFn: () => currencyServiceClient.getCacheInfo(),
    refetchInterval: 60 * 1000 // Check cache status every minute
  });

  const currencyRegions = getCurrenciesByRegion();

  const getSampleInvoiceAmounts = () => [
    { description: "Small Invoice", amount: 250 },
    { description: "Medium Invoice", amount: 1500 },
    { description: "Large Invoice", amount: 5000 },
    { description: "Enterprise Contract", amount: 25000 }
  ];

  const getRegionStats = (region: 'core' | 'caribbean' | 'global') => {
    const currencies = currencyRegions[region];
    return {
      count: currencies.length,
      names: currencies.map(c => c.value).join(', ')
    };
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Globe className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Multi-Currency Support</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Comprehensive currency support for Canada-US-Caribbean business corridor with real-time exchange rates
        </p>
      </div>

      <Tabs defaultValue="converter" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="converter">Currency Converter</TabsTrigger>
          <TabsTrigger value="rates">Exchange Rates</TabsTrigger>
          <TabsTrigger value="regions">Regional Currencies</TabsTrigger>
          <TabsTrigger value="analytics">Revenue Analytics</TabsTrigger>
        </TabsList>

        {/* Currency Converter Tab */}
        <TabsContent value="converter" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CurrencyConverter />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Invoice Amount Examples
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Base Currency:</span>
                    <CurrencySelector
                      value={selectedBaseCurrency}
                      onChange={setSelectedBaseCurrency}
                      label=""
                      className="w-32"
                      showRegions={false}
                    />
                  </div>
                </div>
                
                <div className="mt-4 space-y-3">
                  {getSampleInvoiceAmounts().map((sample, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="font-medium">{sample.description}</span>
                      <span className="font-mono text-lg">
                        {formatCurrency(sample.amount, selectedBaseCurrency)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Exchange Rates Tab */}
        <TabsContent value="rates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Current Exchange Rates</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {cacheInfo && (
                <>
                  <Clock className="h-4 w-4" />
                  <span>
                    Last updated: {cacheInfo.cacheAgeMinutes}m ago
                  </span>
                  <Badge variant={cacheInfo.isFresh ? "default" : "secondary"}>
                    {cacheInfo.isFresh ? "Fresh" : "Cached"}
                  </Badge>
                </>
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Live Exchange Rates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Base Currency:</span>
                  <CurrencySelector
                    value={selectedBaseCurrency}
                    onChange={setSelectedBaseCurrency}
                    label=""
                    showRegions={false}
                    className="w-48"
                  />
                </div>

                {loadingRates ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                ) : multiRatesData?.conversions ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {multiRatesData.conversions.map((conversion) => (
                      <Card key={conversion.currency} className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{conversion.currency}</div>
                            <div className="text-sm text-muted-foreground">
                              {CURRENCY_OPTIONS.find(c => c.value === conversion.currency)?.symbol}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-lg">
                              {formatCurrency(conversion.amount, conversion.currency)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Rate: {conversion.exchangeRate.toFixed(6)}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <TrendingUp className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Unable to load exchange rates</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regional Currencies Tab */}
        <TabsContent value="regions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Core Regional */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <MapPin className="h-5 w-5" />
                  Core Regional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground mb-4">
                  Primary currencies for North American markets
                </div>
                {currencyRegions.core.map((currency) => (
                  <div key={currency.value} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{currency.value}</div>
                      <div className="text-sm text-muted-foreground">
                        {currency.label.split(' - ')[1] || currency.label}
                      </div>
                    </div>
                    <div className="font-mono text-lg">{currency.symbol}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Caribbean */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Globe className="h-5 w-5" />
                  Caribbean
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground mb-4">
                  Regional currencies for Caribbean markets
                </div>
                {currencyRegions.caribbean.map((currency) => (
                  <div key={currency.value} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{currency.value}</div>
                      <div className="text-sm text-muted-foreground">
                        {currency.label.split(' - ')[1] || currency.label}
                      </div>
                    </div>
                    <div className="font-mono text-lg">{currency.symbol}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Global */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600">
                  <BarChart3 className="h-5 w-5" />
                  Global
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground mb-4">
                  Major international currencies
                </div>
                {currencyRegions.global.map((currency) => (
                  <div key={currency.value} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{currency.value}</div>
                      <div className="text-sm text-muted-foreground">
                        {currency.label.split(' - ')[1] || currency.label}
                      </div>
                    </div>
                    <div className="font-mono text-lg">{currency.symbol}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          {loadingSupported ? (
            <Skeleton className="h-32" />
          ) : supportedData && (
            <Card>
              <CardHeader>
                <CardTitle>Currency Support Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {supportedData.regions?.core || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Core Regional</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {supportedData.regions?.caribbean || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Caribbean</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {supportedData.regions?.global || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Global</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {supportedData.totalCount || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Currencies</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Revenue Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Multi-Currency Revenue Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="mx-auto h-16 w-16 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                <p className="max-w-md mx-auto">
                  Comprehensive revenue analytics across multiple currencies with automatic conversion 
                  and trend analysis will be available in the next update.
                </p>
                <div className="mt-6 space-y-2 text-left max-w-md mx-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm">Revenue by currency breakdown</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm">USD equivalent calculations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span className="text-sm">Exchange rate impact analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-sm">Regional performance insights</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}