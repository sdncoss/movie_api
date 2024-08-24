
const dotenv = require('dotenv');
dotenv.config();

//utilizing Express, Morgan, Mongoose and MongoDB to set up a local API
const express = require('express');
const mongoose = require('mongoose');
const Models = require('./models.js');
const { check, validationResult } = require('express-validator');


const app = express();

const Movies = Models.Movie;
const Users = Models.User;

//mongoose.connect( 'mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });
//mongoose.connect( 'mongodb+srv://myFlixDBAdmin:key4Admin@myflixdb.pbuuvfd.mongodb.net/my-flix-db?retryWrites=true&w=majority&appName=myFlixDB');
///connects to MongoDB Atlas database
mongoose.connect(process.env.CONNECTION_URI).then(() => console.log("connected to db"));

//Utilizing Express' encouded URL for endpoints
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Importing CORS Allowing specific HTTP to access database
const cors = require('cors');
let allowedOrigins = ['http://localhost:8080', 'http://testsite.com', 'http://localhost:1234', 'https://movieflixappforyou.netlify.app', 'http://localhost:4200'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) { // If a specific origin isn’t found on the list of allowed origins
            let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
            return callback(new Error(message), false);
        }
        return callback(null, true);
    }
}));
//Importing auth.js for generating JWT Token
let auth = require('./auth')(app);

//Importing passport.js to authenticate the Username and Password match the database
const passport = require('passport');
require('./passport.js');


/**
 * READ index page
 * @function
 * @name getIndexPage
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - Sends a string response "Welcome to my movie page!".
 */
app.get("/", (req, res) => {
    res.send("Welcome to my movie app!");
});




//Serve the “documentation.html” and any other files from the public folder
app.use(express.static('public'));

/**
 * READ movie list
 * @function
 * @name getAllMovies
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @throws {Error} - If there is an error while retrieving movies from the database.
 * @returns {Object} - Returns JSON response containing all movies.
 */
app.get("/movies", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const movies = await Movies.find();
        res.status(200).json(movies);
    } catch (err) {
        res.status(500).send("Error: " + err);
    }
});

/**
 * READ movie by name
 * @function
 * @name getOneMovies
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {string} req.params.movieID - The title of the movie to retrieve.
 * @throws {Error} - If there is an error while retrieving movie from the database.
 * @returns {Object} - Returns JSON response containing requested movies.
 */
app.get("/movies/:movieId", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const movie = await Movies.findOne({ Title: req.params.movieId });
        res.json(movie);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

/**
 * READ genre by name
 * @function
 * @name getGenre
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {string} req.params.genreName - The name of the genre to retrieve from the database.
 * @throws {Error} - If there is an error while retrieving genre from the database.
 * @returns {Object} - Returns JSON response containing the genre object of the requested movies.
 */
app.get("/movies/genre/:Genre", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const movie = await Movies.findOne({ "Genre.Name": req.params.Genre });
        res.json(movie);
    } catch (err) {
        res.status(500).send("Error: " + err);
    }
});

/**
 * READ director by name
 * @function
 * @name getDirector
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {string} req.params.directorName - The name of the director to retrieve from the database.
 * @throws {Error} - If there is an error while retrieving director from the database.
 * @returns {Object} - Returns JSON response containing the director object of the requested movies.
 */
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

/**
 * CREATE new user
 * @function
 * @name userRegistration
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @throws {Error} - If there is an error when creating the new user. 
 * @returns {Object} - Returns JSON response containing the new user.
 */
app.post('/users',
    [
        check('Username', 'Username is required').isLength({ min: 5 }),
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



/**
 * READ all users
 * @function
 * @name getAllUsers
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @throws {Error} - If there is an error while retrieving users from the database.
 * @returns {Object} - Returns JSON response containing the all users.
 */
app.get("/users", async (req, res) => {
    try {
        const users = await Users.find();
        res.status(200).json(users);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

/**
  * READ a user by username
 * @function
 * @name getOneUser
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {string} req.params.Username - The username of the user to retrieve.
 * @throws {Error} - If there is an error while retrieving the user from the database.
 * @returns {Object} - Returns JSON response containing the user with this username.
 */
app.g
app.get("/users/:Username", async (req, res) => {
    try {
        const user = await Users.findOne({ Username: req.params.Username });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

/**
 * DELETE user by Username
 * @function
 * @name deleteUser
 * @param {Object} req - Express request object.
 * @param {Object} req.user - User object obtained from JWT authentication.
 * @param {string} req.params.Username - The username of the user to delete.
 * @param {Object} res - Express response object.
 * @throws {Error} -  If there is an error while deleting the user from the database.
 * @returns {Object} - Returns message indicating whether the user was successfully deleted or not.
 */
app.d
app.delete("/users/:Username", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const user = await Users.findOneAndDelete({
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

/**
 * UPDATE user information by username
 * @function
 * @name updateUser
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {string} req.params.Username - The username of the user to update.
 * @throws {Error} - If there is an error while validating input or updating user data in the database.
 * @returns {Object} - JSON response containing the updated user.
 */
app.put("/users/:Username", passport.authenticate('jwt', { session: false }), async (req, res) => {
    // CONDITION TO CHECK ADDED HERE
    if (req.user.Username !== req.params.Username) {
        return res.status(400).send('Permission denied');
    }
    // Hash the password if it's provided in the request
    let updatedFields = { ...req.body };
    if (req.body.Password) {
        updatedFields.Password = Users.hashPassword(req.body.Password);
    }

    try {
        const updatedUser = await Users.findOneAndUpdate(
            { Username: req.params.Username },
            {
                $set: updatedFields
            },
            { new: true },
        );

        res.json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

/**
 * CREATE new favorite movie for user
 * @function
 * @name addFavorite
 * @param {Object} req - Express request object.
 * @param {Object} req.user - User object obtained from JWT authentication.
 * @param {string} req.params.Username - The username of the user.
 * @param {string} req.params.MovieID - The ID of the movie to add to the user's favorites.
 * @param {Object} res - Express response object.
 * @throws {Error} - If there is an error while updating user data in the database.
 * @returns {Object} - Returns JSON response containing the updated user's information.
 */
app.post("/users/:Username/movies/:movieId", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const updatedUser = await Users.findOneAndUpdate(
            { Username: req.params.Username },
            { $push: { FavoriteMovies: req.params.movieId } },
            { new: true },
        );
        res.json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

/**
 * DELETE favorite movie for user
 * @function
 * @name removeFavorite
 * @param {Object} req - Express request object.
 * @param {Object} req.user - User object obtained from JWT authentication.
 * @param {string} req.params.Username - The username of the user.
 * @param {string} req.params.MovieID - The ID of the movie to remove from the user's favorites.
 * @param {Object} res - Express response object.
 * @throws {Error} - If there is an error while updating user data in the database.
 * @returns {Object} - Returns JSON response containing the updated user's information.
 */
app.delete("/users/:Username/movies/:movieId", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const updatedUser = await Users.findOneAndUpdate(
            { Username: req.params.Username },
            { $pull: { FavoriteMovies: req.params.movieId } },
            { new: true },
        );
        res.json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.use(express.static("public"));
//error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something is not working!");
    next();
});



//listen for request
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on Port ' + port);
});




