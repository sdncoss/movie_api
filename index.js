const express = require("express");
const morgan = require("morgan");

const app = express();
// Adding mongoose and mongodb
const mongoose = require("mongoose");
const Models = require("./models.js");

const Movies = Models.Movie;
const Users = Models.User;

mongoose
    .connect("mongodb://localhost/myFlixDB")
    .then(() => console.log("mongodb connected"));

app.use(morgan("common"));

app.get("/", (req, res) => {
    res.send("Welcome to my movie app!");
});

// Retrieves all movies
app.get("/movies", async (req, res) => {
    try {
        const movies = await Movies.find();
        res.status(200).json(movies);
    } catch (e) {
        res.status(500).send("Error: " + err);
    }
});

// Retrieves movie by title
app.get("/movies/:Title", async (req, res) => {
    try {
        const movie = await Movies.findOne({ Title: req.params.Title });
        res.json(movie);
    } catch (e) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

// Retrieves movie by genre
app.get("/movies/genre/:Genre", async (req, res) => {
    try {
        const movie = await Movies.findOne({ "Genre.Name": req.params.Genre });
        res.json(movie);
    } catch (err) {
        res.status(500).send("Error: " + err);
    }
});

// Retrieves movie by director
app.get("/movies/director/:Director", async (req, res) => {
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
app.post("/users", async (req, res) => {
    try {
        const user = await Users.findOne({ Username: req.body.Username });
        if (user) {
            return res.status(400).send(req.body.Username + "already exists");
        } else {
            const createdUser = await Users.create({
                Username: req.body.Username,
                Password: req.body.Password,
                Email: req.body.Email,
                Birthday: req.body.Birthday,
            });
            return res.status(201).json(createdUser);
        }
    } catch (e) {
        res.status(500).send("Error: " + error);
    }
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
app.delete("/users/:Username", async (req, res) => {
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
app.put("/users/:Username", async (req, res) => {
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
app.post("/users/:Username/movies/:MovieID", async (req, res) => {
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
app.delete("/users/:Username/movies/:MovieID", async (req, res) => {
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

app.listen(8080, () => {
    console.log("Your app is listening on port 8080.");
});