import passport from "passport";
import passportJWT from "passport-jwt";
import User from "./schema.js";
import "dotenv/config";

passport.use(
  new passportJWT.Strategy(
    {
      secretOrKey: process.env.JWT_SECRET,
      jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
    },
    function (payload, done) {
      User.find({ _id: payload.id })
        .then(([user]) => {
          if (!user) {
            return done(new Error("User not found"));
          }
          return done(null, user);
        })
        .catch((err) => done(err));
    }
  )
);
