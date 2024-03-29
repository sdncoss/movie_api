const express = require('express');
morgan = require('morgan');

const app = express();


app.use(morgan('common'));

app.get('/', (req, res) => {
    res.send('Welcome to my movie app!');
});
// Retrieves list of top movies
app.get('/movies', (req, res) => {
    res.json(topMovies);
});
// Retrieves movie by title
app.get('/movies[title]', (req, res) => {
    res.json(movies.find((movie) => {
        return movie.title === req.params.title
    }));
});

// Retrieves movie by genre
app.get('/movies[genre]', (req, res) => {
    res.json(movies.find((movie) => {
        return movie.genre === req.params.genre
    }));
});

// Retrieves movie by director
app.get('/movies[director]', (req, res) => {
    res.json(movies.find((movie) => {
        return movie.director === req.params.director
    }));
});

// Add new user
app.post('/users', (req, res) => {
    let newUser = req.body;

    if (!newUser.name || !newUser.username || !newUser.email) {
        const message = 'Missing information in request body';
        res.status(400).send(message);
    } else {
        newUser.id = uuid.v4();
        users.push(newUser);
        res.status(201).send(newUser);
    }
});

//Deletes user profile 
app.delete('/users[profile]', (req, res) => {
    let user = users.find((user) => { return user.id === req.params.id });

    if (user) {
        users = users.filter((obj) => { return obj.id !== req.params.id });
        res.status(201).send('User ' + req.params.id + ' was deleted.');
    }
});
// Update User's information
app.put('/users[profile]', (req, res) => {
    let updateUser = req.body;

    if (!updateUser.name || !updateUser.username || !updateUser.email) {
        const message = 'Missing information in request body';
        res.status(400).send(message);
    } else {
        users.map(updateUser);
        res.status(201).send(updateUser);
    }
});

// Add movie to user list
app.post('/users[profile]/movies[title]', (req, res) => {
    let addToList = req.body;

    if (!movie.title) {
        const message = 'Movie Not Found';
        res.status(400).send(message);
    } else {
        faveList.push(addToList);
        res.status(201).send(addToList);
    }
});

//Deletes movie from user list
app.delete('/users[profile]/movies[title]', (req, res) => {
    let movie = movies.find((movie) => {
        return movie.title === req.params.title
    });

    if (movie) {
        movies = movies.filter((obj) => { return obj.title !== req.params.title });
        res.status(201).send('Movie ' + req.params.title + ' was deleted from list.');
    }
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