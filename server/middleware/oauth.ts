import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Express, Request, Response, NextFunction } from 'express';
import { storage } from '../models/storage';
import { logInfo, logError } from '../utils/error-logger';

/**
 * Sets up OAuth 2.0 authentication strategies for multiple providers.
 * This is a platform-agnostic implementation that will work with any OAuth 2.0 provider.
 * @param {Express} app - An instance of the Express application.
 */
export function setupOAuth(app: Express) {
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
        async (accessToken, refreshToken, profile, done) => {
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
            
            return done(null, user);
          } catch (error) {
            logError('Google OAuth authentication error', 'OAuthController', { error });
            return done(error as Error);
          }
        }
      )
    );

    // Google auth routes
    app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
    app.get(
      '/api/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/auth?error=google_auth_failed' }),
      (req, res) => {
        // Successful authentication, redirect home
        res.redirect('/');
      }
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
        async (accessToken, refreshToken, profile, done) => {
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
            
            return done(null, user);
          } catch (error) {
            logError('Facebook OAuth authentication error', 'OAuthController', { error });
            return done(error as Error);
          }
        }
      )
    );

    // Facebook auth routes
    app.get('/api/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
    app.get(
      '/api/auth/facebook/callback',
      passport.authenticate('facebook', { failureRedirect: '/auth?error=facebook_auth_failed' }),
      (req, res) => {
        // Successful authentication, redirect home
        res.redirect('/');
      }
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
        async (accessToken, refreshToken, profile, done) => {
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
            
            return done(null, user);
          } catch (error) {
            logError('GitHub OAuth authentication error', 'OAuthController', { error });
            return done(error as Error);
          }
        }
      )
    );

    // GitHub auth routes
    app.get('/api/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
    app.get(
      '/api/auth/github/callback',
      passport.authenticate('github', { failureRedirect: '/auth?error=github_auth_failed' }),
      (req, res) => {
        // Successful authentication, redirect home
        res.redirect('/');
      }
    );
  }

  // Common route for all OAuth providers to check login status
  app.get('/api/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
      // Don't send sensitive information like passwords
      const { password, ...user } = req.user as any;
      res.json({ authenticated: true, user });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Logout route for all OAuth providers
  app.get('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.redirect('/auth');
    });
  });
}