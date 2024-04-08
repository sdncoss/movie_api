const express = require('express');
morgan = require('morgan');

const app = express();
// Adding mongoose and mongodb
const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });


app.use(morgan('common'));

app.get('/', (req, res) => {
    res.send('Welcome to my movie app!');
});
// Retrieves list of top movies
//app.get('/movies', (req, res) => {
//    res.json(topMovies);
//});

// Retrieves all movies 
app.get('/movies', async (req, res) => {
    await Movies.find().then((movies) => {
        res.status(201).json(movies);
    })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// Retrieves movie by title
app.get('/movies/:Title', async (req, res) => {
    await Movies.findOne({ Title: req.params.Title }).then((movie) => {
        res.json(movie);
    })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// Retrieves movie by genre
app.get('/movies/:Genre', async (req, res) => {
    await Movies.findOne({ 'Genre.Name': req.params.Genre.Name }).then((movie) => {
        res.json(movie);
    })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// Retrieves movie by director
app.get('/movies/:Director', async (req, res) => {
    await Movies.findOne({ 'Director.name': req.params.Director }).then((movie) => {
        res.json(movie);
    })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
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
app.post('/users', async (req, res) => {
    await Users.findOne({ Username: req.body.Username }).then(
        (user) => {
            if (user) {
                return res.status(400).send(req.body.Username + 'already exists');
            } else {
                Users
                    .create({
                        Username: req.body.Username,
                        Password: req.body.Password,
                        Email: req.body.Email,
                        Birthday: req.body.Birthday
                    })
                    .then((user) => { res.status(201).json(user) })
                    .catch((error) => {
                        console.error(error);
                        res.status(500).send('Error: ' + error);
                    })
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

// Get all users
app.get('/users', async (req, res) => {
    await Users.find().then((users) => {
        res.status(201).json(users);
    })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// Get a user by username
app.get('/users/:Username', async (req, res) => {
    await Users.findOne({ Username: req.params.Username }).then((user) => {
        res.json(user);
    })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//Deletes user profile 
app.delete('/users/:Username', async (req, res) => {
    await Users.findOneAndRemove({ Username: req.params.Usernam })
    .then((user) => {
        if (!user) {
            res.status(400).send(req.params.Username + ' was not found!');
        } else {
            res.status(200).send(req.params.Username + ' was deleted.');
        }
    })
    .cathc((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
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
app.put('/users/:Username', async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username },
        {
            $set:
            {
                Username: req.body.Username,
                Password: req.body.Password,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            }
        },
        { new: true })
        .then((updatedUser) => {
            res.json(updateUser);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        })
});

// Add movie to user list
app.post('/users/:Username/movies/:MovieID', async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username },
        { $push: { FavoriteMovies: req.params.MovieID } },
        { new: true })
        .then((updatedUser) => {
            res.json(updatedUser);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//Deletes movie from user list
app.delete('/users/:Username/movies/:MovieID', async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username },
        { $pull: { FavoriteMovies: req.params.MovieID } },
        { new: true })
        .then((updatedUser) => {
            res.json(updatedUser);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

app.use(express.static('public'));


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something is not working!');
    next();
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});