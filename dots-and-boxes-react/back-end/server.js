// creating a backend for a dots and boxes game
// this will write to mongoDB and return the game board design to the front end
// this will also be used to write who won the game to the database
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { argv } = require('process');

// Route requires

const PORT_DEFAULT = 27145;
const app = express();
app.use(cors());
app.use(bodyParser.json());
const router = express.Router();

const url = `mongodb+srv://Tleonard:espadatax131@cluster0.bqckd9k.mongodb.net/dots_and_boxes?retryWrites=true&w=majority`;

const connectionParams={
    useNewUrlParser: true,
    useUnifiedTopology: true 
};
mongoose.connect(url,connectionParams)
    .then( () => {
        console.log('Connected to database ');
    })
    .catch( (err) => {
        console.error(`Error connecting to the database. \n${err}`);
    });
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'));

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
const GameBoard = mongoose.model('GameBoard', gameBoardSchema, 'game_boards');
const Player = mongoose.model('Player', playerSchema, 'players');




// insert into the game board collection
app.post('/dots-and-boxes-api/boards', async(req, res) => {
    const newBoard = new GameBoard({
        game_id: req.body.game_id,
        board: req.body.board,
    });
    const insertedBoard = await newBoard.save();
    return res.send(insertedBoard);
});

// insert into the player collection
app.post('/dots-and-boxes-api/players', async(req, res) => {
    const newPlayer = new Player({
        player_id: req.body.player_id,
        player_wins: 0,
        player_losses: 0,
    });
    const insertedPlayer = await newPlayer.save();
    return res.send(insertedPlayer);
});

// get all the game boards
app.get('/dots-and-boxes-api/boards', async(req, res) => {
    const boards = await GameBoard.find();
    return res.send(boards);
});

// get all the players
app.get('/dots-and-boxes-api/players', async(req, res) => {
    const players = await Player.find();
    return res.send(players);
} );

// get a specific game board
app.get('/dots-and-boxes-api/boards/:id', async(req, res) => {
    const board = await GameBoard.findOne({game_id: req.params.id});
    return res.send(board);
});

// get a specific player
app.get('/dots-and-boxes-api/players/:id', async(req, res) => {
    console.log(req.params.id);
    const player = await Player.findOne({player_id: req.params.id});
    return res.send(player);
});

// increment the wins for a player
app.put('/dots-and-boxes-api/players/win/:id', async(req, res) => {
    const player = await Player.findOne({player_id: req.params.id});
    player.player_wins = player.player_wins + 1;
    await player.save();
    return res.send(player);
});

// increment the losses for a player
app.put('/dots-and-boxes-api/players/loss/:id', async(req, res) => {
    const player = await Player.findOne({player_id: req.params.id});
    player.player_losses = player.player_losses + 1;
    await player.save();
    return res.send(player);
} );

// delete all game boards
app.delete('/dots-and-boxes-api/boards', async(req, res) => {
    await GameBoard.deleteMany();
    return res.send({message: 'Deleted all boards'});
});


// delete all players
app.delete('/dots-and-boxes-api/players', async(req, res) => {
    await Player.deleteMany();
    return res.send({message: 'Deleted all players'});
} );

const portArg = parseInt(argv[2])
const port = portArg || PORT_DEFAULT
app.listen(port, () => console.log(`Server listening on port ${port}`))
