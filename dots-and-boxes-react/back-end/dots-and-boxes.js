// creating a backend for a dots and boxes game
// this will write to mongoDB and return the game board design to the front end
// this will also be used to write who won the game to the database

const express = require('express');
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

const port = 3001

const mongoose = require('mongoose');

// connect to the database
mongoose.connect('mongodb://localhost:27017/test', {
  useUnifiedTopology: true,
  useNewUrlParser: true
});
// game board is a 2D array
const game_board = new mongoose.Schema({
    game_id: String,
    game_board: Array, // 2D array
  });

game_board.virtual('game_board_size').get(function() {
    return this.game_board.length;
    });

const player = new mongoose.Schema({
    player_id: String,
    player_name: String,
    player_wins: Number,
    player_losses: Number,
    });

// create a virtual parameter for the player
player.virtual('player').get(function() {
    return this.player_name;
    });

// create a model for boards
const Board = mongoose.model('Board', game_board);
const Player = mongoose.model('Player', player);
// get back the default game board from the db which is 10x10
app.get('/game_board', async (req, res) => {
    try {
        let board = await Board.find();
        res.send(board);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});


// get back the desired game board from the db indicated by the user
// if the game board is not in the db then create it and return it to the user
//helper function to create board
function createBoard(size){
    let board = [];
    for(let i = 0; i < size; i++){
        board.push([]);
        for(let j = 0; j < size; j++){
            board[i].push(0);
        }
    }
    return board;
}
app.get('/game_board/:boardSize', (req, res) => {
    // get the board size from the user
    let boardSize = req.params.boardSize;
    // check if the board is in the db
    Board.find({game_id: boardSize}, function(err, board) {
        if (err) {
            console.log(err);
            res.sendStatus(500);
        }
        // if the board is not in the db then create it and return it to the user
        if (board.length == 0) {
            // create the board
            let board = createBoard(boardSize);
            // add the board to the db
            Board.insertMany(board, function(err, docs) {
                if (err) {
                    console.log(err);
                    res.sendStatus(500);
                }
                // return the board to the user
                res.send(board);
            });
        }
        // if the board is in the db then return it to the user
        else {
            res.send(board);
        }
    }
    );
});





// get players history of wins and losses
app.get('/player/:player_id', async (req, res) => {
    try {
        let player = await Player.find({player_id: req.params.player_id});
        res.send(player);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

// add a new player to the database
// if the player already exists then return an error and do not add the player  
app.post('/player', async (req, res) => {
    try {
        let player = await Player.find
        ({player_id: req.body.player_id});
        if (player.length == 0) {
            let player = new Player({
                player_id: req.body.player_id,
                player_name: req.body.player_name,
                player_wins: 0,
                player_losses: 0,
            });
            await player.save();
            res.send(player);
        }
        else {
            res.send("Player username already exists");
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});


// add a new win or loss to the database
// if the player does not exist then return an error and do not add the win or loss
app.put('/player/:player_id', async (req, res) => {
    try {
        let player = await Player.find({player_id: req.params.player_id});
        if (player.length == 0) {
            res.send("Player username does not exist");
        }
        else {
            if (req.body.player_wins == 1) {
                player[0].player_wins += 1;
            }
            else {
                player[0].player_losses += 1;
            }
            await player[0].save();
            res.send(player);
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});



// add a new win or loss to the database
// if the player does not exist then return an error and do not add the win or loss
app.put('/player/:player_id', async (req, res) => {
    try {
        let player = await Player.find({player_id: req.params.player_id});
        if (player.length == 0) {
            res.send("Player username does not exist");
        }
        else {
            if (req.body.player_wins == 1) {
                player[0].player_wins += 1;
            }
            else {
                player[0].player_losses += 1;
            }
            await player[0].save();
            res.send(player);
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.post('/game_board', async (req, res) => {
    try {
        let board = await Board.find
        ({
            game_id: req.body.game_id,
            game_board: req.body.game_board
        });
        if (board.length == 0) {
            let board = new Board({
                game_id: req.body.game_id,
                game_board: req.body.game_board
            });
            await board.save();
            res.send(board);
        }
        else {
            res.send("Board already exists");
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});


// delete a player from the database
// if the player does not exist then return an error and do not delete the player
app.delete('/deletePlayer/:playerName', (req, res) => {
    Player.deleteOne({player_name: req.params.playerName}, function(err, obj) {
        if (err) {
            console.log(err);
            res.sendStatus(500);
        }
        res.send(obj);
    });
});


app.listen(port, () => {
    console.log(`Server listening on ${port}`)
})