// add dummy data to the mongodb using the functions defined in dots_&_boxes.js
// add dummy data to the database for the players
const axios = require('axios');
const baseURL = "http://localhost:3001";

const game_boards = [
    {
        game_id: "10x10",
        game_board: [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ],
    },
    {
        game_id: "9x9",
        game_board: [
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0]
        ],
    },
    {
        game_id: "8x8",
        game_board: [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0]
        ],
    },
    {
        game_id: "7x7",
        game_board: [
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0]
        ],
    },
    {
        game_id: "6x6",
        game_board: [
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0]
        ],
    },
    {
        game_id: "5x5",
        game_board: [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
    },
];
const players = [
    {
        player_id: "skylon05",
        player_wins: 0,
        player_losses: 2,
    },
    {
        player_id: "tml88124",
        player_wins: 2,
        player_losses: 0,
    },
    {
        player_id: "snowyglacier13",
        player_wins: 0,
        player_losses: 3,
    },
    {
        player_id: "dranoel76",
        player_wins: 3,
        player_losses: 0,
    },
    {
        player_id: "smartapple",
        player_wins: 0,
        player_losses: 0,
    },
];

players.forEach(async (player) => {
    const response = await axios.post(`${baseURL}/api/players`, player);
  if (response.status != 200)
    console.log(`Error adding ${player.player_id}, code ${response.status}`);
});


game_boards.forEach(async (game_board) => {
  const response = await axios.post(`${baseURL}/api/boards`, game_board);
  if (response.status != 200)
    console.log(`Error adding ${game_board.game_id}, code ${response.status}`);
});


// add the players to the database


