// In your auth routes file (e.g., routes/auth.js)
const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require("../models/user.js");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;

// Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
    // Find or create user logic
    try {
        console.log("Profile=======>2",profile);
        
        if (!profile.emails || !profile.emails[0]) {
            return done(new Error("Email not provided by Google"));
        }
        
        const email = profile.emails[0].value;

        let user = await User.findOne({ googleId: profile.id });
         if (user) {
        // User exists with this googleId
            return done(null, user);
        }

        user = await User.findOne({ email });
        if (user) {
        // User exists with this email but no googleId - link accounts
        user.googleId = profile.id;
        await user.save();
        return done(null, user);
      }
      
      // Create new user if neither exists
      user = new User({
        googleId: profile.id,
        username: profile.displayName || email.split('@')[0],
        email: email
      });
      
      await user.save();
      return done(null, user);
      
    } catch (err) {
        return done(err, null);
    }
}));

// GitHub OAuth
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/auth/github/callback"
},
async (accessToken, refreshToken, profile, done) => {
    // Find or create user logic
    try {
        let user = await User.findOne({ githubId: profile.id });
        if (!user) {
            user = new User({
                githubId: profile.id,
                username: profile.username,
                email: profile.emails?.[0]?.value
            });
            await user.save();
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

// Google Auth Routes
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { 
        failureRedirect: '/login',
        successRedirect: '/listings',
        failureFlash: true
    }),
     (err, req, res, next) => {
    // Special error handling for OAuth
    console.error('OAuth Error:======>5', err);
    req.flash('error', 'Failed to authenticate with Google');
    res.redirect('/login');
  }
);

router.get('/github',
    passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
    passport.authenticate('github', { 
        failureRedirect: '/login',
        successRedirect: '/listings'
    })
);

module.exports = router;