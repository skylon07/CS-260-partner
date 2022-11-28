// creating a backend for a dots and boxes game
// this will write to mongoDB and return the game board design to the front end
// this will also be used to write who won the game to the database
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
// Route requires

const PORT = 3001
const app = express()
app.use(cors());
app.use(bodyParser.json());


const clientDnB= mongoose.connect(
  'mongodb://localhost:27017/dotsAndBoxes',
  { useNewUrlParser: true, useUnifiedTopology: true }
).then(m => m.connection.getClient())

// defining the game board schema and the player schema
const gameBoardSchema = new mongoose.Schema({
    game_id: String,
    board: Array,
});

const playerSchema = new mongoose.Schema({
    player_id: String,
    player_wins: Number,
    player_losses: Number,
});

// creating the game board model and the player model
const GameBoard = mongoose.model('GameBoard', gameBoardSchema);
const Player = mongoose.model('Player', playerSchema);

// insert into the game board collection
app.post('/api/boards', (req, res) => {
    const gameBoard = new GameBoard({
        game_id: req.body.game_id,
        board: req.body.board,
    });
    try {
        gameBoard.save().then((result) => {
        res.send(result);
        });
    } catch (err) {
        console.error(err.response.data); 
    }
});

// insert into the player collection
app.post('/api/players', (req, res) => {
    const player = new Player({
        player_id: req.body.player_id,
        player_wins: req.body.player_wins,
        player_losses: req.body.player_losses,
    });
    try {
        player.save().then((result) => {
            res.send(result);
        });
    }
    catch (err) {
        console.error(err.response.data); 
    }
});

// get game board by game id
app.get('/api/boards/:game_id', (req, res) => {
    try {
        GameBoard.findOne({ game_id: req.params.game_id }).then((result) => {
            res.send(result);
        });
    } catch (err) {
        console.error(err.response.data); 
    }
});

// get player by player id
app.get('/api/players/:player_id', (req, res) => {
    try {
        Player.findOne({ player_id: req.params.player_id }).then((result) => {
            res.send(result);
        });
    } catch (err) {
        console.error(err.response.data); 
    }
});

// get all game boards
app.get('/api/boards', (req, res) => {
    try {
        GameBoard.find({}).then((result) => {
            res.send(result);
        });
    } catch (err) {
        console.error(err.response.data); 
    }
});

// get all players
app.get('/api/players', (req, res) => {
    try {
        Player.find({}).then((result) => {
            res.send(result);
        });
    } catch (err) {
        console.error(err.response.data); 
    }
});

// increment the player wins
app.put('/api/players/:player_id', (req, res) => {
    try {
        Player.findOneAndUpdate({ player_id: req.params.player_id }, { $inc: { player_wins: 1 } }).then((result) => {
            res.send(result);
        });
    } catch (err) {
        console.error(err.response.data); 
    }
});

// increment the player losses
app.put('/api/players/:player_id', (req, res) => {
    try {
        Player.findOneAndUpdate({ player_id: req.params.player_id }, { $inc: { player_losses: 1 } }).then((result) => {
            res.send(result);
        });
    } catch (err) {
        console.error(err.response.data); 
    }
});

// delete a game board by game id
app.delete('/api/boards/:game_id', (req, res) => {
    try {
        GameBoard.findOneAndDelete({ game_id: req.params.game_id }).then((result) => {
            res.send(result);
        });
    } catch (err) {
        console.error(err.response.data); 
    }
});

// delete a player by player id
app.delete('/api/players/:player_id', (req, res) => {
    try {
        Player.findOneAndDelete({ player_id: req.params.player_id }).then((result) => {
            res.send(result);
        });
    } catch (err) {
        console.error(err.response.data); 
    }
});

// listen on port 3001
app.listen(PORT, () => {
    console.log('listening on port ' + PORT);
});
