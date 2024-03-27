const express = require('express');
morgan = require('morgan');

const app = express();

let topMovies = [];

app.use(morgan('common'));

app.get('/', (req, res) => {
    res.send('Welcome to my movie app!');
});

app.get('/movies', (req, res) => {
    res.json(topMovies);
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