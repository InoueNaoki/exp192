// phina.js をグローバル領域に展開
phina.globalize();

const socket = io();
let playerId;
socket.on('connect', () => {
    playerId = socket.id;
    console.log(playerId + ' connect');
});

const SCREEN_WIDTH = 1920; // 画面横サイズ
const SCREEN_HEIGHT = 1080; // 画面縦サイズ
const MSG_FRAME_SIZE = 150;
const BACK_GROUND_COLOR = 'white';
const WORD_COLOR = 'black';
const SHAPE_COLOR = 'black';
const FONT_SIZE = 48;
const CELL_NUM_X = 3; // 小部屋（マス目）のX軸方向の数
const CELL_NUM_Y = 3; // 小部屋（マス目）のY軸方向の数
const GRID_SIZE = 200; // グリッドのサイズ
const CELL_SIZE = GRID_SIZE; // パネルの大きさ
const WALL_WIDTH = 10;
const CELL_COLOR = BACK_GROUND_COLOR;
const WALL_COLOR = 'black';

const SHAPE_LIST = [
    { id: 0, shape: 'circle' },
    { id: 1, shape: 'triangle' },
    { id: 2, shape: 'square' },
    { id: 3, shape: 'hexagon' },];
let currentShapeIndex = 0;

phina.define('StartScene', {
    // 継承
    superClass: 'DisplayScene',
    // 初期化
    init: function (option) {
        // 親クラス初期化
        this.superInit(option);
        // 背景色
        this.backgroundColor = BACK_GROUND_COLOR;
        Label({
            text: '指示があるまで始めないでください',
            fontSize: FONT_SIZE,
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(-1));
        const startBtn = Button({
            text: 'START',
            fontSize: FONT_SIZE,
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(1));
        const self = this;
        startBtn.onpointstart = () => {
            self.exit();//to MatchmakingScene
        };
    },
});

phina.define('MatchmakingScene', {
    superClass: 'DisplayScene',
    init: function (option) {
        // 親クラス初期化
        this.superInit(option);
        this.backgroundColor = BACK_GROUND_COLOR;
        const label = Label({
            text: 'マッチング中......\nブラウザを閉じないでください',
            fontSize: FONT_SIZE,
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(-1));
        label.tweener.wait(1000).fadeOut(1000).wait(500).fadeIn(1000).setLoop(true).play();
        const self = this;
        socket.emit('join lobby');
        socket.on('join room', roomId => {
            console.log('join room to ' + roomId);
            self.exit();// to MainScene
        });
    },
});

// MainScene クラスを定義
phina.define('MainScene', {
    superClass: 'DisplayScene',
    init: function (option) {
        this.superInit(option);
        this.backgroundColor = BACK_GROUND_COLOR;// 背景色を指定
        Timer(100, 50).addChildTo(this);
        Submit(200, 100).addChildTo(this);
        MsgFrame(200, 200, true).addChildTo(this);
        MsgFrame(400, 200, false).addChildTo(this);
        Board(500, 500).addChildTo(this); 
    },
});

phina.define('MsgFrame', {
    // Shapeを継承
    superClass: 'Button',
    // コンストラクタ
    init: function (x,y,isSend) {
        // 親クラス初期化
        this.superInit({
            x: x,             // x座標
            y: y,             // y座標
            width: MSG_FRAME_SIZE,
            height: MSG_FRAME_SIZE,
            fill: 'transparent', // 塗りつぶし色
            stroke: 'darkgray',
            text: '',
            cornerRadius: 0,
        });
        SHAPE_LIST.shuffle(); //図形の出現順によるバイアスをなくすためにシャッフル
        if (isSend) {
            this.onpointstart = () => {
                // switch (SHAPE_LIST[currentShapeIndex].shape) {
                this.drawShape(SHAPE_LIST[currentShapeIndex].shape);
                if (SHAPE_LIST[currentShapeIndex] == SHAPE_LIST.last) currentShapeIndex = 0;//最後の図形になったらindexを0に戻して無限ループ
                else currentShapeIndex++;
            };
        } else {
            socket.on('new message', (msg) => {
                this.drawShape(msg);
            });
        }
        
    },
    drawShape: function (shape) {
        if (this.children[0]) this.children[0].remove(); //既に画像があれば削除
        switch (shape) {
            case 'circle':
                CircleShape({
                    radius: MSG_FRAME_SIZE / 2 * 0.8,
                    fill: 'black',
                }).addChildTo(this);
                break;
            case 'triangle':
                TriangleShape({
                    radius: MSG_FRAME_SIZE / 2,
                    fill: 'black',
                    y: MSG_FRAME_SIZE * 0.1,
                }).addChildTo(this);
                break;
            case 'square':
                RectangleShape({
                    width: MSG_FRAME_SIZE * 0.8,
                    height: MSG_FRAME_SIZE * 0.8,
                    fill: 'black',
                }).addChildTo(this);
                break;
            case 'hexagon':
                PolygonShape({
                    radius: MSG_FRAME_SIZE / 2 * 0.9,
                    fill: 'black',
                    sides: 6,
                }).addChildTo(this);
                break;
            case 'diamond':
                PolygonShape({
                    radius: MSG_FRAME_SIZE / 2 * 0.9,
                    fill: 'black',
                    sides: 4,
                }).addChildTo(this);
                break;
            case 'octagon':
                PolygonShape({
                    radius: MSG_FRAME_SIZE / 2 * 0.9,
                    fill: 'black',
                    sides: 8,
                    rotation: 22.5,
                }).addChildTo(this);
                break;
            default:
                console.error('Invaild currentShapeIndex value:' + currentShapeIndex);
                break;
        }
    },
});

phina.define('Submit', {
    superClass: 'Button',
    init: function (x, y) {
        this.superInit({
            x: x,             // x座標
            y: y,             // y座標
            width: 100,         // 横サイズ
            height: 40,        // 縦サイズ
            text: 'send',     // 表示文字
            fontSize: 20,       // 文字サイズ
            // fontColor: WORD_COLOR, // 文字色
        });
    },
    update: function () {
        this.onpointstart = () => {
            // ボタンが押されたときの処理
            this.fill = 'lightgray';
            // this.setInteractive(false);
            let sendShape;
            if (currentShapeIndex == 0) sendShape = SHAPE_LIST.last.shape;//最初の図形のインデックスなら今の図形は最後の図形
            else sendShape = SHAPE_LIST[currentShapeIndex - 1].shape;
            console.log('send:' + sendShape);
            socket.emit('send message', sendShape);
        };
    }
});

phina.define('Timer', {
    superClass: 'Label',
    init: function (x, y) {
        this.superInit({
            x: x,
            y: y,
            text: '',
            fill: WORD_COLOR,
            fontSize: 20,
        });
        this.time = 0;
        // app.elapsedTime = 0;
    },
    update: function (app) {
        this.time += app.deltaTime;
        time = this.time / 1000;
        min = ('00' + Math.floor(time / 60)).slice(-2);
        sec = ('00' + Math.floor(time % 60)).slice(-2);
        this.text = 'time：' + min + ':' + sec; // 経過秒数表示
    },
});

// ゲーム盤クラス
phina.define('Board', {
    superClass:  'DisplayElement',
    init: function (x,y) {
        this.superInit({
            x: x,
            y: y,
        });
        const boardGridX = Grid({
            width: GRID_SIZE * CELL_NUM_X,
            columns: CELL_NUM_X,
            offset: 0,
        });
        const boardGridY = Grid({
            width: GRID_SIZE * CELL_NUM_Y,
            columns: CELL_NUM_Y,
            offset: 0,
        });
        (CELL_NUM_X).times((spanX) => {
            (CELL_NUM_Y).times((spanY) => {
                let isTop, isBottom, isLeft, isRight;
                // X軸方向の通路
                if (spanX == 0) {
                    isLeft = false;
                    isRight = true;
                }else if (spanX == CELL_NUM_X - 1) {
                    isLeft = true;
                    isRight = false;
                }else {
                    isLeft = true;
                    isRight = true;
                }
                // Y軸方向の通路
                if (spanY == 0) {
                    isTop = false;
                    isBottom = true;
                }else if (spanY == CELL_NUM_Y - 1) {
                    isTop = true;
                    isBottom = false;
                }else {
                    isTop = true;
                    isBottom = true;
                }
                const cell = Cell(isTop, isBottom, isLeft, isRight).addChildTo(this);
                cell.setPosition(boardGridX.span(spanX), boardGridY.span(spanY));
                cell.setInteractive(true);
                cell.onpointstart = () => {
                    console.log('clicked(' + spanX + ',' + spanY + ')');
                };
            });
        });
    },
});

// 通路クラス
phina.define('Aisle', {
    superClass: 'RectangleShape',
    init: function (x, y, angle) {
        this.superInit({
            width: WALL_WIDTH + 1,// +1しないとstroke: falseしても謎の枠が出る
            height: CELL_SIZE / 2, //道幅
            fill: CELL_COLOR,
            stroke: false,
            x: x,
            y: y,
            rotation: angle,
        });
    },
});

// 部屋クラス
phina.define('Cell', {
    superClass: 'RectangleShape',
    init: function (isTop, isBottom, isLeft, isRight) {
        this.superInit({
            width: CELL_SIZE,
            height: CELL_SIZE,
            fill: CELL_COLOR,
            stroke: WALL_COLOR,
            strokeWidth: WALL_WIDTH,
        });
        if (isTop) Aisle(0, -CELL_SIZE / 2, 90).addChildTo(this);
        if (isBottom) Aisle(0, +CELL_SIZE / 2, 90).addChildTo(this);
        if (isLeft) Aisle(-CELL_SIZE / 2, 0, 0).addChildTo(this);
        if (isRight) Aisle(+CELL_SIZE / 2, 0, 0).addChildTo(this);
    },
});

// メイン処理
phina.main(()=> {
    // アプリケーション生成
    const app = GameApp({
        startLabel: 'startScene', // メインシーンから開始する
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        // シーンのリストを引数で渡す
        scenes: [
            {
                className: 'StartScene',
                label: 'startScene',
                nextLabel: 'matchmakingScene',
            },
            {
                className: 'MatchmakingScene',
                label: 'matchmakingScene',
                nextLabel: 'mainScene',
            },
            {
                className: 'MainScene',
                label: 'mainScene',
            },
        ],
    });
    // アプリケーション実行
    app.run();
});