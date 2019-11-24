export default (phina, conf, socket) => {
    let currentShapeIndex = 0;
    const shapeList = conf.SHAPE_LIST.shuffle(); //図形の出現順によるバイアスをなくすためにシャッフル .shuffle()はphina独自の記法
    /* AssignmentScene クラスを定義 */
    phina.define('AssignmentScene', {
        superClass: 'DisplayScene',
        init: function (param) {
            this.superInit(conf.SCREEN);
            this.backgroundColor = conf.BACKGROUND_COLOR;// 背景色を指定
            const gx = this.gridX;
            const gy = this.gridY;
            Timer().addChildTo(this).setPosition(gx.span(2), gy.span(1));
            MsgSendButton().addChildTo(this).setPosition(gx.span(2), gy.span(6));
            MsgFrame(true).addChildTo(this).setPosition(gx.span(2), gy.span(4));
            MsgFrame(false).addChildTo(this).setPosition(gx.span(4), gy.span(4));
            Board(param.visiblePos, param.movablePos).addChildTo(this).setPosition(gx.span(6), gy.span(8));
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
            SenderLabel(isSelfMsg).addChildTo(this).setPosition(0, 100);
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
        // senderLabel: function (isSelfMsg) { 
        //     Label({
        //         text: isSelfMsg ? 'YOU' : 'PARTNER',
        //         fontSize: conf.FONT_SIZE,
        //         y: -conf.MSG_FRAME_SIZE * 0.8,
        //     }).addChildTo(this);
        // },
    });

    phina.define('SenderLabel', {
        superClass: 'Label',
        init: function (isSelfMsg) {
            this.superInit({
                text: isSelfMsg ? 'YOU' : 'PARTNER',
                fontSize: conf.FONT_SIZE,
            });
        },
    });

    phina.define('MsgSendButton', {
        superClass: 'Button',
        init: function () {
            this.superInit({
                text: 'SEND',     // 表示文字
                fontSize: conf.FONT_SIZE,       // 文字サイズ
            });
        },
        update: function () {
            this.onpointstart = () => {
                // ボタンが押されたときの処理
                // this.fill = 'lightgray';
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
        },
        update: function (app) {
            this.time += app.deltaTime;
            const time = this.time / 1000;
            const min = ('00' + Math.floor(time / 60)).slice(-2);
            const sec = ('00' + Math.floor(time % 60)).slice(-2);
            this.text = 'elapsed：' + min + ':' + sec; // 経過秒数表示
        },
    });

    phina.define('Round', {
        superClass: 'Label',
        init: function () {
            this.superInit({
                text: 'round:'+0,
                fill: conf.FONT_COLOR,
                fontSize: conf.FONT_SIZE,
            });
        },
    });

    phina.define('Score', {
        superClass: 'Label',
        init: function () {
            this.superInit({
                text: 'your score:'+0,
                fill: conf.FONT_COLOR,
                fontSize: conf.FONT_SIZE,
            });
        },
    });

    // ゲーム盤クラス
    phina.define('Board', {
        superClass: 'DisplayElement',
        init: function (initPosi,movable) {
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
                    // X軸方向の通
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
                    const convertFrom2dTo1d = (x, y) => { return conf.CELL_NUM_Y * y + x };// ex. in:(0,0),(0,1),(0,2)...(2,2)→out:0,1,2...9
                    const coord = convertFrom2dTo1d(spanX, spanY);
                    switch (coord) {
                        case initPosi[0]:
                            Reward().addChildTo(this).setPosition(boardGridX.span(spanX), boardGridY.span(spanY));
                            break;
                        case initPosi[1]:
                            Player(true).addChildTo(this).setPosition(boardGridX.span(spanX), boardGridY.span(spanY));
                            break;
                        case initPosi[2]:
                            Player(false).addChildTo(this).setPosition(boardGridX.span(spanX), boardGridY.span(spanY));
                            break;
                        default:
                            break;
                    }
                    if (movable[coord]) {
                        cell.setInteractive(true);
                        cell.onpointstart = () => {
                            console.log('clicked(' + spanX + ',' + spanY + ')' + this);
                        };
                        cell.fill = 'linen';
                    }
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

    phina.define('Reward', {
        superClass: 'CircleShape',
        init: function () {
            const tomato = conf.CELL_SIZE / 2 * 0.5;
            this.superInit({
                radius: tomato,
                fill: 'red',
                strokeWidth: false,
            });
            StarShape({
                radius: tomato*0.7,
                fill: 'green',
                sides: 5,
                sideIndent: 0.5,
                y: -tomato*0.7,
            }).addChildTo(this);
            RectangleShape({
                height: tomato*0.7,
                width: tomato*0.2,
                fill: 'green',
                y: -tomato,
                x: tomato*0.2,
                rotation: 22.5,
            }).addChildTo(this);
        },
    });
}