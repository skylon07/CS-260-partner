// the players array is exported so it can be used in other files
// the player looks like const player = new mongoose.Schema({
//     player_id: String,
//     player_name: String,
//     player_wins: Number,
//     player_losses: Number,
//     });
//

const players = [
    {
        player_id: "1",
        player_name: "Taylor",
        player_wins: 0,
        player_losses: 2,
    },
    {
        player_id: "2",
        player_name: "Thomas",
        player_wins: 2,
        player_losses: 0,
    },
    {
        player_id: "3",
        player_name: "Trevor",
        player_wins: 0,
        player_losses: 3,
    },
    {
        player_id: "4",
        player_name: "Tanner",
        player_wins: 3,
        player_losses: 0,
    },
    {
        player_id: "5",
        player_name: "Trent",
        player_wins: 0,
        player_losses: 0,
    },
];
module.exports = players
