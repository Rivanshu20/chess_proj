import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: { // Removed hashing logic
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
  games: {
    type: Number,
    default: 0,
  },
  wins: {
    type: Number,
    default: 0,
  },
});

const User = mongoose.model('User', userSchema);

export default User;