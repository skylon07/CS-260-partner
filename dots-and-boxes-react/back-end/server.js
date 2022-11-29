// creating a backend for a dots and boxes game
// this will write to mongoDB and return the game board design to the front end
// this will also be used to write who won the game to the database
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
// Route requires

const PORT = 3001;
/*global db*/
const app = express();
app.use(cors());
app.use(bodyParser.json());

// connect to the mongoDB database on atlas
const url = `mongodb+srv://free-cluster-admin:CS260IsSoAwesome@free-cluster-woohoo.truers8.mongodb.net/?retryWrites=true&w=majority`;

const connectionParams={
    useNewUrlParser: true,
    useUnifiedTopology: true 
}
mongoose.connect(url,connectionParams)
    .then( () => {
        console.log('Connected to database ')
    })
    .catch( (err) => {
        console.error(`Error connecting to the database. \n${err}`);
    })


// add a game board to the database
function add_game_board(game_board) {
    const collection = db.collection("game_boards");
    collection.insertOne(game_board
        , function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            //client.close();
        }
    );
}

// get a game board from the database
function get_game_board(game_id) {
    const collection = db.collection("game_boards");
    collection.findOne({game_id: game_id}, function(err, result) {
        if (err) throw err;
        console.log(result.game_board);
        //client.close();
    });
}

// get all game boards from the database
function get_all_game_boards() {
    const collection = db.collection("game_boards");
    collection.find({}).toArray(function(err, result) {
        if (err) throw err;
        console.log(result);
        //client.close();
    });
}

// delete a game board from the database
function delete_game_board(game_id) {
    const collection = db.collection("game_boards");
    collection.deleteOne({game_id: game_id}, function(err, obj) {
        if (err) throw err;
        console.log("1 document deleted");
        //client.close();
    }
    );
}

// add a player to the database
function add_player(player) {
    const collection = db.collection("players");
    collection.insertOne(player
        , function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            //client.close();
        }
    );
}

// get a player from the database
function get_player(player_id) {
    const collection = db.collection("players");
    collection.findOne
    ({player_id: player_id}, function(err, result) {
        if (err) throw err;
        console.log(result);
        //client.close();
    }
    );
}

// get all players from the database
function get_all_players() {
    const collection = db.collection("players");
    collection.find({}).toArray(function(err, result) {
        if (err) throw err;
        console.log(result);
        //client.close();
    });
}

// increment the wins for a player
function increment_wins(player_id) {
    const collection = db.collection("players");
    collection.update
    ({player_id: player_id}, {$inc: {player_wins: 1}}, function(err, result) {
        if (err) throw err;
        console.log(result);
        //client.close();
    }
    );
}

// increment the losses for a player
function increment_losses(player_id) {
    const collection = db.collection("players");
    collection.update
    ({player_id: player_id}, {$inc: {player_losses: 1}}, function(err, result) {
        if (err) throw err;
        console.log(result);
        //client.close();
    }
    );
}

// delete a player from the database
function delete_player(player_id) {
    const collection = db.collection("players");
    collection.delete
    ({player_id: player_id}, function(err, obj) {
        if (err) throw err;
        console.log("1 document deleted");
        //client.close();
    }
    );
}

// export the functions so they can be used in other files
module.exports = {
    add_game_board: add_game_board,
    get_game_board: get_game_board,
    get_all_game_boards: get_all_game_boards,
    delete_game_board: delete_game_board,
    add_player: add_player,
    get_player: get_player,
    get_all_players: get_all_players,
    increment_wins: increment_wins,
    increment_losses: increment_losses,
    delete_player: delete_player
}

// listen on port 3001
app.listen(PORT, () => {
    console.log('listening on port 3001');
});