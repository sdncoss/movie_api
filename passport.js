const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  Models = require('./models.js'),
  passportJWT = require('passport-jwt');

const dotenv = require("dotenv");
dotenv.config();

let Users = Models.User,
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJwt;

passport.use(
  new LocalStrategy(
    {
      usernameField: 'Username',
      passwordField: 'Password',
    },
    async (username, password, callback) => {
      console.log(`Attempting login for user: ${username}`);
      //find by username
      await Users.findOne({ Username: username })
        .then((user) => {
          if (!user) {
            console.log('Incorrect username');
            return callback(null, false, {
              message: 'Incorrect username.',
            });
          }
          if (!user.validatePassword(password)) {
            console.log('Incorrect password');
            return callback(null, false, { message: 'Incorrect password.' });
          }
          console.log('Finished');
          return callback(null, user);
        })
        .catch((error) => {
          if (error) {
            console.log("Error during authentication: ", error);
            return callback(error);
          }
        })
    }
  )
);


passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret'
}, async (jwtPayload, callback) => {
  return await Users.findById(jwtPayload._id)
    .then((user) => {
      return callback(null, user);
    })
    .catch((error) => {
      return callback(error)
    });
}));