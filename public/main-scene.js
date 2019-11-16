export default function () {
    // MainScene クラスを定義
    phina.define('MainScene', {
        superClass: 'DisplayScene',
        init: function (option) {
            this.superInit(option);
            this.backgroundColor = conf.BACKGROUND_COLOR;// 背景色を指定
            Timer().addChildTo(this).setPosition(150, 50);
            Submit().addChildTo(this).setPosition(200, 100);
            MsgFrame(true).addChildTo(this).setPosition(200, 200);
            MsgFrame(false).addChildTo(this).setPosition(400, 200);
            Board(option.initPosi).addChildTo(this).setPosition(500, 500);
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
                        console.log('clicked(' + spanX + ',' + spanY + ')' + this);
                    };
                    const coord = convertFrom2dTo1d(spanX, spanY);
                    const self = this;
                    switch (coord) {
                        case initPosi[0]:
                            StarShape({ radius: conf.CELL_SIZE * 0.4, stroke: false, fill: 'gold' }).addChildTo(self).setPosition(boardGridX.span(spanX), boardGridY.span(spanY));
                            break;
                        case initPosi[1]:
                            Player(true).addChildTo(self).setPosition(boardGridX.span(spanX), boardGridY.span(spanY));
                            break;
                        case initPosi[2]:
                            Player(false).addChildTo(self).setPosition(boardGridX.span(spanX), boardGridY.span(spanY));
                            break;
                        default:
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
}