phina.globalize();
// 定数
const SCREEN_WIDTH = 500; // 画面横サイズ
const SCREEN_HEIGHT = 500;
const CELL_NUM_XY = 3; // 縦横のパネル数
const GRID_SIZE = 100;
// const GRID_SIZE = (SCREEN_WIDTH - 10) /CELL_NUM_XY; // グリッドのサイズ
// const SCREEN_HEIGHT = GRID_SIZE * 4; // 画面縦サイズ
const CELL_SIZE = GRID_SIZE; // パネルの大きさ
const CELL_OFFSET = (GRID_SIZE + 10) / 2; // オフセット値
// アセット
const ASSETS = {
  // 画像
  image: {
    'player1': 'image/player1.png',
    'player2': 'image/player2.png',
    'reward': 'image/reward.png',

    'center': 'image/center.png',
    'side': 'image/side.png',
    'corner': 'image/corner.png',
  },
};

//変数
let score = 0;

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
    this.backgroundColor = 'silver';

    // グリッド
    let grid = Grid(GRID_SIZE * CELL_NUM_XY, CELL_NUM_XY);
    // グループ
    let cellGroup = DisplayElement().addChildTo(this);

    const rw = Sprite('reward');
    const p2 = Sprite('player2');
    const p1 = Sprite('player1');

    rw.setScale((CELL_SIZE/2)/rw.height).addChildTo(cellGroup);//画像の高さを部屋の1/2に合わせる
    p2.setScale((CELL_SIZE/2)/p2.height).addChildTo(cellGroup);
    p1.setScale((CELL_SIZE / 2) / p1.height).addChildTo(cellGroup);
    
    const self = this;
    const objPlace = self.createObjArr();

    self.setCell(cellGroup, grid, objPlace, self, p1, p2, rw);
    self.movePlayer(p1)

    //経過時間を表示する
    var label = Label({
      text: '',
      fill: 'black',
      fontSize: 20,
      x: this.gridX.span(14),
      y: this.gridY.span(0.5),
    }).addChildTo(this);
    // 更新処理
    this.update = function (app) {
      time = app.elapsedTime / 1000;
      // hour = Math.floor(time / 3600);
      min = ('00' + Math.floor(time / 60)).slice(-2);
      sec = ('00' + Math.floor(time % 60)).slice(-2);
      // 経過秒数表示
      label.text = 'time：' + min + ':' + sec;
    };
  },

  /* 部屋を配置する */
  setCell: function(cellGroup,grid,objPlace,self,p1,p2,rw){
    CELL_NUM_XY.times(function(coordX) {
      CELL_NUM_XY.times(function(coordY) {
        // 部屋作成
        const cell = Sprite('center').addChildTo(cellGroup);
        cell.setScale(CELL_SIZE/cell.height);
        // Gridを利用して配置
        cell.x = grid.span(coordX) + CELL_OFFSET;
        cell.y = grid.span(coordY) + CELL_OFFSET;
        // self.setObj(objPlace,coordX,coordY,cell.x,cell.y,p1,p2,rw)
        switch(objPlace[coordX * CELL_NUM_XY + coordY]){
          case 1:
            p1.setPosition(cell.x,cell.y);
            break;
          case 2:
            p2.setPosition(cell.x,cell.y);
            break;
          case 3:
            rw.setPosition(cell.x,cell.y);
            break;
        }

        // // タッチを有効にする
        // cell.setInteractive(true);
        // // タッチされた時の処理
        // cell.onpointstart = function() {
        //   p1.x = cell.x;
        //   p1.y = cell.y;
        //   if(p1.x == rw.x && p1.y == rw.y){
        //     console.log("報酬取得");
        //     self.setCell(cellGroup,grid,self.createObjArr(),self,p1,p2,rw);
        //     score++;
        //     console.log(score);
        //   }
        // };
      });
    });
  },

  movePlayer: function (p1) {
    // タッチを有効にする
    cell.setInteractive(true);
    // タッチされた時の処理
    cell.onpointstart = function () {
      p1.x = 100;
      p1.y = 200;
    };
  },

  /* 物体（p1,p2,rw）を配置 */
  setObj: function(objPlace,coordX,coordY,x,y,p1,p2,rw){
    switch(objPlace[coordX * CELL_NUM_XY + coordY]){
      case 1:
        p1.setPosition(x,y);
        break;
      case 2:
        p2.setPosition(x,y);
        break;
      case 3:
        rw.setPosition(x,y);
        break;
    }
  },

  /* ランダムな配列を生成 */
  createObjArr: function () {
    // プレイヤーと報酬の位置の配列
    const objPlace = [];
    (CELL_NUM_XY * CELL_NUM_XY).times(function(i) {
      if(i<3){
        objPlace.push(i+1);//1:p1,2:p2,3:p3
      }
      else{
        objPlace.push(0);//残りは0
      }
    });
    objPlace.shuffle();
    return objPlace;
  },

  // // 毎フレーム更新処理
  // update: function() {
  //   // let scoreLabel = Label({
  //   //   text: score + '',
  //   //   fill: 'lime',
  //   //   fontSize: 64,
  //   // }).addChildTo(this);
  //   // scoreLabel.setPosition(500,500);
  // },

});

// // パネルクラス
// phina.define('Panel', {
//   // RectangleShapeを継承
//   superClass: 'RectangleShape',
//     // コンストラクタ
//     init: function() {
//       // 親クラス初期化
//       this.superInit({
//         width: PANEL_SIZE,
//         height: PANEL_SIZE,
//         fill: 'transparent', // 塗りつぶし色
//         stroke: 'black', // 枠の色
//         // cornerRadius: 2, // 角の丸み
//       });
//     },
// });

phina.define('Piece', {
  superClass: CircleShape,
});

// メインシーン
phina.define('MainScene', {
  superClass: 'DisplayScene',
  // コンストラクタ
  init: function () {
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
    PANEL_NUM_XY.times(function (spanX) {
      PANEL_NUM_XY.times(function (spanY) {
        // パネル作成
        var panel = Panel().addChildTo(panelGroup);
        // Gridを利用して配置
        panel.x = grid.span(spanX) + PANEL_OFFSET;
        panel.y = grid.span(spanY) + PANEL_OFFSET;
      });
    });
  },
});
// パネルクラス
phina.define('Panel', {
  // RectangleShapeを継承
  superClass: 'RectangleShape',
  // コンストラクタ
  init: function () {
    // 親クラス初期化
    this.superInit({
      width: PANEL_SIZE,
      height: PANEL_SIZE,
      fill: 'silver', // 塗りつぶし色
      stroke: 'white', // 枠の色
      cornerRadius: 2, // 角の丸み
    });
  },
});

/* メイン */
phina.main(function() {
  const app = GameApp({
    startLabel: 'main', // メイン画面からスタート
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    assets: ASSETS, // アセット読み込み
  });
  app.run();
});

