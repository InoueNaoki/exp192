export default (phina, conf, socket) => {
    let currentShapeIndex = 0;
    const shapeList = conf.SHAPE_LIST.shuffle(); //図形の出現順によるバイアスをなくすためにシャッフル .shuffle()はphina独自の記法
    phina.define('GameScene', {
        superClass: 'DisplayScene',
        init: function (param) {
            this.superInit(conf.SCREEN);
            const gx = this.gridX;
            const gy = this.gridY;
            Timer().addChildTo(this).setPosition(gx.span(2), gy.span(1));
            this.msgSendButton = MsgSendButton().addChildTo(this).setPosition(gx.span(2), gy.span(6));
            MsgFrame(true).addChildTo(this).setPosition(gx.span(2), gy.span(4));
            MsgFrame(false).addChildTo(this).setPosition(gx.span(4), gy.span(4));
            Board(param.visiblePosArr,param.movablePosArr).addChildTo(this).setPosition(gx.span(8), gy.span(8));
            // this.exit(param); //gameover
            Button().addChildTo(this).onpush = () => { this.nextPhase() };
            this.phaseLabel = Label().addChildTo(this).setPosition(gx.span(10), gy.span(6));
            this.initPhase();
            // this.nextPhase(); //nextphase

            // this.phaseTitle = SendButton()
            //     .setPosition(gx.center(), gy.span(5))
            //     .addChildTo(this);

            // this.board = Board();
            // this.board.addChildTo(this).setPosition(200, 500);
        },
        initPhase: function () { 
            if (!this.phase) {
                this.phase = 'assignmnent';
                this.phaseLabel.text = this.phase;
            }
            else console.error("すでに値が挿入されています");
        },
        nextPhase: function () {
            switch (this.phase) {
                case 'assignmnent':
                    this.phase = 'messaging';
                    // this.board.setInteractive(true);
                    break;
                case 'messaging':
                    this.phase = 'moving';
                    // this.board.setInteractive(false);
                    break;
                case 'moving':
                    this.phase = 'judgment';
                    break;
                case 'judgment':
                    this.phase = 'assignmnent';
                    break;
                default:
                    console.error('invaild phase name');
                    break;
            }
            this.phaseLabel.text = this.phase;
            this.msgSendButton.setEnabled(false);
            console.log(this.phase);
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
            this.senderLabel(isSelfMsg);
            this.shapeGroup = DisplayElement().addChildTo(this);
            if (isSelfMsg) {
                this.onpointstart = () => {
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
            this.shapeGroup.children.clear(); //既に画像があれば削除
            switch (shape) {
                case 'circle':
                    CircleShape({
                        radius: conf.MSG_FRAME_SIZE / 2 * 0.8,
                        fill: conf.SHAPE_COLOR,
                    }).addChildTo(this.shapeGroup);
                    break;
                case 'triangle':
                    TriangleShape({
                        radius: conf.MSG_FRAME_SIZE / 2,
                        fill: conf.SHAPE_COLOR,
                        y: conf.MSG_FRAME_SIZE * 0.1,
                    }).addChildTo(this.shapeGroup);
                    break;
                case 'square':
                    RectangleShape({
                        width: conf.MSG_FRAME_SIZE * 0.8,
                        height: conf.MSG_FRAME_SIZE * 0.8,
                        fill: conf.SHAPE_COLOR,
                    }).addChildTo(this.shapeGroup);
                    break;
                case 'hexagon':
                    PolygonShape({
                        radius: conf.MSG_FRAME_SIZE / 2 * 0.9,
                        fill: conf.SHAPE_COLOR,
                        sides: 6,
                    }).addChildTo(this.shapeGroup);
                    break;
                case 'diamond':
                    PolygonShape({
                        radius: conf.MSG_FRAME_SIZE / 2 * 0.9,
                        fill: conf.SHAPE_COLOR,
                        sides: 4,
                    }).addChildTo(this.shapeGroup);
                    break;
                case 'octagon':
                    PolygonShape({
                        radius: conf.MSG_FRAME_SIZE / 2 * 0.9,
                        fill: conf.SHAPE_COLOR,
                        sides: 8,
                        rotation: 22.5,
                    }).addChildTo(this.shapeGroup);
                    break;
                default:
                    console.error('Invaild currentShapeIndex value:' + currentShapeIndex);
                    break;
            }
        },
        senderLabel: function (isSelfMsg) { 
            Label({
                text: isSelfMsg ? 'YOU' : 'PARTNER',
                fontSize: conf.FONT_SIZE,
                y: -conf.MSG_FRAME_SIZE * 0.8,
            }).addChildTo(this);
        }
    });

    phina.define('MsgSendButton', {
        superClass: 'Button',
        init: function () {
            this.superInit({
                text: 'SEND',
                fontSize: conf.FONT_SIZE,
                fill: conf.ENABLE_BUTTON_COLOR
            });
        },
        update: function () {
            this.onpointstart = () => {
                // ボタンが押されたときの処理
                // GameScene(param).nextPhase();
                // this.fill = 'lightgray';
                // this.setInteractive(false);
                const sendShape = (currentShapeIndex == 0) ? shapeList.last.shape : shapeList[currentShapeIndex - 1].shape // インデックスが最初の図形のなら今画面に表示されてる図形は最後の図形
                socket.emit('send message', sendShape);
            };
        },
        setEnabled: function (bool) {
            this.fill = bool ? conf.ENABLE_BUTTON_COLOR : conf.DISABLE_BUTTON_COLOR
            this.setInteractive(bool);
        },
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

    phina.define('Board', {
        superClass: 'DisplayElement',
        init: function (visiblePosArr, movablePosArr) {
            this.superInit();
            console.log(visiblePosArr);
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
            this.boardGridList = [];
            (conf.CELL_NUM_Y).times((spanY) => {
                (conf.CELL_NUM_X).times((spanX) => {
                    let isTop, isBottom, isLeft, isRight;
                    // X軸方向の通路
                    if (spanX === 0) {
                        isLeft = false;
                        isRight = true;
                    } else if (spanX === conf.CELL_NUM_X - 1) {
                        isLeft = true;
                        isRight = false;
                    } else {
                        isLeft = true;
                        isRight = true;
                    }
                    // Y軸方向の通路
                    if (spanY === 0) {
                        isTop = false;
                        isBottom = true;
                    } else if (spanY === conf.CELL_NUM_Y - 1) {
                        isTop = true;
                        isBottom = false;
                    } else {
                        isTop = true;
                        isBottom = true;
                    }
                    const cell = Cell(isTop, isBottom, isLeft, isRight)
                        .addChildTo(this)
                        .setPosition(boardGridX.span(spanX), boardGridY.span(spanY));
                    const convertFrom2dTo1d = (x, y) => { return conf.CELL_NUM_Y * y + x };// ex. in:(0,0),(0,1),(0,2)...(2,2)→out:0,1,2...9
                    const coord1d = convertFrom2dTo1d(spanX, spanY);
                    this.boardGridList.push({ x:boardGridX.span(spanX), y:boardGridY.span(spanY) });
                    if (movablePosArr[coord1d]) {
                        cell.fill = 'linen';
                        cell.onpointstart = () => {
                            console.log('clicked(' + coord1d + ')')
                        }
                    }
                });
            });
            this.drawObj(visiblePosArr);
        },
        drawObj: function (visiblePosArr) {
            const rw = Reward();
            const p2 = Player(false);
            const p1 = Player(true);
            const p1Pos = visiblePosArr[1];
            const p2Pos = visiblePosArr[2];

            visiblePosArr.forEach((visiblePos, i) => {
                const bg = this.boardGridList[visiblePos];
                if (visiblePos == null) return; // nullなら無視
                else if (i === 0) rw.addChildTo(this).setPosition(bg.x, bg.y);
                else if (i === 2) p2.addChildTo(this).setPosition(bg.x, bg.y);
                else if (i === 1) p1.addChildTo(this).setPosition(bg.x, bg.y);//後に配置したほうが上に配置されるので
                else console.error('存在しないオブジェクトを配置しようとしています'); 
            });
            if (p1Pos != null && p1Pos === p2Pos) {
                p2.setPosition(this.boardGridList[p2Pos].x + 30, this.boardGridList[p2Pos].y);
                p1.setPosition(this.boardGridList[p1Pos].x - 30, this.boardGridList[p1Pos].y);
            }
        },
        drawMovableCell: function (MovableArr) { 
            MovableArr.forEach((visiblePos, i) => {
                const bg = this.boardGridList[visiblePos];
                if (visiblePos == null) return; // nullなら無視
                else if (i === 0) rw.addChildTo(this).setPosition(bg.x, bg.y);
                else if (i === 2) p2.addChildTo(this).setPosition(bg.x, bg.y);
                else if (i === 1) p1.addChildTo(this).setPosition(bg.x, bg.y);//後に配置したほうが上に配置されるので
                else console.error('存在しないオブジェクトを配置しようとしています');
            });
        },
        setEnabled: function (bool) {
            this.children.forEach((cell) => {
                cell.setInteractive(bool);
            });
        },
    });

    // 部屋クラス
    phina.define('Cell', {
        superClass: 'Button',
        init: function (isTop, isBottom, isLeft, isRight) {
            this.superInit({
                width: conf.CELL_SIZE,
                height: conf.CELL_SIZE,
                fill: conf.CELL_COLOR,
                stroke: conf.WALL_COLOR,
                strokeWidth: conf.WALL_WIDTH,
                cornerRadius: 0,
                text: ''
            });
            if (isTop) this.aisle(0, -conf.CELL_SIZE / 2, 90);
            if (isBottom) this.aisle(0, conf.CELL_SIZE / 2, 90);
            if (isLeft) this.aisle(-conf.CELL_SIZE / 2, 0, 0);
            if (isRight) this.aisle(conf.CELL_SIZE / 2, 0, 0);
        },
        aisle: function (x, y, angle) {
            RectangleShape({
                width: conf.WALL_WIDTH,
                height: conf.CELL_SIZE / 2, //道幅
                fill: conf.CELL_COLOR,
                stroke: false,
                rotation: angle,
                x: x,
                y: y
            }).addChildTo(this);
        }
    });

    phina.define('PlayerShadow', {
        superClass: 'CircleShape',
        init: function (isSelf) {
            const playerColor = isSelf ? 'skyblue' : 'orange';
            this.superInit({
                radius: conf.CELL_SIZE / 2 * 0.5,
                fill: 'transparent',
                stroke: playerColor,
                strokeWidth: 10,
            });
        },
        // superClass: 'Label',
        // init: function (isSelf) {
        //     this.superInit({
        //         text: isSelf ? 'H' : 'G',
        //     });
        // },
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
        // superClass: 'Label',
        // init: function (isSelf) {
        //     this.superInit({
        //         text: isSelf ? 'H' : 'G',
        //     });
        // },
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
                radius: tomato * 0.7,
                fill: 'green',
                sides: 5,
                sideIndent: 0.5,
                y: -tomato * 0.7,
            }).addChildTo(this);
            RectangleShape({
                height: tomato * 0.7,
                width: tomato * 0.2,
                fill: 'green',
                y: -tomato,
                x: tomato * 0.2,
                rotation: 22.5,
            }).addChildTo(this);
        },
    });
};