import { apiRequest } from './queryClient';

export interface ExchangeRatesResponse {
  rates: Record<string, number>;
  baseCurrency: string;
  timestamp: string;
  cacheInfo: {
    lastUpdated: string;
    cacheAge: number;
    isStale: boolean;
  };
}

export interface ConversionResponse {
  amount: number;
  currency: string;
  exchangeRate: number;
}

export interface MultiCurrencyResponse {
  baseCurrency: string;
  baseAmount: number;
  conversions: ConversionResponse[];
  timestamp: string;
}

export interface SupportedCurrenciesResponse {
  currencies: Array<{
    code: string;
    name: string;
    symbol: string;
    region: string;
  }>;
  totalCount: number;
  regions: {
    core: number;
    caribbean: number;
    global: number;
  };
}

export interface CurrencyConversionRequest {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
}

export interface MultiCurrencyRequest {
  amount: number;
  baseCurrency: string;
  targetCurrencies: string[];
}

class CurrencyServiceClient {
  /**
   * Get current exchange rates for a base currency
   */
  async getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRatesResponse> {
    const response = await apiRequest(`/api/currency/rates?base=${baseCurrency}`);
    return response;
  }

  /**
   * Convert amount between two currencies
   */
  async convertCurrency(request: CurrencyConversionRequest): Promise<ConversionResponse> {
    const response = await apiRequest('/api/currency/convert', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return response;
  }

  /**
   * Convert amount to multiple target currencies
   */
  async getMultiCurrencyConversions(
    amount: number,
    baseCurrency: string,
    targetCurrencies: string[]
  ): Promise<MultiCurrencyResponse> {
    const response = await apiRequest('/api/currency/multi-convert', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        baseCurrency,
        targetCurrencies
      })
    });
    return response;
  }

  /**
   * Get list of supported currencies with regional grouping
   */
  async getSupportedCurrencies(): Promise<SupportedCurrenciesResponse> {
    const response = await apiRequest('/api/currency/supported');
    return response;
  }

  /**
   * Refresh exchange rate cache (admin function)
   */
  async refreshCache(baseCurrency: string = 'USD'): Promise<{ message: string }> {
    const response = await apiRequest('/api/currency/refresh-cache', {
      method: 'POST',
      body: JSON.stringify({ base: baseCurrency })
    });
    return response;
  }

  /**
   * Get cache information and status
   */
  async getCacheInfo(): Promise<{
    lastUpdated: string;
    baseCurrency: string;
    cacheAgeMinutes: number;
    isFresh: boolean;
  }> {
    const response = await apiRequest('/api/currency/cache-info');
    return response;
  }
}

export const currencyServiceClient = new CurrencyServiceClient();