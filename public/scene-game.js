export default (phina, conf, socket) => {
    // let currentShapeIndex = 0;
    // const shapeList = conf.SHAPE_LIST.shuffle(); //図形の出現順によるバイアスをなくすためにシャッフル .shuffle()はphina独自の記法
    phina.define('GameScene', {
        superClass: 'DisplayScene',
        init: function (param) {
            if (param.isHost) socket.emit('request assignment', param.guestId);
            const shapeList = conf.SHAPE_LIST.shuffle(); //図形の出現順によるバイアスをなくすためにシャッフル .shuffle()はphina独自の記法
            this.superInit(conf.SCREEN);
            const gx = this.gridX;
            const gy = this.gridY;
            Timer().addChildTo(this).setPosition(gx.span(2), gy.span(1));
            Round().addChildTo(this).setPosition(gx.span(2), gy.span(2));
            Score().addChildTo(this).setPosition(gx.span(2), gy.span(3));
            const board = Board().addChildTo(this).setPosition(gx.span(2), gy.span(6));
            this.msgGroup = MsgGroup(shapeList).addChildTo(this).setPosition(gx.span(7), gy.span(5));
            // this.exit(param); //gameover
            // Button().addChildTo(this).onpush = () => this.nextPhase();
            this.phaseLabel = Label({fontSize: conf.FONT_SIZE}).addChildTo(this).setPosition(gx.span(5), gy.span(2));
            this.initPhase();
            socket.on('response assignment', (visiblePosArr, movablePosArr) => {
                board.drawVisibleObj(visiblePosArr,param.isHost);
                board.drawMovableCell(movablePosArr);
                this.nextPhase(); //nextphase
            });
            socket.on('response messaging', (msg) => {
                this.nextPhase();
            });
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
                    this.msgGroup.setEnabled(true);
                    this.phase = 'messaging';
                    break;
                case 'messaging':
                    this.msgGroup.setEnabled(false);
                    this.phase = 'moving';
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
        },
    });

    phina.define('MsgGroup', {
        superClass: 'DisplayElement',
        init: function (shapeList) { 
            this.superInit();
            this.currentShapeIndexList = [...Array(conf.MSG_NUM)];
            const selfMsgGroup = DisplayElement().addChildTo(this);
            this.msgField(true, conf.MSG_NUM, shapeList, selfMsgGroup);
            const partnerMsgGroup = DisplayElement().addChildTo(this);
            partnerMsgGroup.y = 400;
            this.msgField(false, conf.MSG_NUM, shapeList, partnerMsgGroup);
        },
        msgField: function (isSelfMsg, msgNum, shapeList, parent) {
            [...Array(msgNum)].forEach((_, i) => {
                this.msgFrame(isSelfMsg, shapeList, i,parent);
            });
            this.senderLabel(isSelfMsg, parent);
            if (isSelfMsg) this.msgSendButton(shapeList,parent);
        },
        senderLabel: function (isSelfMsg,parent) {
            Label({
                text: isSelfMsg ? 'YOU' : "PARTNER",
                fontSize: conf.FONT_SIZE,
                x: conf.MSG_FRAME_SIZE * conf.MSG_NUM / 4,
                y: -conf.MSG_FRAME_SIZE * 0.8,
            }).addChildTo(parent);
        },
        msgFrame: function (isSelfMsg, shapeList, i, parent) {
            this.currentShapeIndexList[i] = 0;
            const frame = Button({
                width: conf.MSG_FRAME_SIZE,
                height: conf.MSG_FRAME_SIZE,
                fill: 'transparent',
                stroke: 'black',
                text: isSelfMsg ? 'click' : 'waiting',
                fontColor: 'lightgray',
                cornerRadius: 0,
                x: conf.MSG_FRAME_SIZE * i
            }).addChildTo(parent);
            // this.drawShape(shapeList[0], btn); //最初から画像を表示させるなら
            if (isSelfMsg) {
                frame.onpush = () => {
                    frame.text = '';
                    if (this.currentShapeIndexList[i] === shapeList.length - 1) this.currentShapeIndexList[i] = 0;
                    else this.currentShapeIndexList[i]++;
                    this.drawShape(shapeList[this.currentShapeIndexList[i]], frame);
                };
            }
            else {
                socket.on('response messaging', (recieveShapeList) => {
                    frame.text = '';
                    this.drawShape(recieveShapeList[i], frame);
                });
            }
        },
        drawShape: function (shape,parent) {
            parent.children.clear(); //既にある画像を削除
            switch (shape.name) {
                case 'circle':
                    CircleShape({
                        radius: conf.MSG_FRAME_SIZE / 2 * 0.8,
                        fill: conf.SHAPE_COLOR,
                    }).addChildTo(parent);
                    break;
                case 'triangle':
                    TriangleShape({
                        radius: conf.MSG_FRAME_SIZE / 2,
                        fill: conf.SHAPE_COLOR,
                        y: conf.MSG_FRAME_SIZE * 0.1,
                    }).addChildTo(parent);
                    break;
                case 'square':
                    RectangleShape({
                        width: conf.MSG_FRAME_SIZE * 0.8,
                        height: conf.MSG_FRAME_SIZE * 0.8,
                        fill: conf.SHAPE_COLOR,
                    }).addChildTo(parent);
                    break;
                case 'hexagon':
                    PolygonShape({
                        radius: conf.MSG_FRAME_SIZE / 2 * 0.9,
                        fill: conf.SHAPE_COLOR,
                        sides: 6,
                    }).addChildTo(parent);
                    break;
                case 'diamond':
                    PolygonShape({
                        radius: conf.MSG_FRAME_SIZE / 2 * 0.9,
                        fill: conf.SHAPE_COLOR,
                        sides: 4,
                    }).addChildTo(parent);
                    break;
                case 'octagon':
                    PolygonShape({
                        radius: conf.MSG_FRAME_SIZE / 2 * 0.9,
                        fill: conf.SHAPE_COLOR,
                        sides: 8,
                        rotation: 22.5,
                    }).addChildTo(parent);
                    break;
                default:
                    console.error('Invaild currentShapeIndex value:' + currentShapeIndex);
                    break;
            }
        },
        msgSendButton: function (shapeList,parent) {
            const btn = Button({
                text: 'SEND',
                fontSize: conf.FONT_SIZE,
                fill: conf.ENABLE_BUTTON_COLOR,
                x: conf.MSG_FRAME_SIZE * conf.MSG_NUM / 4,
                y: conf.MSG_FRAME_SIZE * 0.8,
            }).addChildTo(parent);
            btn.onpush = () => {
                const sendShapeList = this.currentShapeIndexList.map((currentShapeIndex) => {
                    return shapeList[currentShapeIndex];
                });
                socket.emit('request messaging', sendShapeList);
            };
        },
        setEnabled: function (bool) {
            // if (bool === true) this.show();
            // else this.hide();
            this.children.forEach((child) => {
                child.setInteractive(bool);
            });
            // this.setInteractive(bool);
        },
    });

    phina.define('Round', {
        superClass: 'Label',
        init: function () {
            this.superInit({
                text: 'ROUND: 0',
                fill: conf.FONT_COLOR,
                fontSize: conf.FONT_SIZE,
            });
        },
    });

    phina.define('Score', {
        superClass: 'Label',
        init: function () {
            this.superInit({
                text: 'SCORE: 0',
                fill: conf.FONT_COLOR,
                fontSize: conf.FONT_SIZE,
            });
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
            this.text = 'TIME：' + min + ':' + sec; // 経過秒数表示
        },
    });

    phina.define('Board', {
        superClass: 'DisplayElement',
        init: function () {
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
            this.boardGridList = [];
            this.cellGrop = [];
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
                    const cellButton = Cell(isTop, isBottom, isLeft, isRight)
                        .addChildTo(this)
                        .setPosition(boardGridX.span(spanX), boardGridY.span(spanY));
                    const convertFrom2dTo1d = (x, y) => { return conf.CELL_NUM_Y * y + x };// ex. in:(0,0),(0,1),(0,2)...(2,2)→out:0,1,2...9
                    const coord1d = convertFrom2dTo1d(spanX, spanY);
                    // this.boardGridList.push({ x: boardGridX.span(spanX), y: boardGridY.span(spanY) });
                    this.cellGrop.push({ cell: cellButton, x: boardGridX.span(spanX), y: boardGridY.span(spanY), cellNum: coord1d });
                });
            });
            this.reward = Reward();
            this.partnerAvater = Player(false);
            this.selfAvater = Player(true);
        },
        drawVisibleObj: function (visiblePosArr,isHost) {
            const selfIndex = isHost ? 1 : 2;
            const partnerIndex = isHost ? 2 : 1;

            visiblePosArr.forEach((visiblePos, i) => {
                const bg = this.cellGrop[visiblePos];
                if (visiblePos == null) return; // nullなら無視
                else if (i === 0) this.reward.addChildTo(this).setPosition(bg.x, bg.y);
                else if (i === partnerIndex) this.partnerAvater.addChildTo(this).setPosition(bg.x, bg.y);
                else if (i === selfIndex) {
                    this.selfAvater.addChildTo(this).setPosition(bg.x, bg.y);//後に配置したほうが上に配置されるので
                    PlayerShadow(true).addChildTo(this).setPosition(bg.x, bg.y);// 自分の影を配置
                }
                else console.error('存在しないオブジェクトを配置しようとしています'); 
            });
            // if (selfPos != null && selfPos === partnerPos) {
            //     this.partnerAvater.setPosition(this.cellGrop[partnerPos].x + 30, this.cellGrop[partnerPos].y);
            //     this.selfAvater.setPosition(this.cellGrop[selfPos].x - 30, this.cellGrop[selfPos].y);
            // }
        },
        drawMovableCell: function (movablePosArr) { 
            movablePosArr.forEach((movablePos) => {
                const cellButton = this.cellGrop[movablePos];
                cellButton.cell.fill = 'linen';
                cellButton.cell.onpointstart = () => {
                    this.dest = cellButton.cellNum;
                    this.selfAvater.setPosition(cellButton.x, cellButton.y);
                    console.log('clicked(' + cellButton.cellNum + ')');
                    this.destSendButton();
                }
            });
        },
        destSendButton: function () {
            this.btn = Button({
                text: 'SEND',
                fontSize: conf.FONT_SIZE,
                fill: conf.ENABLE_BUTTON_COLOR,
                x: -200
            }).addChildTo(this);
            this.btn.onpush = () => {
                // this.selfAvater.show();
                console.log(this.dest);
                // socket.emit('request moving', sendShape);
            }
        },
        setEnabled: function (bool) {
            if (bool === true) this.btn.show();
            else this.btn.hide();
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
            Label(isSelf ? 'あなた' : '相手').addChildTo(this);
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