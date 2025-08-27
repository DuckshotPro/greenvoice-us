import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "../models/storage";
import { User as SelectUser } from "@shared/schema";
import { logInfo, logError } from "../utils/error-logger";

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
  // Handle case where password doesn't have the expected format
  if (!stored.includes(".")) {
    return supplied === stored;
  }
  
  // Normal secure password comparison
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
      maxAge: 24 * 60 * 60 * 1000, // 24 hours default
      httpOnly: true,
      sameSite: 'lax'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Configure OAuth providers if credentials are available
  
  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: '/api/auth/google/callback',
          scope: ['profile', 'email']
        },
        async (accessToken: any, refreshToken: any, profile: any, done: any) => {
          try {
            // Check if user already exists
            let user = await storage.getUserByOAuthId(profile.id, 'google');
            
            if (!user) {
              // Create new user if they don't exist
              const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
              const username = profile.displayName.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000);
              
              user = await storage.createUserFromOAuth({
                oauthId: profile.id,
                oauthProvider: 'google',
                username,
                email,
                firstName: profile.name?.givenName || '',
                lastName: profile.name?.familyName || '',
                profileImageUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
                subscriptionPlan: 'free'
              });
              
              logInfo('Created new user from Google OAuth', 'OAuthController', {
                userId: user.id,
                username: user.username
              });
            } else {
              logInfo('User logged in via Google OAuth', 'OAuthController', {
                userId: user.id,
                username: user.username
              });
            }
            
            // Create safe user with default values
            const safeUser: Express.User = {
              ...user,
              subscriptionPlan: user.subscriptionPlan || 'free',
              premiumDaysRemaining: user.premiumDaysRemaining ?? 0,
              totalInvoicesSent: user.totalInvoicesSent ?? 0,
              lastAdDaysAwarded: user.lastAdDaysAwarded ?? 0,
              brandingSettings: user.brandingSettings || '',
              customTemplateId: user.customTemplateId || '',
              logoUrl: user.logoUrl || ''
            };
            
            return done(null, safeUser);
          } catch (error) {
            logError('Google OAuth authentication error', 'OAuthController', { error });
            return done(error as Error);
          }
        }
      )
    );
  }

  // Facebook OAuth Strategy
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: '/api/auth/facebook/callback',
          profileFields: ['id', 'displayName', 'photos', 'email', 'name']
        },
        async (accessToken: any, refreshToken: any, profile: any, done: any) => {
          try {
            // Check if user already exists
            let user = await storage.getUserByOAuthId(profile.id, 'facebook');
            
            if (!user) {
              // Create new user if they don't exist
              const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
              const username = profile.displayName.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000);
              
              user = await storage.createUserFromOAuth({
                oauthId: profile.id,
                oauthProvider: 'facebook',
                username,
                email,
                firstName: profile.name?.givenName || '',
                lastName: profile.name?.familyName || '',
                profileImageUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
                subscriptionPlan: 'free'
              });
              
              logInfo('Created new user from Facebook OAuth', 'OAuthController', {
                userId: user.id,
                username: user.username
              });
            } else {
              logInfo('User logged in via Facebook OAuth', 'OAuthController', {
                userId: user.id,
                username: user.username
              });
            }
            
            // Create safe user with default values
            const safeUser: Express.User = {
              ...user,
              subscriptionPlan: user.subscriptionPlan || 'free',
              premiumDaysRemaining: user.premiumDaysRemaining ?? 0,
              totalInvoicesSent: user.totalInvoicesSent ?? 0,
              lastAdDaysAwarded: user.lastAdDaysAwarded ?? 0,
              brandingSettings: user.brandingSettings || '',
              customTemplateId: user.customTemplateId || '',
              logoUrl: user.logoUrl || ''
            };
            
            return done(null, safeUser);
          } catch (error) {
            logError('Facebook OAuth authentication error', 'OAuthController', { error });
            return done(error as Error);
          }
        }
      )
    );
  }

  // GitHub OAuth Strategy
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: '/api/auth/github/callback',
          scope: ['user:email']
        },
        async (accessToken: any, refreshToken: any, profile: any, done: any) => {
          try {
            // Check if user already exists
            let user = await storage.getUserByOAuthId(profile.id, 'github');
            
            if (!user) {
              // Create new user if they don't exist
              const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
              const username = profile.username || (profile.displayName?.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000));
              
              user = await storage.createUserFromOAuth({
                oauthId: profile.id,
                oauthProvider: 'github',
                username,
                email,
                firstName: profile.displayName?.split(' ')[0] || '',
                lastName: profile.displayName?.split(' ').slice(1).join(' ') || '',
                profileImageUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
                subscriptionPlan: 'free'
              });
              
              logInfo('Created new user from GitHub OAuth', 'OAuthController', {
                userId: user.id,
                username: user.username
              });
            } else {
              logInfo('User logged in via GitHub OAuth', 'OAuthController', {
                userId: user.id,
                username: user.username
              });
            }
            
            // Create safe user with default values
            const safeUser: Express.User = {
              ...user,
              subscriptionPlan: user.subscriptionPlan || 'free',
              premiumDaysRemaining: user.premiumDaysRemaining ?? 0,
              totalInvoicesSent: user.totalInvoicesSent ?? 0,
              lastAdDaysAwarded: user.lastAdDaysAwarded ?? 0,
              brandingSettings: user.brandingSettings || '',
              customTemplateId: user.customTemplateId || '',
              logoUrl: user.logoUrl || ''
            };
            
            return done(null, safeUser);
          } catch (error) {
            logError('GitHub OAuth authentication error', 'OAuthController', { error });
            return done(error as Error);
          }
        }
      )
    );
  }

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        } else {
          // Enforce non-null for required fields as per our schema definition
          const safeUser: Express.User = {
            ...user,
            subscriptionPlan: user.subscriptionPlan || 'free',
            premiumDaysRemaining: user.premiumDaysRemaining ?? 0,
            totalInvoicesSent: user.totalInvoicesSent ?? 0,
            lastAdDaysAwarded: user.lastAdDaysAwarded ?? 0,
            brandingSettings: user.brandingSettings || '',
            customTemplateId: user.customTemplateId || '',
            logoUrl: user.logoUrl || ''
          };
          return done(null, safeUser);
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
      if (!user) {
        return done(null, false);
      }
      // Ensure required fields are never null
      const safeUser: Express.User = {
        ...user,
        subscriptionPlan: user.subscriptionPlan || 'free',
        premiumDaysRemaining: user.premiumDaysRemaining ?? 0,
        totalInvoicesSent: user.totalInvoicesSent ?? 0,
        lastAdDaysAwarded: user.lastAdDaysAwarded ?? 0,
        brandingSettings: user.brandingSettings || '',
        customTemplateId: user.customTemplateId || '',
        logoUrl: user.logoUrl || ''
      };
      done(null, safeUser);
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

      // Prepare user data with default values for required fields
      const userData = {
        ...req.body,
        password: await hashPassword(req.body.password),
        subscriptionPlan: 'free',
        premiumDaysRemaining: 0,
        totalInvoicesSent: 0,
        lastAdDaysAwarded: 0,
        brandingSettings: '',
        customTemplateId: '',
        logoUrl: '',
      };

      const user = await storage.createUser(userData);

      // Create safe user to fix type issues
      const safeUser: Express.User = {
        ...user,
        subscriptionPlan: user.subscriptionPlan || 'free',
        premiumDaysRemaining: user.premiumDaysRemaining ?? 0,
        totalInvoicesSent: user.totalInvoicesSent ?? 0,
        lastAdDaysAwarded: user.lastAdDaysAwarded ?? 0,
        brandingSettings: user.brandingSettings || '',
        customTemplateId: user.customTemplateId || '',
        logoUrl: user.logoUrl || ''
      };

      req.login(safeUser, (err) => {
        if (err) return next(err);
        // Return user without password
        const { password, ...userWithoutPassword } = safeUser;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string }) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info.message || "Invalid credentials" });
      }
      
      // If rememberMe is true, extend session expiration
      if (req.body.rememberMe) {
        // Set cookie to expire in 30 days
        if (req.session.cookie) {
          req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        }
      } else {
        // Set session to expire when the browser is closed
        if (req.session.cookie) {
          req.session.cookie.maxAge = 0;
        }
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
  
  // OAuth Routes
  
  // Google Auth Routes
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get('/api/auth/google', 
      passport.authenticate('google', { scope: ['profile', 'email'] })
    );
    
    app.get('/api/auth/google/callback',
      passport.authenticate('google', { 
        failureRedirect: '/auth?error=google_auth_failed',
        successRedirect: '/'
      })
    );
  }
  
  // Facebook Auth Routes
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    app.get('/api/auth/facebook', 
      passport.authenticate('facebook', { scope: ['email'] })
    );
    
    app.get('/api/auth/facebook/callback',
      passport.authenticate('facebook', { 
        failureRedirect: '/auth?error=facebook_auth_failed',
        successRedirect: '/'
      })
    );
  }
  
  // GitHub Auth Routes
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    app.get('/api/auth/github', 
      passport.authenticate('github', { scope: ['user:email'] })
    );
    
    app.get('/api/auth/github/callback',
      passport.authenticate('github', { 
        failureRedirect: '/auth?error=github_auth_failed',
        successRedirect: '/'
      })
    );
  }
}

/**
 * Middleware to require authentication for protected routes
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

/**
 * Middleware to require admin role for admin-only routes
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin privileges required" });
  }
  
  next();
};