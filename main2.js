phina.globalize();
// 定数
var SCREEN_WIDTH = 640; // 画面横サイズ
var PANEL_NUM_XY = 9; // 縦横のパネル数
var GRID_SIZE = (SCREEN_WIDTH - 10) / PANEL_NUM_XY; // グリッドのサイズ
var SCREEN_HEIGHT = GRID_SIZE * 11; // 画面縦サイズ
var CELL_SIZE = GRID_SIZE * 0.9; // パネルの大きさ
var PANEL_OFFSET = (GRID_SIZE + 10) / 2; // オフセット値
// メインシーン
phina.define('MainScene', {
  superClass: 'DisplayScene',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    });
    // 背景色
    this.backgroundColor = 'gray';
    // グリッド
    var grid = Grid(GRID_SIZE * PANEL_NUM_XY, PANEL_NUM_XY);
    // グループ
    var panelGroup = DisplayElement().addChildTo(this);
    // ピース配置
    PANEL_NUM_XY.times(function(spanX) {
      PANEL_NUM_XY.times(function(spanY) {
        // パネル作成
        var panel = Panel3().addChildTo(panelGroup);
        // Gridを利用して配置
        panel.x = grid.span(spanX) + PANEL_OFFSET;
        panel.y = grid.span(spanY) + PANEL_OFFSET;
        
        var panel4 = Panel4().addChildTo(panel);
        panel4.y = 12.5;
          
      });
    });
  },
});
// パネルクラス
phina.define('Panel', {
  // RectangleShapeを継承
  superClass: 'RectangleShape',
    // コンストラクタ
    init: function() {
      // 親クラス初期化
      this.superInit({
        width: CELL_SIZE,
        height: CELL_SIZE,
        fill: 'silver', // 塗りつぶし色
        cornerRadius: 2, // 角の丸み
      });
    },
});

// パネルクラス
phina.define('Panel2', {
    // RectangleShapeを継承
    superClass: 'PathShape',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit({
            stroke: 'white',
            strokeWidth: 16,
            paths: [
                Vector2(100, 100),
                Vector2(100, 200)]
        });
    },
});
// パネルクラス
phina.define('Panel3', {
    // RectangleShapeを継承
    superClass: 'RectangleShape',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit({
            width: 20,
            height: 20,
            fill: 'silver', // 塗りつぶし色
            stroke: false,
            // cornerRadius: 2, // 角の丸み
        });
    },
});

// パネルクラス
phina.define('Panel4', {
    // RectangleShapeを継承
    superClass: 'RectangleShape',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit({
            width: 10,
            height: 5,
            fill: 'blue', // 塗りつぶし色
            stroke: false,
            // cornerRadius: 2, // 角の丸み
        });
    },
});

// phina.define('MainScene', {
//     superClass: 'DisplayScene',

//     init: function () {
//         this.superInit();

//         var shape = phina.display.PathShape({
//             stroke: 'red',
//             fill: 'blue',
//             strokeWidth: 16,
//         }).addChildTo(this);
//         shape
//             .addPath(-100, -100)
//             .addPath(100, 200)
//             .addPath(100, -50)
//             .addPath(-200, 100)
//             .addPath(-100, -100);

//         shape.setPosition(this.gridX.center(), this.gridY.center());
//     },
// });
// メイン
phina.main(function() {
  var app = GameApp({
    startLabel: 'main', // メイン画面からスタート
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });
  app.run();
});