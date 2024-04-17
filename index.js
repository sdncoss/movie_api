//utilizing Express, Morgan, Mongoose and MongoDB to set up a local API

const express = require('express');
const morgan = require('morgan');

const app = express();
const { check, validationResult } = require('express-validator');


// Adding mongoose and mongodb
const mongoose = require("mongoose");
const Models = require("./models.js");

const Movies = Models.Movie;
const Users = Models.User;


mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(morgan('common'));

//adding CORS
const cors = require('cors');
app.use(cors());

let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];

app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){ // If a specific origin isn’t found on the list of allowed origins
      let message = "The CORS policy for this application does not allow access from origin " + origin;
      return callback(new Error(message ), false);
    }
    return callback(null, true);
  }
}));

app.use(express.json());
// adding bodyparser
//const bodyParser = require('body-parser');

//app.use(bodyParser.urlencoded({ extended: true }));

//app.use(bodyParser.json());

//Adding auth.js 
let auth = require('./auth')(app);
//Adding passport.js
const passport = require('passport');
require('./passport');



app.get("/", (req, res) => {
    res.send("Welcome to my movie app!");
});

// Retrieves all movies
app.get("/movies", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const movies = await Movies.find();
        res.status(200).json(movies);
    } catch (err) {
        res.status(500).send("Error: " + err);
    }
});

// Retrieves movie by title
app.get("/movies/:Title", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const movie = await Movies.findOne({ Title: req.params.Title });
        res.json(movie);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

// Retrieves movie by genre
app.get("/movies/genre/:Genre", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const movie = await Movies.findOne({ "Genre.Name": req.params.Genre });
        res.json(movie);
    } catch (err) {
        res.status(500).send("Error: " + err);
    }
});

// Retrieves movie by director
app.get("/movies/director/:Director", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const movie = await Movies.findOne({
            "Director.Name": req.params.Director,
        });

        res.json(movie);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error: " + err);
    }
});

// Add new user
/* JSON format expected
{
    ID: Integer,
    Username: String,
    Password: String,
    Email: String,
    Birthday: Date
}
*/
app.post('/users',
  [
    check('Username', 'Username is required').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
  ], async (req, res) => {

  // check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOne({ Username: req.body.Username }) // Search to see if a user with the requested username already exists
      .then((user) => {
        if (user) {
          //If the user is found, send a response that it already exists
          return res.status(400).send(req.body.Username + ' already exists');
        } else {
          Users
            .create({
              Username: req.body.Username,
              Password: hashedPassword,
              Email: req.body.Email,
              Birthday: req.body.Birthday
            })
            .then((user) => { res.status(201).json(user) })
            .catch((error) => {
              console.error(error);
              res.status(500).send('Error: ' + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  });

// Get all users
app.get("/users", async (req, res) => {
    try {
        const users = await Users.find();
        res.status(200).json(users);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

// Get a user by username
app.get("/users/:Username", async (req, res) => {
    try {
        const user = await Users.findOne({ Username: req.params.Username });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

//Deletes user profile
app.delete("/users/:Username", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const user = await Users.findOneAndRemove({
            Username: req.params.Username,
        });
        if (!user) {
            return res.status(400).send(req.params.Username + " was not found!");
        }
        res.status(200).send(req.params.Username + " was deleted.");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});
// Update User's information
/*
JSON format expected
{
    Username: String, (required)
    Password: String, (required)
    Email: Sting, (required)
    Birthday: Date
}
*/
app.put("/users/:Username", passport.authenticate('jwt', { session: false }), async (req, res) => {
    // CONDITION TO CHECK ADDED HERE
    if (req.user.Username !== req.params.Username) {
        return res.status(400).send('Permission denied');
    }
    try {
        const updatedUser = await Users.findOneAndUpdate(
            { Username: req.params.Username },
            {
                $set: {
                    Username: req.body.Username,
                    Password: req.body.Password,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday,
                },
            },
            { new: true },
        );

        res.json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

// Add movie to user list
app.post("/users/:Username/movies/:MovieID", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const updatedUser = await Users.findOneAndUpdate(
            { Username: req.params.Username },
            { $push: { FavoriteMovies: req.params.MovieID } },
            { new: true },
        );
        res.json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

//Deletes movie from user list
app.delete("/users/:Username/movies/:MovieID", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const updatedUser = await Users.findOneAndUpdate(
            { Username: req.params.Username },
            { $pull: { FavoriteMovies: req.params.MovieID } },
            { new: true },
        );
        res.json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.use(express.static("public"));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something is not working!");
    next();
});



const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});




