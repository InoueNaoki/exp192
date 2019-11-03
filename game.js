// phina.js をグローバル領域に展開
phina.globalize();

const socket = io();
let playerId;
socket.on("connect", ()=> {
    playerId = socket.id;
    console.log(playerId + " connect");
});

const SCREEN_WIDTH = 1280; // 画面横サイズ
const SCREEN_HEIGHT = 720; // 画面縦サイズ
const MSG_FRAME_SIZE = 200;
const BACK_GROUND_COLOR = 'white';
const WORD_COLOR = 'black';

// const CIRCLE = 0;
// const TRIANGLE = 1;
// const SQUARE = 2;
// const HEXAGON = 3
// let shapeStatus = CIRCLE;

const shapeArr = ['circle', 'triangle', 'square', 'hexagon'];
let currentShapeIndex = 0;

let label;

// MainScene クラスを定義
phina.define('MainScene', {
    superClass: 'DisplayScene',
    init: function (option) {
        this.superInit(option);
        // 背景色を指定
        this.backgroundColor = BACK_GROUND_COLOR;
        // ラベルを生成
        // this.label = Label('Hello, '+playerId).addChildTo(this);
        // this.label.x = this.gridX.center(); // x 座標
        // this.label.y = this.gridY.center(); // y 座標
        Submit(250, 50).addChildTo(this);
        GraphicalShape(200, 200).addChildTo(this);
        Timer(500, 500).addChildTo(this);
        // MsgTest(500, 550, 'Hello, ' + playerId).addChildTo(this);
        socket.on('chat', (msg) => {
            Label({
                x: 300,
                y: 300,
                text: msg,
                backgroundColor: 'lightgray',
            }).addChildTo(this);
        });
    },
});

phina.define('GraphicalShape', {
    // Shapeを継承
    superClass: 'Button',
    // コンストラクタ
    init: function (x,y) {
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

            // stroke: 'white', // 枠の色
        });
        shapeArr.shuffle(); //図形の出現順によるバイアスをなくすためにシャッフル
    },
    update: function () {
        this.onpointstart = () => {
            if (this.children[0]) this.children[0].remove();
            switch (shapeArr[currentShapeIndex]) {
                case 'circle':
                    CircleShape({
                        radius: MSG_FRAME_SIZE / 2 * 0.8,
                        fill: "black",
                    }).addChildTo(this);
                    break;
                case 'triangle':
                    TriangleShape({
                        radius: MSG_FRAME_SIZE / 2,
                        fill: "black",
                        y: MSG_FRAME_SIZE * 0.1
                    }).addChildTo(this);
                    break;
                case 'square':
                    RectangleShape({
                        width: MSG_FRAME_SIZE * 0.8,
                        height: MSG_FRAME_SIZE * 0.8,
                        fill: "black",
                    }).addChildTo(this);
                    break;
                case 'hexagon':
                    PolygonShape({
                        radius: MSG_FRAME_SIZE / 2 * 0.9,
                        fill: "black",
                        sides: 6,
                    }).addChildTo(this);
                    break;
                default:
                    console.log('Invaild currentShapeIndex value:' + currentShapeIndex);
                    break;
            }
            if (shapeArr[currentShapeIndex] == shapeArr.last) currentShapeIndex = 0;//最後の図形になったらindexを0に戻して無限ループ
            else currentShapeIndex++;

        };
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
            text: "send",     // 表示文字
            fontSize: 20,       // 文字サイズ
            fontColor: WORD_COLOR, // 文字色
            cornerRadius: 2,   // 角丸み
            fill: 'skyblue',    // ボタン色
            stroke: false,     // 枠色
            strokeWidth: 1,     // 枠太さ
        });
    },
    update: function () {
        this.onpointstart = () => {
            // ボタンが押されたときの処理
            this.fill = 'lightgray';
            // this.setInteractive(false);
            let sendShape;
            if (currentShapeIndex == 0) sendShape = shapeArr.last;//最初の図形のインデックスなら今の図形は最後の図形
            else sendShape = shapeArr[currentShapeIndex - 1];
            console.log('send:' + sendShape);
            socket.emit('chat', playerId.slice(0,3) + ':' + sendShape);
            // Label({
            //     x: 300,
            //     y: 300,
            //     text: 'send:' + sendShape,
            // }).addChildTo(this);
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
    },
    update: function (app) {
        time = app.elapsedTime / 1000;
        min = ('00' + Math.floor(time / 60)).slice(-2);
        sec = ('00' + Math.floor(time % 60)).slice(-2);
        this.text = 'time：' + min + ':' + sec; // 経過秒数表示
    },
});

// phina.define('MsgTest', {
//     superClass: 'Label',
//     init: function (x, y,msgShow) {
//         this.superInit({
//             x: x,
//             y: y,
//             text: msgShow,
//             fill: WORD_COLOR,
//             fontSize: 20,
//         });
//     },
//     // update: function (app) {
//     // },
// });

// メイン処理
phina.main(()=> {
    // アプリケーション生成
    const app = GameApp({
        startLabel: 'main', // メインシーンから開始する
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    });
    // アプリケーション実行
    app.run();
});