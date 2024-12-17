class Game {
    intervals: {};
    games: {};
    bots: any[];
    botsName: any[];
    lobby:any[];
    friendQueue:{};
    constructor() {
      this.intervals = {}; // Object to store game intervals
      this.games = {}; // Object to store game data (keyed by game ID
      this.lobby = []; // Object to store game data (keyed by game ID
      this.botsName = ['bot1', 'bot2'];
      this.bots = [
        {
          username: "bot1"
        },
        {
          username: "bot2"
        }
      ]; // Object to store game data (keyed by game ID
      this.friendQueue = {};
    }
  }
const game = new Game()  
export default game;  
  