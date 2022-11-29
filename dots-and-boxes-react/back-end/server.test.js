const axios = require("axios");

const baseURL = "http://localhost:3001";

// empty the database
axios.delete(`${baseURL}/api/players`).then((response) => {
    if (response.status != 200) console.log("Error deleting products");
});

//empty the database
axios.delete(`${baseURL}/api/boards`).then((response) => {
    if (response.status != 200) console.log("Error deleting products");
});

describe("Test the player functions", () => {
    let playerID = "player1";
    test("It should add a new player to the database", async () => {
        const response = await axios.post(baseURL + "/api/players", {
            player_id: "player1",
        });
        expect(response.data.player_id).toEqual("player1");
        //playerID = response.data._id;
    });

    test("It should get all the players from the database", async () => {
        const response = await axios.get(baseURL + "/api/players");
        expect(response.data.length).toBe(1);
    });

    test("It should get a player from the database", async () => {
        const response = await axios.get(baseURL + "/api/players/" + playerID);
        expect(response.data.player_id).toEqual("player1");
    });

    test("It should update a player in the database", async () => {
        const response = await axios.put(baseURL + "/api/players/win/" + playerID);
        expect(response.data.player_wins).toBe(1);
    });
});

describe("Test the game board functions", () => {
    let boardID = "game1";
    test("It should add a new game board to the database", async () => {
        const response = await axios.post(baseURL + "/api/boards", {
            game_id: "game1",
            board: [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0],
            ],
        });
        expect(response.data.game_id).toBe("game1");
        //boardID = response.data._id;
    });

    test("It should get all the game boards from the database", async () => {
        const response = await axios.get(baseURL + "/api/boards");
        expect(response.data.length).toBe(1);
    });

    test("It should get a game board from the database", async () => {
        const response = await axios.get(baseURL + "/api/boards/" + boardID);
        expect(response.data.game_id).toBe("game1");
    });
} );