import { Router } from "express";
import { currencyService } from "../services/currency-service";
import { isAuthenticated } from "../auth";
import { logError, logInfo } from "../utils/error-logger";
import { z } from "zod";
import { CURRENCY_OPTIONS } from "../../client/src/types/invoice";

const router = Router();

// Get current exchange rates
router.get("/rates", async (req, res) => {
  try {
    const { base = 'USD', target } = req.query;
    
    if (typeof base !== 'string') {
      return res.status(400).json({ error: "Base currency must be a string" });
    }
    
    const rates = await currencyService.getExchangeRates(base);
    
    // Filter to specific target currency if requested
    if (target && typeof target === 'string') {
      const targetRate = rates[target];
      if (!targetRate) {
        return res.status(404).json({ error: `Rate not found for ${target}` });
      }
      return res.json({ [target]: targetRate });
    }
    
    res.json({
      base,
      rates,
      timestamp: new Date(),
      cacheInfo: currencyService.getCacheInfo()
    });
  } catch (error) {
    logError(`Failed to get exchange rates: ${error}`, 'CurrencyAPI');
    res.status(500).json({ error: "Failed to fetch exchange rates" });
  }
});

// Convert between currencies
const convertSchema = z.object({
  amount: z.number().positive(),
  from: z.string().length(3),
  to: z.string().length(3)
});

router.post("/convert", async (req, res) => {
  try {
    const { amount, from, to } = convertSchema.parse(req.body);
    
    const result = await currencyService.convertCurrency(amount, from, to);
    
    res.json({
      originalAmount: amount,
      originalCurrency: from,
      convertedAmount: result.convertedAmount,
      targetCurrency: to,
      exchangeRate: result.exchangeRate,
      timestamp: result.timestamp
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request parameters", details: error.errors });
    }
    
    logError(`Currency conversion failed: ${error}`, 'CurrencyAPI');
    res.status(500).json({ error: "Currency conversion failed" });
  }
});

// Get multi-currency conversions for an amount
const multiConvertSchema = z.object({
  amount: z.number().positive(),
  baseCurrency: z.string().length(3),
  targetCurrencies: z.array(z.string().length(3)).min(1).max(20)
});

router.post("/convert/multi", async (req, res) => {
  try {
    const { amount, baseCurrency, targetCurrencies } = multiConvertSchema.parse(req.body);
    
    const conversions = await currencyService.getMultiCurrencyConversions(
      amount, 
      baseCurrency, 
      targetCurrencies
    );
    
    res.json({
      originalAmount: amount,
      originalCurrency: baseCurrency,
      conversions,
      timestamp: new Date()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request parameters", details: error.errors });
    }
    
    logError(`Multi-currency conversion failed: ${error}`, 'CurrencyAPI');
    res.status(500).json({ error: "Multi-currency conversion failed" });
  }
});

// Get supported currencies
router.get("/supported", (req, res) => {
  try {
    const currencies = currencyService.getSupportedCurrencies();
    const currencyOptions = CURRENCY_OPTIONS;
    
    res.json({
      currencies,
      currencyOptions,
      totalCount: currencies.length,
      regions: {
        core: currencies.filter(c => c.region === 'core').length,
        caribbean: currencies.filter(c => c.region === 'caribbean').length,
        global: currencies.filter(c => c.region === 'global').length
      }
    });
  } catch (error) {
    logError(`Failed to get supported currencies: ${error}`, 'CurrencyAPI');
    res.status(500).json({ error: "Failed to get supported currencies" });
  }
});

// Refresh exchange rate cache (authenticated only)
router.post("/refresh", isAuthenticated, async (req, res) => {
  try {
    const { base = 'USD' } = req.body;
    
    await currencyService.refreshCache(base);
    
    res.json({
      success: true,
      message: `Exchange rate cache refreshed for ${base}`,
      timestamp: new Date()
    });
  } catch (error) {
    logError(`Failed to refresh currency cache: ${error}`, 'CurrencyAPI');
    res.status(500).json({ error: "Failed to refresh currency cache" });
  }
});

// Get cache information
router.get("/cache", (req, res) => {
  try {
    const cacheInfo = currencyService.getCacheInfo();
    
    res.json({
      ...cacheInfo,
      cacheAgeMinutes: Math.round(cacheInfo.cacheAge / (1000 * 60)),
      isFresh: cacheInfo.cacheAge < 4 * 60 * 60 * 1000 // 4 hours
    });
  } catch (error) {
    logError(`Failed to get cache info: ${error}`, 'CurrencyAPI');
    res.status(500).json({ error: "Failed to get cache information" });
  }
});

export { router as currencyRouter };