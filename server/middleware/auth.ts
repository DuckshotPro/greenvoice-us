import { Request, Response, NextFunction, Express } from "express";
import { logWarning, logInfo } from "../utils/logger";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "../models/storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

/**
 * Hashes a password using scrypt and a random salt.
 * @param {string} password - Password to hash.
 * @returns {Promise<string>} The hashed password in format hex.salt.
 */
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Compares a supplied password with a stored hashed password securely.
 * @param {string} supplied - The password to check.
 * @param {string} stored - The stored hash to compare with.
 * @returns {Promise<boolean>} True if passwords match, false otherwise.
 */
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

/**
 * Configures passport.js authentication for the Express app.
 * @param {Express} app - An instance of the Express application.
 */
export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "invoice-app-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: { message: string }) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info.message || "Invalid credentials" });
      }
      req.login(user, (err: Error | null) => {
        if (err) return next(err);
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    // Return user without password
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });
  
  logInfo("Authentication setup complete", "AuthMiddleware");
}

/**
 * Middleware to require authentication for protected routes
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    logWarning(
      `Unauthorized access attempt to protected route: ${req.path}`,
      'AuthMiddleware',
      {
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    );
    
    return res.status(401).json({ message: "Authentication required" });
  }
  
  next();
};

/**
 * Middleware to require admin role for protected admin routes
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // First check if user is authenticated
  if (!req.isAuthenticated()) {
    logWarning(
      `Unauthorized access attempt to admin route: ${req.path}`,
      'AuthMiddleware',
      {
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    );
    
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // Then check if user is an admin
  // In a production app, you would check the user's role
  // For this prototype, we check for an isAdmin property or an API key
  const apiKey = req.headers['x-admin-api-key'];
  if ((!req.user.isAdmin) && (!apiKey || apiKey !== process.env.ADMIN_API_KEY)) {
    logWarning(
      `Unauthorized admin access attempt: ${req.path}`,
      'AuthMiddleware',
      {
        path: req.path,
        userId: req.user.id,
        userAgent: req.get('User-Agent')
      }
    );
    
    return res.status(403).json({ message: "Unauthorized access to admin endpoint" });
  }
  
  next();
};