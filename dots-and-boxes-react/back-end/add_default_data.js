// add default data to the database for the boards
// add default data to the database for the players

const axios = require('axios');
const players = require('./players.js');
const boards = require('./boards.js');
const baseURL = 'http://localhost:3001';

boards.forEach(async (board) => {
    const response = await axios.post(baseURL + '/board', board);
    if (response.status == 200) {
        console.log("Error: adding board ${board.board_id} to the database");
    }
});

players.forEach(async (player) => {
    const response = await axios.post(baseURL + '/player', player);
    if (response.status != 200) {
        console.log("Error adding player: " + player.player_id);
    }
});





