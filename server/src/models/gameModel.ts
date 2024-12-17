import mongoose from "mongoose";
const gameSchema = new mongoose.Schema({
  game: {
    type: String,
    required: true, // "white" or "black"
  },
  whiteRating: {
    type: Number,
    required: true,
  },
  blackRating: {
    type: Number,
    required: true,
  },
  whiteTimer: {
    type: Number,
    required: true, // Time in seconds
  },
  blackTimer: {
    type: Number,
    required: true, // Time in seconds
  },
  result: {
    type: String,
    required: true, // "white", "black", or "draw"
  },
  mode: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    required: true,
  },
});

const Game = mongoose.model('Game', gameSchema);

export default Game;