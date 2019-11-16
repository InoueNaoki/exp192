//モバイルからアクセスがあった場合アクセス拒否
if (UAParser().device.type === 'mobile') {
    alert('PCからアクセスしてください');
    location.replace('http://Google.com');//戻るURL指定
}

// Chrome以外から閲覧されている場合アクセス拒否
if (UAParser().browser.name !== 'Chrome') {
    alert('ブラウザをChromeに変更してください');
    location.replace('http://Google.com');//戻るURL指定
}

// window.onbeforeunload = (e) => {
//     e.preventDefault();// Cancel the event as stated by the standard.
//     e.returnValue = '';// Chrome requires returnValue to be set.
// }

// phina.js をグローバル領域に展開
phina.globalize();

const socket = io();
let playerId;
socket.on('connect', () => {
    playerId = socket.id;
    console.log('You are '+playerId);
});

// let conf;
socket.on('initial setting', (initSetting) => {
    const conf = initSetting;
    let currentShapeIndex = 0;
    // const initialPosition = [].range(conf.CELL_NUM_X * conf.CELL_NUM_Y).shuffle().slice(-3); //0=player1,1=player2,3=reward
    const shapeList = conf.SHAPE_LIST.shuffle(); //図形の出現順によるバイアスをなくすためにシャッフル

    phina.define('StartScene', {
        // 継承
        superClass: 'DisplayScene',
        // 初期化
        init: function (option) {
            // 親クラス初期化
            this.superInit(option);
            // 背景色
            this.backgroundColor = conf.BACKGROUND_COLOR;
            Label({
                text: '指示があるまで始めないでください',
                fontSize: conf.FONT_SIZE,
            }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(-1));
            const startBtn = Button({
                text: 'START',
                fontSize: conf.FONT_SIZE,
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
            this.backgroundColor = conf.BACKGROUND_COLOR;
            const label = Label({
                text: 'マッチング中......\nブラウザを閉じないでください',
                fontSize: conf.FONT_SIZE,
            }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(-1));
            // label.tweener.wait(1000).fadeOut(1000).wait(500).fadeIn(1000).setLoop(true).play(); //呼吸アニメーション
            const loading = Loading(8).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(+1));
            const self = this;
            socket.emit('join lobby');
            socket.on('complete matchmake', async (pairId, initPosi) => {
                console.log(pairId + 'のマッチングが完了');
                label.text = conf.COMPLETE_MATCHMAKE_MSG;
                label.fill = 'seagreen';
                loading.remove();
                await wait(1);
                console.log({ initPosi: initPosi });
                self.exit({ initPosi: initPosi, });// to MainScene
            });
        },
    });

    // MainScene クラスを定義
    phina.define('MainScene', {
        superClass: 'DisplayScene',
        init: function (option) {
            this.superInit(option);
            this.backgroundColor = conf.BACKGROUND_COLOR;// 背景色を指定
            Timer().addChildTo(this).setPosition(150, 50);
            Submit().addChildTo(this).setPosition(200,100);
            MsgFrame(true).addChildTo(this).setPosition(200, 200);
            MsgFrame(false).addChildTo(this).setPosition(400, 200);
            Board(option.initPosi).addChildTo(this).setPosition(500, 500);
        },
    });

    phina.define('Loading', {
        superClass: 'DisplayElement',
        init: function (circleNum) {
            this.superInit();
            const firstDeg = 360 / circleNum;
            const self = this;
            Array.range(0, 360, firstDeg).each((deg) => {
                const rad = Math.degToRad(deg); // 度をラジアンに変換
                const circle = CircleShape({ radius: conf.FONT_SIZE / 5, fill: conf.FONT_COLOR, }).addChildTo(self);
                circle.alpha = (deg + firstDeg) / 360;
                // 円周上に配置
                circle.x = Math.cos(rad) * 40;
                circle.y = Math.sin(rad) * 40;
            });
        },
        update: function () {
            this.rotation += 8;
        },
    });

    phina.define('MsgFrame', {
        // Shapeを継承
        superClass: 'Button',
        // コンストラクタ
        init: function (isSelfMsg) {
            // 親クラス初期化
            this.superInit({
                width: conf.MSG_FRAME_SIZE,
                height: conf.MSG_FRAME_SIZE,
                fill: 'transparent', // 塗りつぶし色
                stroke: 'darkgray',
                text: '',
                cornerRadius: 0,
            });
            if (isSelfMsg) {
                this.onpointstart = () => {
                    // switch (shapeList[currentShapeIndex].shape) {
                    this.drawShape(shapeList[currentShapeIndex].shape);
                    if (shapeList[currentShapeIndex] == shapeList.last) currentShapeIndex = 0;//最後の図形になったらindexを0に戻して無限ループ
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
                        radius: conf.MSG_FRAME_SIZE / 2 * 0.8,
                        fill: conf.SHAPE_COLOR,
                    }).addChildTo(this);
                    break;
                case 'triangle':
                    TriangleShape({
                        radius: conf.MSG_FRAME_SIZE / 2,
                        fill: conf.SHAPE_COLOR,
                        y: conf.MSG_FRAME_SIZE * 0.1,
                    }).addChildTo(this);
                    break;
                case 'square':
                    RectangleShape({
                        width: conf.MSG_FRAME_SIZE * 0.8,
                        height: conf.MSG_FRAME_SIZE * 0.8,
                        fill: conf.SHAPE_COLOR,
                    }).addChildTo(this);
                    break;
                case 'hexagon':
                    PolygonShape({
                        radius: conf.MSG_FRAME_SIZE / 2 * 0.9,
                        fill: conf.SHAPE_COLOR,
                        sides: 6,
                    }).addChildTo(this);
                    break;
                case 'diamond':
                    PolygonShape({
                        radius: conf.MSG_FRAME_SIZE / 2 * 0.9,
                        fill: conf.SHAPE_COLOR,
                        sides: 4,
                    }).addChildTo(this);
                    break;
                case 'octagon':
                    PolygonShape({
                        radius: conf.MSG_FRAME_SIZE / 2 * 0.9,
                        fill: conf.SHAPE_COLOR,
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
        init: function () {
            this.superInit({
                text: 'SEND',     // 表示文字
                fontSize: conf.FONT_SIZE,       // 文字サイズ
                // fontColor: WORD_COLOR, // 文字色
            });
        },
        update: function () {
            this.onpointstart = () => {
                // ボタンが押されたときの処理
                this.fill = 'lightgray';
                // this.setInteractive(false);
                const sendShape = (currentShapeIndex == 0) ? shapeList.last.shape : shapeList[currentShapeIndex - 1].shape//最初の図形のインデックスなら今の図形は最後の図形
                console.log('send:' + sendShape);
                socket.emit('send message', sendShape);
            };
        }
    });

    phina.define('Timer', {
        superClass: 'Label',
        init: function () {
            this.superInit({
                text: '',
                fill: conf.FONT_COLOR,
                fontSize: conf.FONT_SIZE,
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

    phina.define('Player', {
        superClass: 'CircleShape',
        init: function (isSelf) {
            const playerColor = isSelf ? 'skyblue' : 'orange';
            this.superInit({
                radius: conf.CELL_SIZE / 2 * 0.5,
                fill: playerColor,
                strokeWidth: false,
            });
        },
    });

    // ゲーム盤クラス
    phina.define('Board', {
        superClass: 'DisplayElement',
        init: function (initPosi) {
            this.superInit();
            const boardGridX = Grid({
                width: conf.GRID_SIZE * conf.CELL_NUM_X,
                columns: conf.CELL_NUM_X,
                offset: 0,
            });
            const boardGridY = Grid({
                width: conf.GRID_SIZE * conf.CELL_NUM_Y,
                columns: conf.CELL_NUM_Y,
                offset: 0,
            });
            (conf.CELL_NUM_X).times((spanX) => {
                (conf.CELL_NUM_Y).times((spanY) => {
                    let isTop, isBottom, isLeft, isRight;
                    // X軸方向の通路
                    if (spanX == 0) {
                        isLeft = false;
                        isRight = true;
                    } else if (spanX == conf.CELL_NUM_X - 1) {
                        isLeft = true;
                        isRight = false;
                    } else {
                        isLeft = true;
                        isRight = true;
                    }
                    // Y軸方向の通路
                    if (spanY == 0) {
                        isTop = false;
                        isBottom = true;
                    } else if (spanY == conf.CELL_NUM_Y - 1) {
                        isTop = true;
                        isBottom = false;
                    } else {
                        isTop = true;
                        isBottom = true;
                    }
                    const cell = Cell(isTop, isBottom, isLeft, isRight).addChildTo(this).setPosition(boardGridX.span(spanX), boardGridY.span(spanY));
                    cell.setInteractive(true);
                    cell.onpointstart = () => {
                        console.log('clicked(' + spanX +',' +spanY+')'+this);
                    };
                    const coord = convertFrom2dTo1d(spanX, spanY);
                    const self = this;
                    switch (coord) {
                        case initPosi[0]:
                            StarShape({ radius: conf.CELL_SIZE * 0.4, stroke: false, fill:'gold'}).addChildTo(self).setPosition(boardGridX.span(spanX), boardGridY.span(spanY));
                            break;
                        case initPosi[1]:
                            Player(true).addChildTo(self).setPosition(boardGridX.span(spanX), boardGridY.span(spanY));
                            break;
                        case initPosi[2]:
                            Player(false).addChildTo(self).setPosition(boardGridX.span(spanX), boardGridY.span(spanY));
                            break;
                        default :
                            break;
                    }
                    // cell.fill = 'linen';
                });
            });
        },
    });

    // 通路クラス
    phina.define('Aisle', {
        superClass: 'RectangleShape',
        init: function (angle) {
            this.superInit({
                width: conf.WALL_WIDTH,// +1しないとstroke: falseしても謎の枠が出る
                height: conf.CELL_SIZE / 2, //道幅
                fill: conf.CELL_COLOR,
                stroke: false,
                rotation: angle,
            });
        },
    });

    // 部屋クラス
    phina.define('Cell', {
        superClass: 'RectangleShape',
        init: function (isTop, isBottom, isLeft, isRight) {
            this.superInit({
                width: conf.CELL_SIZE,
                height: conf.CELL_SIZE,
                fill: conf.CELL_COLOR,
                stroke: conf.WALL_COLOR,
                strokeWidth: conf.WALL_WIDTH,
            });
            if (isTop) Aisle(90).addChildTo(this).setPosition(0, -conf.CELL_SIZE / 2);
            if (isBottom) Aisle(90).addChildTo(this).setPosition(0, conf.CELL_SIZE / 2);
            if (isLeft) Aisle(0).addChildTo(this).setPosition(-conf.CELL_SIZE / 2, 0);
            if (isRight) Aisle(0).addChildTo(this).setPosition(conf.CELL_SIZE / 2, 0);
        },
    });

    // メイン処理
    phina.main(() => {
        // アプリケーション生成
        const app = GameApp({
            startLabel: 'startScene', // メインシーンから開始する
            width: conf.SCREEN_WIDTH,
            height: conf.SCREEN_HEIGHT,
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
    function wait(sec) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, sec * 1000);
            //setTimeout(() => {reject(new Error("エラー！"))}, sec*1000);
        });
    };

    function convertFrom2dTo1d(x, y) {
        return conf.CELL_NUM_Y * y + x // ex.(0,0)–(2,2)→0–9
    }
});
// const SCREEN_WIDTH = 1920; // 画面横サイズ
// const SCREEN_HEIGHT = 1080; // 画面縦サイズ
// const MSG_FRAME_SIZE = 150;
// const BACKGROUND_COLOR = 'white';
// const FONT_COLOR = 'black';
// const SHAPE_COLOR = 'black';
// const FONT_SIZE = 48;
// const CELL_NUM_X = 3; // 小部屋（マス目）のX軸方向の数
// const CELL_NUM_Y = 3; // 小部屋（マス目）のY軸方向の数
// const GRID_SIZE = 200; // グリッドのサイズ
// const CELL_SIZE = conf.GRID_SIZE; // パネルの大きさ
// const WALL_WIDTH = 10;
// const CELL_COLOR = BACKGROUND_COLOR;
// const zWALL_COLOR = 'black';