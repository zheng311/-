Page({
  data: {
    boardSize: 15, // 棋盘大小15x15
    board: [], // 棋盘数据 0:空, 1:黑棋, 2:白棋
    currentPlayer: 1, // 当前玩家 1:黑棋, 2:白棋
    gameOver: false, // 游戏是否结束
    winner: 0, // 赢家 0:无, 1:黑棋, 2:白棋
    mode: 'single', // 游戏模式 single:单人, double:双人
    lastMove: null, // 最后一步棋的位置
    steps: 0, // 步数
  },

  onLoad: function(options) {
    // 从参数中获取游戏模式
    if (options.mode) {
      this.setData({
        mode: options.mode
      });
    }
    this.initBoard();
  },

  // 初始化棋盘
  initBoard: function() {
    const board = [];
    for (let i = 0; i < this.data.boardSize; i++) {
      board[i] = [];
      for (let j = 0; j < this.data.boardSize; j++) {
        board[i][j] = 0;
      }
    }
    this.setData({
      board: board,
      currentPlayer: 1,
      gameOver: false,
      winner: 0,
      lastMove: null,
      steps: 0,
    });
  },

  // 落子
  placeStone: function(e) {
    if (this.data.gameOver) {
      return;
    }

    const row = e.currentTarget.dataset.row;
    const col = e.currentTarget.dataset.col;

    // 如果当前位置已有棋子，不能落子
    if (this.data.board[row][col] !== 0) {
      return;
    }

    // 单人模式且现在是电脑回合，不能落子
    if (this.data.mode === 'single' && this.data.currentPlayer === 2) {
      return;
    }

    // 更新棋盘
    this.makeMove(row, col);

    // 单人模式下，电脑走棋
    if (this.data.mode === 'single' && !this.data.gameOver && this.data.currentPlayer === 2) {
      setTimeout(() => {
        this.computerMove();
      }, 500);
    }
  },

  // 更新棋盘
  makeMove: function(row, col) {
    const board = this.data.board;
    board[row][col] = this.data.currentPlayer;
    
    const lastMove = {row: row, col: col};
    const steps = this.data.steps + 1;
    
    // 检查是否获胜
    if (this.checkWin(row, col, this.data.currentPlayer)) {
      this.setData({
        board: board,
        lastMove: lastMove,
        steps: steps,
        gameOver: true,
        winner: this.data.currentPlayer
      });
      return;
    }
    
    // 切换玩家
    const nextPlayer = this.data.currentPlayer === 1 ? 2 : 1;
    
    this.setData({
      board: board,
      currentPlayer: nextPlayer,
      lastMove: lastMove,
      steps: steps
    });
  },

  // 电脑走棋
  computerMove: function() {
    // 获取所有空位置
    const emptyPositions = [];
    for (let i = 0; i < this.data.boardSize; i++) {
      for (let j = 0; j < this.data.boardSize; j++) {
        if (this.data.board[i][j] === 0) {
          emptyPositions.push({row: i, col: j});
        }
      }
    }
    
    // 如果没有空位置，游戏结束
    if (emptyPositions.length === 0) {
      this.setData({
        gameOver: true
      });
      return;
    }
    
    // 增强AI策略
    // 1. 如果能赢，就赢
    // 2. 如果对手下一步能赢，就阻止
    // 3. 尝试形成活四（两端都开放的四子连珠）
    // 4. 阻止对手形成活三
    // 5. 尝试形成活三
    // 6. 优先选择靠近中心的位置
    // 7. 随机选择一个位置
    
    // 1. 尝试查找是否有可以赢的位置
    for (let pos of emptyPositions) {
      const board = JSON.parse(JSON.stringify(this.data.board));
      board[pos.row][pos.col] = 2; // 假设白棋在此处落子
      if (this.checkWin(pos.row, pos.col, 2, board)) {
        this.makeMove(pos.row, pos.col);
        return;
      }
    }
    
    // 2. 尝试查找是否有需要阻止对手赢的位置
    for (let pos of emptyPositions) {
      const board = JSON.parse(JSON.stringify(this.data.board));
      board[pos.row][pos.col] = 1; // 假设黑棋在此处落子
      if (this.checkWin(pos.row, pos.col, 1, board)) {
        this.makeMove(pos.row, pos.col);
        return;
      }
    }
    
    // 3 & 4. 评估每个位置的分数
    let bestScore = -Infinity;
    let bestPositions = [];
    
    for (let pos of emptyPositions) {
      // 计算这个位置的分数
      const score = this.evaluatePosition(pos.row, pos.col);
      
      if (score > bestScore) {
        bestScore = score;
        bestPositions = [pos];
      } else if (score === bestScore) {
        bestPositions.push(pos);
      }
    }
    
    // 从最佳位置中随机选择一个
    if (bestPositions.length > 0) {
      const randomIndex = Math.floor(Math.random() * bestPositions.length);
      const position = bestPositions[randomIndex];
      this.makeMove(position.row, position.col);
      return;
    }
    
    // 如果没有找到好的位置，随机选择一个位置
    const randomIndex = Math.floor(Math.random() * emptyPositions.length);
    const position = emptyPositions[randomIndex];
    this.makeMove(position.row, position.col);
  },

  // 评估位置分数
  evaluatePosition: function(row, col) {
    // 初始分数
    let score = 0;
    
    // 中心位置加分
    const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
    score += (10 - centerDistance) * 2; // 越靠近中心分数越高
    
    // 连珠评估方向
    const directions = [
      [0, 1],  // 水平
      [1, 0],  // 垂直
      [1, 1],  // 右下对角线
      [1, -1]  // 左下对角线
    ];
    
    // 测试落子在此处
    const boardCopy = JSON.parse(JSON.stringify(this.data.board));
    
    // 评估电脑方(白棋)落子此处的进攻价值
    boardCopy[row][col] = 2;
    let attackScore = this.evaluateConnections(row, col, 2, boardCopy, directions);
    
    // 评估玩家方(黑棋)落子此处的防御价值（阻止对手）
    boardCopy[row][col] = 1;
    let defenseScore = this.evaluateConnections(row, col, 1, boardCopy, directions);
    
    // 进攻略重于防守
    score += attackScore * 1.1 + defenseScore;
    
    return score;
  },
  
  // 评估四个方向上的连珠情况
  evaluateConnections: function(row, col, player, board, directions) {
    let totalScore = 0;
    
    for (let direction of directions) {
      totalScore += this.evaluateDirection(row, col, player, board, direction);
    }
    
    return totalScore;
  },
  
  // 评估某个方向上的连珠情况
  evaluateDirection: function(row, col, player, board, direction) {
    const boardSize = this.data.boardSize;
    const [dx, dy] = direction;
    let count = 1;  // 包括当前位置
    let openEnds = 0;  // 开放端数量
    
    // 向一个方向计数
    let r = row + dx;
    let c = col + dy;
    while (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === player) {
      count++;
      r += dx;
      c += dy;
    }
    // 检查这个方向是否开放
    if (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === 0) {
      openEnds++;
    }
    
    // 向相反方向计数
    r = row - dx;
    c = col - dy;
    while (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === player) {
      count++;
      r -= dx;
      c -= dy;
    }
    // 检查这个方向是否开放
    if (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === 0) {
      openEnds++;
    }
    
    // 根据连珠数和开放端评分
    if (count >= 5) return 100000;  // 五连珠，必胜
    
    if (count === 4) {
      if (openEnds === 2) return 10000;  // 活四，高优先级
      if (openEnds === 1) return 1000;   // 冲四，次优先级
    }
    
    if (count === 3) {
      if (openEnds === 2) return 500;    // 活三，较高优先级
      if (openEnds === 1) return 100;    // 冲三，中等优先级
    }
    
    if (count === 2) {
      if (openEnds === 2) return 50;     // 活二，较低优先级
      if (openEnds === 1) return 10;     // 冲二，低优先级
    }
    
    return 0;  // 其他情况
  },

  // 检查是否获胜
  checkWin: function(row, col, player, board) {
    board = board || this.data.board;
    
    // 检查横向
    let count = 0;
    for (let i = 0; i < this.data.boardSize; i++) {
      if (board[row][i] === player) {
        count++;
        if (count >= 5) return true;
      } else {
        count = 0;
      }
    }
    
    // 检查纵向
    count = 0;
    for (let i = 0; i < this.data.boardSize; i++) {
      if (board[i][col] === player) {
        count++;
        if (count >= 5) return true;
      } else {
        count = 0;
      }
    }
    
    // 检查正对角线
    count = 0;
    let startRow = row - Math.min(row, col);
    let startCol = col - Math.min(row, col);
    while (startRow < this.data.boardSize && startCol < this.data.boardSize) {
      if (board[startRow][startCol] === player) {
        count++;
        if (count >= 5) return true;
      } else {
        count = 0;
      }
      startRow++;
      startCol++;
    }
    
    // 检查反对角线
    count = 0;
    startRow = row + Math.min(this.data.boardSize - 1 - row, col);
    startCol = col - Math.min(this.data.boardSize - 1 - row, col);
    while (startRow >= 0 && startCol < this.data.boardSize) {
      if (board[startRow][startCol] === player) {
        count++;
        if (count >= 5) return true;
      } else {
        count = 0;
      }
      startRow--;
      startCol++;
    }
    
    return false;
  },

  // 重新开始游戏
  restartGame: function() {
    this.initBoard();
  },

  // 返回主页
  backToHome: function() {
    wx.navigateBack({
      delta: 1
    });
  }
}) 