import { logInfo, logError, logWarning } from "../utils/error-logger";
import { CURRENCY_PEGS } from "../../client/src/types/invoice";

// Exchange rate cache with 4-hour expiration for free tier efficiency
interface ExchangeRateCache {
  rates: Record<string, number>;
  lastUpdated: Date;
  baseCurrency: string;
}

let exchangeRateCache: ExchangeRateCache | null = null;
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

export class CurrencyService {
  private static readonly API_BASE_URL = 'https://api.exchangerate-api.com/v4/latest';
  
  /**
   * Get current exchange rates with intelligent caching
   */
  async getExchangeRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
    try {
      // Check cache validity
      if (exchangeRateCache && 
          exchangeRateCache.baseCurrency === baseCurrency &&
          Date.now() - exchangeRateCache.lastUpdated.getTime() < CACHE_DURATION) {
        logInfo(`Using cached exchange rates for ${baseCurrency}`, 'CurrencyService');
        return exchangeRateCache.rates;
      }

      // Fetch fresh rates from API
      logInfo(`Fetching fresh exchange rates for ${baseCurrency}`, 'CurrencyService');
      const response = await fetch(`${CurrencyService.API_BASE_URL}/${baseCurrency}`);
      
      if (!response.ok) {
        throw new Error(`Exchange rate API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Apply fixed pegs for Caribbean currencies
      const rates = { ...data.rates };
      this.applyFixedPegs(rates, baseCurrency);
      
      // Update cache
      exchangeRateCache = {
        rates,
        lastUpdated: new Date(),
        baseCurrency
      };
      
      logInfo(`Successfully updated exchange rates cache with ${Object.keys(rates).length} currencies`, 'CurrencyService');
      return rates;
      
    } catch (error) {
      logError(`Failed to fetch exchange rates: ${error}`, 'CurrencyService');
      
      // Return cached rates if available, even if stale
      if (exchangeRateCache && exchangeRateCache.baseCurrency === baseCurrency) {
        logWarning('Using stale cached rates due to API failure', 'CurrencyService');
        return exchangeRateCache.rates;
      }
      
      // Fallback to basic rates for core currencies
      return this.getFallbackRates(baseCurrency);
    }
  }

  /**
   * Apply fixed exchange rate pegs for Caribbean currencies
   */
  private applyFixedPegs(rates: Record<string, number>, baseCurrency: string): void {
    Object.entries(CURRENCY_PEGS).forEach(([currency, peg]) => {
      if (peg.pegged && peg.rate && peg.baseCurrency) {
        if (baseCurrency === peg.baseCurrency) {
          rates[currency] = peg.rate;
        } else if (baseCurrency === currency) {
          rates[peg.baseCurrency] = 1 / peg.rate;
        } else {
          // Convert through the peg base currency
          const baseRate = rates[peg.baseCurrency];
          if (baseRate) {
            rates[currency] = baseRate * peg.rate;
          }
        }
      }
    });
  }

  /**
   * Convert amount between currencies
   */
  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<{
    convertedAmount: number;
    exchangeRate: number;
    timestamp: Date;
  }> {
    if (fromCurrency === toCurrency) {
      return {
        convertedAmount: amount,
        exchangeRate: 1,
        timestamp: new Date()
      };
    }

    const rates = await this.getExchangeRates(fromCurrency);
    const exchangeRate = rates[toCurrency];
    
    if (!exchangeRate) {
      throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
    }
    
    return {
      convertedAmount: amount * exchangeRate,
      exchangeRate,
      timestamp: new Date()
    };
  }

  /**
   * Get multiple currency conversions from a base amount
   */
  async getMultiCurrencyConversions(
    amount: number, 
    baseCurrency: string, 
    targetCurrencies: string[]
  ): Promise<Array<{
    currency: string;
    amount: number;
    exchangeRate: number;
  }>> {
    const rates = await this.getExchangeRates(baseCurrency);
    
    return targetCurrencies.map(currency => {
      if (currency === baseCurrency) {
        return { currency, amount, exchangeRate: 1 };
      }
      
      const exchangeRate = rates[currency] || 1;
      return {
        currency,
        amount: amount * exchangeRate,
        exchangeRate
      };
    });
  }

  /**
   * Get fallback rates for when API is unavailable
   */
  private getFallbackRates(baseCurrency: string): Record<string, number> {
    logWarning(`Using fallback exchange rates for ${baseCurrency}`, 'CurrencyService');
    
    // Static fallback rates (updated periodically)
    const fallbackRates: Record<string, Record<string, number>> = {
      USD: {
        CAD: 1.35, EUR: 0.85, GBP: 0.75, JPY: 110, AUD: 1.45,
        XCD: 2.70, KYD: 0.83, JMD: 155, TTD: 6.75, BBD: 2.0,
        INR: 75, CNY: 6.5
      },
      CAD: {
        USD: 0.74, EUR: 0.63, GBP: 0.56, JPY: 81, AUD: 1.07,
        XCD: 2.0, KYD: 0.61, JMD: 115, TTD: 5.0, BBD: 1.48
      }
    };
    
    return fallbackRates[baseCurrency] || fallbackRates.USD;
  }

  /**
   * Get cached exchange rates info
   */
  getCacheInfo(): { lastUpdated: Date | null; baseCurrency: string | null; cacheAge: number } {
    if (!exchangeRateCache) {
      return { lastUpdated: null, baseCurrency: null, cacheAge: 0 };
    }
    
    return {
      lastUpdated: exchangeRateCache.lastUpdated,
      baseCurrency: exchangeRateCache.baseCurrency,
      cacheAge: Date.now() - exchangeRateCache.lastUpdated.getTime()
    };
  }

  /**
   * Force refresh the exchange rate cache
   */
  async refreshCache(baseCurrency: string = 'USD'): Promise<void> {
    exchangeRateCache = null;
    await this.getExchangeRates(baseCurrency);
  }

  /**
   * Get list of supported currencies with their regions
   */
  getSupportedCurrencies(): Array<{
    code: string;
    name: string;
    symbol: string;
    region: string;
    pegged: boolean;
  }> {
    return [
      { code: 'USD', name: 'US Dollar', symbol: '$', region: 'core', pegged: false },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', region: 'core', pegged: false },
      { code: 'XCD', name: 'Eastern Caribbean Dollar', symbol: 'EC$', region: 'caribbean', pegged: true },
      { code: 'KYD', name: 'Cayman Islands Dollar', symbol: 'CI$', region: 'caribbean', pegged: false },
      { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$', region: 'caribbean', pegged: false },
      { code: 'TTD', name: 'Trinidad & Tobago Dollar', symbol: 'TT$', region: 'caribbean', pegged: false },
      { code: 'BBD', name: 'Barbados Dollar', symbol: 'Bds$', region: 'caribbean', pegged: true },
      { code: 'EUR', name: 'Euro', symbol: '€', region: 'global', pegged: false },
      { code: 'GBP', name: 'British Pound', symbol: '£', region: 'global', pegged: false },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', region: 'global', pegged: false },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', region: 'global', pegged: false },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹', region: 'global', pegged: false },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', region: 'global', pegged: false },
    ];
  }
}

export const currencyService = new CurrencyService();