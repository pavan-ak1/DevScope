const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Voter = require("../models/Voter");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await Voter.findOne({ email: profile.emails[0].value });

        if (!user) {
          user = new Voter({
            name: profile.displayName,
            email: profile.emails[0].value,
          });
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Voter.findById(id);
    done(null, user);
  } catch (error) {
    done(error, false);
  }
});
