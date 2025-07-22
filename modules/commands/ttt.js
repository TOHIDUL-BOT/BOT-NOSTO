
module.exports.config = {
  name: "ttt",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "TOHI-BOT-HUB",
  description: "🎮 Play Tic Tac Toe with AI - Enhanced version with better graphics",
  usePrefix: true,
  commandCategory: "game",
  cooldowns: 3,
  usages: "x/o/delete/continue/help"
};

const fs = require("fs");
const path = require("path");

// Game class for better structure
class TicTacToe {
  constructor(isPlayerX = true) {
    this.board = Array(3).fill().map(() => Array(3).fill(0));
    this.isPlayerX = isPlayerX;
    this.playerSymbol = isPlayerX ? 2 : 1; // Player: 2=X, 1=O
    this.aiSymbol = isPlayerX ? 1 : 2;     // AI: 1=O, 2=X
    this.gameOn = true;
    this.gameOver = false;
    this.moves = 0;
  }

  // Create beautiful board display
  displayBoard() {
    const symbols = {
      0: "⬜", // Empty
      1: "⭕", // O
      2: "❌"  // X
    };
    
    let display = "🎮 **TIC TAC TOE** 🎮\n";
    display += "━━━━━━━━━━━━━━━━━━━\n";
    display += "     1   2   3\n";
    
    for (let i = 0; i < 3; i++) {
      let row = `  ${String.fromCharCode(65 + i)} `;
      for (let j = 0; j < 3; j++) {
        row += ` ${symbols[this.board[i][j]]} `;
        if (j < 2) row += "│";
      }
      display += row + "\n";
      if (i < 2) display += "    ───┼───┼───\n";
    }
    
    display += "\n💡 Reply with position (1-9):\n";
    display += "1│2│3\n─┼─┼─\n4│5│6\n─┼─┼─\n7│8│9\n";
    
    return display;
  }

  // Check if position is valid
  isValidMove(row, col) {
    return row >= 0 && row < 3 && col >= 0 && col < 3 && this.board[row][col] === 0;
  }

  // Make a move
  makeMove(row, col, player) {
    if (this.isValidMove(row, col)) {
      this.board[row][col] = player;
      this.moves++;
      return true;
    }
    return false;
  }

  // Convert position (1-9) to row, col
  positionToCoords(position) {
    const pos = parseInt(position) - 1;
    if (pos < 0 || pos > 8) return null;
    return {
      row: Math.floor(pos / 3),
      col: pos % 3
    };
  }

  // Check for winner
  checkWinner() {
    // Check rows
    for (let i = 0; i < 3; i++) {
      if (this.board[i][0] !== 0 && 
          this.board[i][0] === this.board[i][1] && 
          this.board[i][1] === this.board[i][2]) {
        return this.board[i][0];
      }
    }

    // Check columns
    for (let j = 0; j < 3; j++) {
      if (this.board[0][j] !== 0 && 
          this.board[0][j] === this.board[1][j] && 
          this.board[1][j] === this.board[2][j]) {
        return this.board[0][j];
      }
    }

    // Check diagonals
    if (this.board[0][0] !== 0 && 
        this.board[0][0] === this.board[1][1] && 
        this.board[1][1] === this.board[2][2]) {
      return this.board[0][0];
    }

    if (this.board[0][2] !== 0 && 
        this.board[0][2] === this.board[1][1] && 
        this.board[1][1] === this.board[2][0]) {
      return this.board[0][2];
    }

    return null;
  }

  // Check if game is over
  isGameOver() {
    return this.checkWinner() !== null || this.moves >= 9;
  }

  // Get available moves
  getAvailableMoves() {
    const moves = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (this.board[i][j] === 0) {
          moves.push([i, j]);
        }
      }
    }
    return moves;
  }

  // Minimax AI algorithm
  minimax(depth, isMaximizing, alpha = -Infinity, beta = Infinity) {
    const winner = this.checkWinner();
    
    // Terminal cases
    if (winner === this.aiSymbol) return 10 - depth;
    if (winner === this.playerSymbol) return depth - 10;
    if (this.moves >= 9) return 0;

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (this.board[i][j] === 0) {
            this.board[i][j] = this.aiSymbol;
            this.moves++;
            const score = this.minimax(depth + 1, false, alpha, beta);
            this.board[i][j] = 0;
            this.moves--;
            maxScore = Math.max(score, maxScore);
            alpha = Math.max(alpha, score);
            if (beta <= alpha) break;
          }
        }
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (this.board[i][j] === 0) {
            this.board[i][j] = this.playerSymbol;
            this.moves++;
            const score = this.minimax(depth + 1, true, alpha, beta);
            this.board[i][j] = 0;
            this.moves--;
            minScore = Math.min(score, minScore);
            beta = Math.min(beta, score);
            if (beta <= alpha) break;
          }
        }
      }
      return minScore;
    }
  }

  // Get best AI move
  getBestMove() {
    let bestScore = -Infinity;
    let bestMove = null;

    // First move optimization
    if (this.moves === 0) {
      const corners = [[0,0], [0,2], [2,0], [2,2]];
      return corners[Math.floor(Math.random() * corners.length)];
    }

    // Second move optimization
    if (this.moves === 1) {
      if (this.board[1][1] === 0) return [1, 1]; // Take center
      const corners = [[0,0], [0,2], [2,0], [2,2]];
      return corners[Math.floor(Math.random() * corners.length)];
    }

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (this.board[i][j] === 0) {
          this.board[i][j] = this.aiSymbol;
          this.moves++;
          const score = this.minimax(0, false);
          this.board[i][j] = 0;
          this.moves--;
          
          if (score > bestScore) {
            bestScore = score;
            bestMove = [i, j];
          }
        }
      }
    }
    
    return bestMove;
  }

  // Make AI move
  makeAIMove() {
    const move = this.getBestMove();
    if (move) {
      this.makeMove(move[0], move[1], this.aiSymbol);
      return move;
    }
    return null;
  }

  // Get game result message
  getGameResult() {
    const winner = this.checkWinner();
    const winMessages = [
      "🎉 Congratulations! You won! 🏆",
      "🎊 Amazing! You beat the AI! 🥇",
      "👑 Victory is yours! Well played! 🎯"
    ];
    
    const loseMessages = [
      "🤖 AI wins! Better luck next time! 💪",
      "🎭 The AI got you this time! Try again! 🔄",
      "🧠 AI victory! Don't give up! 🚀"
    ];
    
    if (winner === this.playerSymbol) {
      return winMessages[Math.floor(Math.random() * winMessages.length)];
    } else if (winner === this.aiSymbol) {
      return loseMessages[Math.floor(Math.random() * loseMessages.length)];
    } else {
      return "🤝 It's a tie! Great game! 🎲";
    }
  }
}

// Handle replies
module.exports.handleReply = async function({ event, api, handleReply }) {
  const { body, threadID, messageID, senderID } = event;
  
  if (!global.moduleData.tictactoe) global.moduleData.tictactoe = new Map();
  
  const gameData = global.moduleData.tictactoe.get(threadID);
  if (!gameData || !gameData.game || !gameData.game.gameOn) {
    return api.sendMessage("❌ No active game found! Use `/ttt x` or `/ttt o` to start a new game.", threadID, messageID);
  }

  if (gameData.player !== senderID) {
    return api.sendMessage("⚠️ This game belongs to another player!", threadID, messageID);
  }

  const game = gameData.game;
  const position = parseInt(body);

  if (isNaN(position) || position < 1 || position > 9) {
    return api.sendMessage("❌ Invalid input! Please enter a number between 1-9.", threadID, messageID);
  }

  const coords = game.positionToCoords(position);
  if (!coords || !game.isValidMove(coords.row, coords.col)) {
    return api.sendMessage("❌ Invalid move! That position is already taken.", threadID, messageID);
  }

  // Player move
  game.makeMove(coords.row, coords.col, game.playerSymbol);
  
  let gameMessage = "";
  
  // Check if player won
  if (game.isGameOver()) {
    gameMessage = game.getGameResult();
    global.moduleData.tictactoe.delete(threadID);
  } else {
    // AI move
    const aiMove = game.makeAIMove();
    if (aiMove) {
      if (game.isGameOver()) {
        gameMessage = game.getGameResult();
        global.moduleData.tictactoe.delete(threadID);
      } else {
        gameMessage = "🤖 AI made its move! Your turn:";
      }
    }
  }

  const boardDisplay = game.displayBoard();
  const fullMessage = `${boardDisplay}\n${gameMessage}`;

  if (game.gameOn && !game.isGameOver()) {
    api.sendMessage(fullMessage, threadID, (error, info) => {
      if (!error) {
        global.client.handleReply.push({
          name: this.config.name,
          author: senderID,
          messageID: info.messageID
        });
      }
    }, messageID);
  } else {
    api.sendMessage(fullMessage, threadID, messageID);
  }
};

// Main command function
module.exports.run = async function({ event, api, args }) {
  const { threadID, messageID, senderID } = event;
  const threadSetting = global.data.threadData.get(threadID) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;
  
  if (!global.moduleData.tictactoe) global.moduleData.tictactoe = new Map();
  
  const gameData = global.moduleData.tictactoe.get(threadID);
  
  // Help command
  if (args[0] === "help" || args.length === 0) {
    const helpMessage = `🎮 **TIC TAC TOE GAME** 🎮
━━━━━━━━━━━━━━━━━━━━━━━
**Commands:**
• \`${prefix}ttt x\` - Start game as X (you go first)
• \`${prefix}ttt o\` - Start game as O (AI goes first)
• \`${prefix}ttt continue\` - Continue current game
• \`${prefix}ttt delete\` - Delete current game
• \`${prefix}ttt help\` - Show this help

**How to play:**
1. Choose X or O to start
2. Reply with numbers 1-9 to make moves
3. Try to get 3 in a row to win!

**Board positions:**
1│2│3
─┼─┼─
4│5│6
─┼─┼─
7│8│9

Good luck! 🍀`;
    
    return api.sendMessage(helpMessage, threadID, messageID);
  }

  // Delete game
  if (args[0] === "delete") {
    if (gameData) {
      global.moduleData.tictactoe.delete(threadID);
      return api.sendMessage("🗑️ Game deleted successfully!", threadID, messageID);
    } else {
      return api.sendMessage("❌ No active game to delete!", threadID, messageID);
    }
  }

  // Continue game
  if (args[0] === "continue") {
    if (!gameData || !gameData.game || !gameData.game.gameOn) {
      return api.sendMessage(`❌ No active game found! Use \`${prefix}ttt x\` or \`${prefix}ttt o\` to start a new game.`, threadID, messageID);
    }

    if (gameData.player !== senderID) {
      return api.sendMessage("⚠️ This game belongs to another player!", threadID, messageID);
    }

    const boardDisplay = gameData.game.displayBoard();
    const message = `${boardDisplay}\n🎮 Game resumed! Your turn:`;
    
    return api.sendMessage(message, threadID, (error, info) => {
      if (!error) {
        global.client.handleReply.push({
          name: this.config.name,
          author: senderID,
          messageID: info.messageID
        });
      }
    }, messageID);
  }

  // Start new game
  if (args[0] === "x" || args[0] === "o") {
    if (gameData && gameData.game && gameData.game.gameOn) {
      return api.sendMessage(`⚠️ A game is already active in this group!\nUse:\n• \`${prefix}ttt continue\` - to continue\n• \`${prefix}ttt delete\` - to delete and start new`, threadID, messageID);
    }

    const isPlayerX = args[0] === "x";
    const game = new TicTacToe(isPlayerX);
    
    // Store game data
    global.moduleData.tictactoe.set(threadID, {
      game: game,
      player: senderID
    });

    let message = "";
    
    if (isPlayerX) {
      // Player goes first as X
      message = `${game.displayBoard()}\n🎮 You are X! Make your first move:`;
      
      api.sendMessage(message, threadID, (error, info) => {
        if (!error) {
          global.client.handleReply.push({
            name: this.config.name,
            author: senderID,
            messageID: info.messageID
          });
        }
      }, messageID);
    } else {
      // AI goes first as X
      game.makeAIMove(); // AI makes first move
      message = `${game.displayBoard()}\n🤖 You are O! AI made the first move. Your turn:`;
      
      api.sendMessage(message, threadID, (error, info) => {
        if (!error) {
          global.client.handleReply.push({
            name: this.config.name,
            author: senderID,
            messageID: info.messageID
          });
        }
      }, messageID);
    }
  } else {
    // Invalid argument
    api.sendMessage(`❌ Invalid command! Use \`${prefix}ttt help\` for instructions.`, threadID, messageID);
  }
};
