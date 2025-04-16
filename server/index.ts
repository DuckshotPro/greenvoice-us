import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./utils/vite";
import { scheduler } from "./services/scheduler";
import { ErrorLogger, LogLevel, LogCategory, logInfo, logError } from "./lib/error-logger";
// Custom frontend router no longer needed
// import customFrontendRouter from "./custom-frontend";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS headers to all responses
app.use((req, res, next) => {
  // Allow specific origins including Replit domains
  const allowedOrigins = ['http://localhost:5000', 'https://localhost:5000', 'https://*.replit.dev', 'https://*.repl.co'];
  const origin = req.headers.origin;
  
  if (origin) {
    // Check if the origin matches any of our allowed patterns
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace('*', '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowedOrigin === origin;
    });
    
    if (isAllowed) {
      res.header('Access-Control-Allow-Origin', origin);
    } else {
      // Allow all origins as fallback to ensure the application works
      res.header('Access-Control-Allow-Origin', '*');
    }
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  // Log incoming request
  if (path.startsWith("/api")) {
    ErrorLogger.logActivity(
      LogLevel.INFO,
      LogCategory.SYSTEM,
      `Incoming ${req.method} request`,
      'RequestLogger',
      {
        path,
        method: req.method,
        query: req.query,
        // Sanitize request headers to remove sensitive data
        headers: ErrorLogger['sanitizeData']({
          userAgent: req.headers['user-agent'],
          referer: req.headers.referer,
          origin: req.headers.origin
        })
      }
    );
  }

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      ErrorLogger.logPerformance(
        `${req.method} ${path}`,
        duration,
        {
          statusCode: res.statusCode,
          path,
          method: req.method
        }
      );
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    // Get relevant request information
    const requestInfo = {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    // Determine response status and message
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Log the error with our structured logger
    logError(
      `Error handling ${req.method} ${req.path}: ${message}`, 
      'ExpressErrorHandler',
      {
        request: requestInfo,
        error: err,
        status
      }
    );
    
    // Don't expose error details in production
    const isDevelopment = app.get("env") === "development";
    
    res.status(status).json({ 
      message,
      ...(isDevelopment ? { error: err.message, stack: err.stack } : {})
    });
  });
  
  // Don't use the custom frontend router as we now have a working React app
  // app.use(customFrontendRouter);
  logInfo('Using standard Vite frontend router', 'ServerStartup');

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    logInfo(`Server started and listening on port ${port}`, 'ServerStartup', {
      port,
      host: "0.0.0.0",
      environment: app.get("env"),
      nodeVersion: process.version,
      adminKeySet: process.env.ADMIN_API_KEY ? true : false
    });
    
    // Start the scheduler to process invoices automatically
    scheduler.start();
    logInfo('Invoice processor scheduler started', 'ServerStartup');
  });
})();
