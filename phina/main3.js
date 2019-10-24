phina.globalize();
// 定数
const SCREEN_WIDTH = 720; // 画面横サイズ
const SCREEN_HEIGHT = 540; // 画面縦サイズ
const CELL_NUM_X = 3; // 小部屋（マス目）のX軸方向の数
const CELL_NUM_Y = 3; // 小部屋（マス目）のY軸方向の数
const GRID_SIZE = 100; // グリッドのサイズ
const CELL_SIZE = GRID_SIZE; // パネルの大きさ
const WALL_WIDTH = 5;

const BACK_GROUND_COLOR = 'linen';
const CELL_COLOR = BACK_GROUND_COLOR;
const WALL_COLOR = 'BLACK';

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
        this.backgroundColor = BACK_GROUND_COLOR;

        const board = DisplayElement().addChildTo(this); // boardにcellを配置していく感じ
        const boardGridX = Grid({
            width: GRID_SIZE * CELL_NUM_X,
            columns: CELL_NUM_X,
            offset: 100
        });
        const boardGridY = Grid({
            width: GRID_SIZE * CELL_NUM_Y,
            columns: CELL_NUM_Y,
            offset: 100
        });
        (CELL_NUM_X).times((spanX) => {
            (CELL_NUM_Y).times((spanY) => {
                let isTop, isBottom, isLeft, isRight;
                // X軸方向の通路
                if (spanX == 0) {
                    isLeft = false;
                    isRight = true;
                }
                else if (spanX == CELL_NUM_X - 1) {
                    isLeft = true;
                    isRight = false;
                }
                else {
                    isLeft = true;
                    isRight = true;
                }

                // Y軸方向の通路
                if (spanY == 0) {
                    isTop = false;
                    isBottom = true;
                }
                else if (spanY == CELL_NUM_Y - 1) {
                    isTop = true;
                    isBottom = false;
                }
                else {
                    isTop = true;
                    isBottom = true;
                }

                const cell = Cell(isTop, isBottom, isLeft, isRight).addChildTo(board);
                cell.setPosition(boardGridX.span(spanX), boardGridY.span(spanY));
                cell.setInteractive(true);
            });
        });
        ElapsedTime(boardGridX.span(4), boardGridY.span(0)).addChildTo(this);
        Score(boardGridX.span(4), boardGridY.span(1)).addChildTo(this);
        Submit(boardGridX.span(5), boardGridY.span(3.5)).addChildTo(this);
    },
});
phina.define('Submit', {
    superClass: 'Button',
    init: function (x,y) {
        this.superInit({
            x: x,             // x座標
            y: y,             // y座標
            width: 100,         // 横サイズ
            height: 40,        // 縦サイズ
            text: "送信",     // 表示文字
            fontSize: 20,       // 文字サイズ
            fontColor: 'WHITE', // 文字色
            cornerRadius: 2,   // 角丸み
            fill: 'skyblue',    // ボタン色
            stroke: false,     // 枠色
            strokeWidth: 1,     // 枠太さ
        });
    },
    update: function () {
       this.onpointend = ()=> {
            // ボタンが押されたときの処理
            console.log('button');
           this.fill = 'lightgray';
           this.setInteractive(false);
        }; 
    }
});
phina.define('ElapsedTime', {
    superClass: 'Label',
    init: function (x,y) {
        this.superInit({
            text: '',
            fill: 'black',
            fontSize: 20,
            x: x,
            y: y,
        });   
    },
    update: function (app) {
        time = app.elapsedTime / 1000;
        min = ('00' + Math.floor(time / 60)).slice(-2);
        sec = ('00' + Math.floor(time % 60)).slice(-2);
        this.text = 'time：' + min + ':' + sec; // 経過秒数表示
    },
});
phina.define('Score', {
    superClass: 'Label',
    init: function (x, y) {
        this.superInit({
            text: '',
            fill: 'black',
            fontSize: 20,
            x: x,
            y: y,
        });
    },
    update: function () {
        this.text = 'score : '+ 999;
    },
});
// 通路クラス
phina.define('Aisle', {
    // RectangleShapeを継承
    superClass: 'RectangleShape',
    // コンストラクタ
    init: function (aisleX, aisleY, aisleAngle) {
        // 親クラス初期化
        this.superInit({
            width: WALL_WIDTH + 1,// +1しないと謎の枠が出る
            height: CELL_SIZE / 2,
            fill: CELL_COLOR,
            stroke: false,
            x: aisleX,
            y: aisleY,
            rotation: aisleAngle,
        });
    },
});
// 部屋クラス
phina.define('Cell', {
    // Shapeを継承
    superClass: 'RectangleShape',
    // コンストラクタ
    init: function (isTop, isBottom, isLeft, isRight) {
        // 親クラス初期化
        this.superInit({
            width: CELL_SIZE,
            height: CELL_SIZE,
            fill: CELL_COLOR,
            stroke: WALL_COLOR,
            strokeWidth: WALL_WIDTH,
        });
        if (isTop) {
            Aisle(0, -CELL_SIZE / 2,90).addChildTo(this);
        }
        if (isBottom) {
            Aisle(0, +CELL_SIZE / 2,90).addChildTo(this);
        }
        if (isLeft) {
            Aisle(-CELL_SIZE / 2, 0, 0).addChildTo(this);
        }
        if (isRight) {
            Aisle(+CELL_SIZE / 2, 0, 0).addChildTo(this);
        }
    },
    update: function () {
        this.onpointstart = () => {
            console.log('クリック(' + this.x + ',' + this.y + ')');
        };
    },
});

// メインクラス
phina.main(() => {
  const app = GameApp({
    startLabel: 'main', // メイン画面からスタート
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });
  app.run();
});