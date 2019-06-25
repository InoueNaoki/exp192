phina.globalize();
// 定数
const SCREEN_WIDTH = 800; // 画面横サイズ
const SCREEN_HEIGHT = 600; // 画面縦サイズ
const PANEL_NUM_XY = 9; // 縦横のパネル数
const GRID_SIZE = (SCREEN_WIDTH - 10) / PANEL_NUM_XY; // グリッドのサイズ
const CELL_SIZE = GRID_SIZE * 0.9; // パネルの大きさ
const AISLE_HEIGHT = CELL_SIZE / 8;
const AISLE_WIDTH = CELL_SIZE / 2;
const PANEL_OFFSET = 10; // オフセット値
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
    this.backgroundColor = 'LIGHTGRAY';
    // グリッド
    const grid = Grid(GRID_SIZE * PANEL_NUM_XY, PANEL_NUM_XY);
    // グループ
    const panelGroup = DisplayElement().addChildTo(this);
    // const cell = Cell().addChildTo(panelGroup);
    // cell.x = 100;  
    // cell.y = 100;  
    // const aisle1 = Aisle().addChildTo(cell);
    // aisle1.y = CELL_SIZE / 2 + AISLE_HEIGHT / 2;
    // const aisle2 = Aisle().addChildTo(cell);
    // aisle2.rotation = 90;    
    // aisle2.x = CELL_SIZE / 2 + AISLE_HEIGHT / 2;
    // const center = CenterPanel(panelGroup, 100, 200);
    // console.log(center); 
        const cell = Cell().addChildTo(panelGroup).setPosition(this.gridX.center(), this.gridY.center());
        const aisle = Aisle2().addChildTo(panelGroup).setPosition(this.gridX.center(), this.gridY.center());  
        const aisle2 = Aisle2().addChildTo(panelGroup).setPosition(this.gridX.center(), this.gridY.center());
        aisle2.rotation = 90;
        
    // const wall = Wall();
    // wall.addChildTo(this);
    // PathShape({
    //     stroke: 'BLACK',
    //     strokeWidth: 1,
    //     paths: [
    //         Vector2(200, 0),
    //         Vector2(100, 0),
    //         Vector2(100, 100)
    //     ]
    // }).addChildTo(cell);
    // PathShape({
    //     stroke: 'BLUE',
    //     strokeWidth: 1,
    //     paths: [
    //         Vector2(0, 100),
    //         Vector2(0, 200)
    //     ]
    // }).addChildTo(this);
    // PathShape({
    //     stroke: 'BLACK',
    //     strokeWidth: 1,
    //     paths: [
    //         Vector2(100, 200),
    //         Vector2(100, 300),
    //         Vector2(200, 300)
    //     ]
    // }).addChildTo(this);
    // PathShape({
    //     stroke: 'BLUE',
    //     strokeWidth: 1,
    //     paths: [
    //         Vector2(200, 300),
    //         Vector2(300, 300)
    //     ]
    // }).addChildTo(this);
    // PathShape({
    //     stroke: 'BLACK',
    //     strokeWidth: 1,
    //     paths: [
    //         Vector2(300, 300),
    //         Vector2(400, 300),
    //         Vector2(400, 200)
    //     ]
    // }).addChildTo(this);
    // PathShape({
    //     stroke: 'BLUE',
    //     strokeWidth: 1,
    //     paths: [
    //         Vector2(400, 200),
    //         Vector2(400, 100)
    //     ]
    // }).addChildTo(this);
    // PathShape({
    //     stroke: 'BLACK',
    //     strokeWidth: 1,
    //     paths: [
    //         Vector2(400, 100),
    //         Vector2(400, 0),
    //         Vector2(300, 0)
    //     ]
    // }).addChildTo(this);
    // PathShape({
    //     stroke: 'BLUE',
    //     strokeWidth: 1,
    //     fill: 'pink',
    //     paths: [
    //         Vector2(300, 0),
    //         Vector2(200, 0)
    //     ]
    // }).addChildTo(this);

    // ピース配置
    // PANEL_NUM_XY.times(function(spanX) {
    //   PANEL_NUM_XY.times(function(spanY) {
    //     // パネル作成
    //     const panel = Panel().addChildTo(panelGroup);
    //     // Gridを利用して配置
    //     panel.x = grid.span(spanX) + PANEL_OFFSET;
    //     panel.y = grid.span(spanY) + PANEL_OFFSET;     
    //   });
    // });
  },
});
// 部屋クラス
phina.define('Cell', {
    // RectangleShapeを継承
    superClass: 'RectangleShape',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit({
            width: CELL_SIZE-1,
            height: CELL_SIZE-1,
            fill: 'SKYBLUE', // 塗りつぶし色
            stroke: 'BLACK'
            // cornerRadius: 1, // 角の丸み
        });
    },
});
// 通路クラス
phina.define('Aisle2', {
    // RectangleShapeを継承
    superClass: 'RectangleShape',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit({
            width: CELL_SIZE,
            height: CELL_SIZE/2,
            fill: 'SKYBLUE', // 塗りつぶし色
            stroke: 'SKYBLUE'
        });
    },
});
// 通路クラス
phina.define('Aisle', {
    // RectangleShapeを継承
    superClass: 'RectangleShape',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit({
            width: AISLE_WIDTH,
            height: AISLE_HEIGHT,
            fill: 'SILVER', // 塗りつぶし色
            stroke: false,
            shadow: false,
        });
    },
});
// 通路クラス
phina.define('Wall', {
    superClass: 'PathShape',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit({
            stroke: 'BLACK',
            strokeWidth: 1,
            paths: [
                Vector2(100, 100),
                Vector2(100, 200),
                Vector2(120, 200),
                Vector2(180, 200),
                Vector2(200, 180)
            ]
        });
    },
});
// 通路クラス
phina.define('Wall2', {
    superClass: 'PathShape',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit({
            stroke: 'BLACK',
            strokeWidth: 1,
            paths: [
                Vector2(100, 100),
                Vector2(100, 200),
                Vector2(120, 200),
                Vector2(180, 200),
                Vector2(200, 180)
            ]
        });
    },
});
// 角パネル（部屋+通路）クラス　デフォルトは「
phina.define('CornerPanel', {
    init: function (panelGroup,panelX,panelY) {
        const cell = Cell().addChildTo(panelGroup);
        cell.x = panelX;
        cell.y = panelY;
        const aisle1 = Aisle().addChildTo(cell);
        aisle1.y = CELL_SIZE / 2 + AISLE_HEIGHT / 2;
        const aisle2 = Aisle().addChildTo(cell);
        aisle2.rotation = 90;
        aisle2.x = CELL_SIZE / 2 + AISLE_HEIGHT / 2;
    },
});
// 辺パネル（部屋+通路）クラス　デフォルトはト
phina.define('SidePanel', {
    init: function (panelGroup, panelX, panelY) {
        const cell = Cell().addChildTo(panelGroup);
        cell.x = panelX;
        cell.y = panelY;
        const aisle1 = Aisle().addChildTo(cell);
        aisle1.y = CELL_SIZE / 2 + AISLE_HEIGHT / 2;
        const aisle2 = Aisle().addChildTo(cell);
        aisle2.y = -(CELL_SIZE / 2 + AISLE_HEIGHT / 2);
        const aisle3 = Aisle().addChildTo(cell);
        aisle3.rotation = 90;
        aisle3.x = CELL_SIZE / 2 + AISLE_HEIGHT / 2;
    },
});
// 中央パネル（部屋+通路）クラス　デフォルトは＋
phina.define('CenterPanel', {
    init: function (panelGroup, panelX, panelY) {
        const cell = Cell().addChildTo(panelGroup);
        cell.x = panelX;
        cell.y = panelY;
        const aisle1 = Aisle().addChildTo(cell);
        aisle1.y = CELL_SIZE / 2 + AISLE_HEIGHT / 2;
        const aisle2 = Aisle().addChildTo(cell);
        aisle2.y = -(CELL_SIZE / 2 + AISLE_HEIGHT / 2);
        const aisle3 = Aisle().addChildTo(cell);
        aisle3.rotation = 90;
        aisle3.x = CELL_SIZE / 2 + AISLE_HEIGHT / 2;
        const aisle4 = Aisle().addChildTo(cell);
        aisle4.rotation = 90;
        aisle4.x = -(CELL_SIZE / 2 + AISLE_HEIGHT / 2);
    },
});
// メイン
phina.main(function() {
  const app = GameApp({
    startLabel: 'main', // メイン画面からスタート
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });
  app.run();
});