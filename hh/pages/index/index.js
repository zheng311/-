Page({
  data: {
    playerMode: 'single', // 默认单人模式
  },

  // 切换游戏模式
  switchMode: function(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      playerMode: mode
    });
  },

  // 开始游戏
  startGame: function() {
    wx.navigateTo({
      url: '../game/game?mode=' + this.data.playerMode,
    });
  }
}) 