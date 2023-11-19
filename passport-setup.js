//require("dotenv").config();

const passport = require("passport")

const GoogleStrategy = require('passport-google-oauth2').Strategy

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: '277985285628-62t1866vegi4tcmo8rr4q33592nj2nu7.apps.googleusercontent.com',
      clientSecret: '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',
      callbackURL: 'http://localhost:5000/google/callback',
      passReqToCallback: true
    },
    async function (request, accessToken, refreshToken, profile, done) {
      console.log(profile)
      return done(null, profile)
    }
  )
);

