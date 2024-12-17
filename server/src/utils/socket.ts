import game from "./games";
import { io } from "..";
import User from "../models/userModel";
import { Socket } from "socket.io";
const ioClient = require('socket.io-client');
const ws = ioClient(`http://localhost:${process.env.PORT}`);
const { Chess } = require('chess.js');
const chess = new Chess();
let hit = false;
const MATCH_BOT_WITH_PLAYER_TIMEOUT = 5000;
const AUTO_ABORT_TIMEOUT = 10000
function getBestMoveAndUpdatedFen(fenPosition) {
    chess.load(fenPosition);
    try {
        // Generate a random move
        const moves = chess.moves({ verbose: true });
        const randomMove = moves[Math.floor(Math.random() * moves.length)];

        if (!randomMove) {
            throw new Error('No valid moves available.');
        }

        // Make the random move
        chess.move(randomMove.san);

        // Get the updated FEN
        const updatedFen = chess.fen();

        return updatedFen;
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    } finally {
        // Optionally handle cleanup here if needed
    }
}

ws.on('updateScreen', async (gameData:any) => {
    chess.load(gameData.game)
    if(chess.turn() == 'b' && hit == false && chess.isGameOver() == false){
        hit = true;
        const fen =  getBestMoveAndUpdatedFen(gameData.game);
        const gameStatus = chess.isGameOver() 
                ? chess.isDraw() 
                    ? "draw" 
                    : chess.turn() === 'w' ? "loss" : "win"
                : "nill";
        ws.emit('move', gameData.id, fen, 'w', gameStatus);
        hit = false;
    }

})

const { v4: uuidv4 } = require('uuid');
function generateRandomId() {
    const uuid = uuidv4().replace(/-/g, '');
    return uuid.slice(0, 10);
}
function calculateDeltaRating(currentRating, opponentRating, result) {
    // Constants used in the Glicko-2 rating system (adjust if needed)
    const K = 32; // Rating volatility
    const g = 0.06; // Rating system constant
  
    // Score based on game result (win: 1, loss: 0, draw: 0.5)
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));
    let actualScore;
    if (result === "win") {
      actualScore = 1;
    } else if (result === "loss") {
      actualScore = 0;
    } else {
      actualScore = 0.5;
    }
  
    // Calculate delta rating
    const deltaRating = K * (actualScore - expectedScore);
  
    return Math.round(deltaRating);
  }
  async function updateRatings(newGame, result) {
    // Function to call the server endpoint to update rating
    // Calculate delta ratings based on result
    const whiteDelta = calculateDeltaRating(newGame.whiteRating, newGame.blackRating, result);
    const blackDelta = -whiteDelta; // Opponent's delta is negative of winner's
    io.to(newGame.id).emit('gameOver', newGame, whiteDelta);
    const inc1 = {games:1, wins:0}
    const inc2 = {games:1, wins:0}        
    if(result == 'win'){
        inc1.wins = 1
    }if(result == 'loss'){
        inc2.wins = 1
    }        
    // Update ratings on server (assuming updateRatingUrl points to a valid endpoint)
    try {
      await User.updateOne({username: newGame.whiteName},{$set:{rating:newGame.whiteRating+whiteDelta}, $inc:inc1})
      await User.updateOne({username: newGame.blackName},{$set:{rating:newGame.blackRating+blackDelta}, $inc:inc2})
      const idx = game.botsName.findIndex((el)=>{
        return el == newGame.blackName;
      })
      if(idx != -1){
        game.bots.push({username:newGame.blackName});
        ws.leave(game.games[newGame.id]);
      }
      delete game.games[newGame.id];
    } catch (error) {
      console.error("Error updating ratings:", error);
      // Handle errors appropriately (e.g., display error message to user)
    }
  }

function updateScreens(roomId:string, turn:string){
    clearInterval(game.intervals[roomId])
    game.intervals[roomId] = setInterval(()=>{
        if(turn == 'w'){
            game.games[roomId].whiteTimer-=1;
        }else{
            game.games[roomId].blackTimer-=1;
        }
        if(game.games[roomId].whiteTimer<=0){
            game.games[roomId].gameOver = 'loss';
            updateRatings(game.games[roomId], 'loss')
            clearInterval(game.intervals[roomId])
        }
        else if(game.games[roomId].blackTimer<=0){
            game.games[roomId].gameOver = 'win';
            updateRatings(game.games[roomId], 'win')
            clearInterval(game.intervals[roomId])
        }
        if(game.games[roomId].gameOver != 'nill'){
            updateRatings(game.games[roomId], game.games[roomId].gameOver)
            clearInterval(game.intervals[roomId])
        }
        io.to(roomId).emit('updateScreen', game.games[roomId], turn);
    },500)
}

function addPlayerToLobby(player) {
    game.lobby.push({
        ...player,
        lastActive: Date.now()
    });
}
function matchPlayerWithBot(){
    while(game.bots.length>0 && game.lobby.length>0){
        const obj = game.lobby[game.lobby.length-1];
        const newGame = {
            id: generateRandomId(),
            variant: obj.variant,
            whiteName: obj.username,
            whiteRating: obj.rating,
            blackName: game.bots[game.bots.length-1].username,
            blackRating:300,
            gameOver: "nill",
            whiteTimer: 120*obj.variant,
            game: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            blackTimer: 120*obj.variant,
        };
        game.bots.pop();
        game.lobby.pop();
        game.games[newGame.id] = newGame;
        chess.load(newGame.game);
        io.emit('joined/' + newGame.whiteName, newGame);
        ws.emit('joinRoom', newGame.id);
        abortGameInactivity(newGame.id);
    } 
}
function findActiveOpponent(player) {
    return game.lobby.find(opp => 
        opp.variant === player.variant && 
        opp.username !== player.username
    );
}
function abortGameInactivity(id:string){
    setTimeout(()=>{
        if(game.games[id] && game.games[id].game == 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'){
            io.to(game.games[id].id).emit("aborted");
            const idx = game.botsName.findIndex((el)=>{
                return el == game.games[id].blackName;
            })
            if(idx != -1){
                game.bots.push({username:game.games[id].blackName});
            }
            delete game.games[id];
        }
    },AUTO_ABORT_TIMEOUT)
}
// matchup players with bot
setInterval(matchPlayerWithBot, MATCH_BOT_WITH_PLAYER_TIMEOUT);

module.exports = (socket:Socket) => {
    socket.on('disconnect', () => {
        game.lobby = game.lobby.filter(item => item.socketId != socket.id);
    })
    socket.on('joinRoom', (roomName: string) => {
        socket.join(roomName);
    });
    socket.on("cancelJoin",() => {
        game.lobby = game.lobby.filter(item => item.socketId != socket.id);
    })
    socket.on("challengeSend", (player1:string, variant:string, rating:string, player2:string) => {
        if(player1!=player2){
            io.emit('challengeSend/'+player2, player1, variant, rating, player2);
        }
    })
    socket.on("challengeAccept", (player1:any, player2:any, variant: number) => {
        if(player1.username != player2.username){
            const newGame = {
                id: generateRandomId(),
                variant: variant,
                whiteName: player1.username,
                whiteRating: player1.rating,
                blackName: player2.username,
                blackRating: player2.rating,
                gameOver: "nill",
                whiteTimer: 120*variant,
                game: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                blackTimer: 120*variant,
            };
            game.games[newGame.id] = newGame;
            io.emit('joined/' + newGame.whiteName, newGame);
            io.emit('joined/' + newGame.blackName, newGame);
            abortGameInactivity(newGame.id);
        }
    })
    socket.on("challengeRejected", (player:string) => {
        io.emit('challengeRejected/'+player);
    })
    socket.on("move", (roomName: string, fen: string, turn: string, gameOver: boolean) => {
        game.games[roomName].game = fen;
        game.games[roomName].gameOver = gameOver;
        updateScreens(roomName, turn);
    });
    socket.on('resign', (roomId:string, username: string) => {
        clearInterval(game.intervals[roomId]);
        if(game.games[roomId] && game.games[roomId].whiteName == username){
            game.games[roomId].gameOver = 'loss';
            updateRatings(game.games[roomId], 'loss');
        }else{
            game.games[roomId].gameOver = 'win';
            updateRatings(game.games[roomId], 'win');
        }
    })
    socket.on("join", function(obj) {
        const opp = findActiveOpponent(obj);
        if (opp) {
            const newGame = {
                id: generateRandomId(),
                variant: obj.variant,
                whiteName: obj.username,
                whiteRating: obj.rating,
                blackName: opp.username,
                blackRating: opp.rating,
                gameOver: "nill",
                whiteTimer: 120*obj.variant,
                game: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                blackTimer: 120*obj.variant,
            };
            game.games[newGame.id] = newGame;
            io.emit('joined/' + newGame.whiteName, newGame);
            io.emit('joined/' + newGame.blackName, newGame);
            abortGameInactivity(newGame.id);
            game.lobby = game.lobby.filter(item => item.username !== opp.username);
        }
        else {
            addPlayerToLobby({socketId:socket.id, username: obj.username, variant: obj.variant, rating: obj.rating});
        }
    }); 
};