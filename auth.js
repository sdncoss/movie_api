const dotenv = require("dotenv");
dotenv.config();

const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret'; // Same key used in JWTStrategy

const jwt = require('jsonwebtoken'),
  passport = require('passport');


require('./passport'); //Local passport file

let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.Username, // Username endcoding in the JWT
    expiresIn: '7d', //Specifies that the token expires in 7 days
    algorithm: 'HS256' //Algorithm used to 'sign' or encode the values of the JWT
  });
}

// POST login
module.exports = (router) => {
  router.post("/login", (req, res) => {
    passport.authenticate("local", { session: false }, (error, user, info) => {
      if (error) {
        console.error("Authentication error: ", error);
        return res.status(400).json({
          message: "Authentication error",
          error: error,
        });
      }
      if (!user) {
        console.log("Authentication failed: ", info);
        return res.status(400).json({
          message: "Incorrect username or password",
          user: user,
        });
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error);
        }
        let token = generateJWTToken(user.toJSON());
        return res.json({ user, token });
      });
    })(req, res);
  });
};