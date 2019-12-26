export default (phina, conf, socket) => {
    // let currentShapeIndex = 0;
    // const shapeList = conf.SHAPE_LIST.shuffle(); //図形の出現順によるバイアスをなくすためにシャッフル .shuffle()はphina独自の記法
    // const NumData = {};
    const dynamicParam = {
        round: 1,
        score: 0,
        time: 0,
        phase: 'placement',
        notification: '初期準備中...',
    };
    const historyList = [];
    phina.define('GameScene', {
        superClass: 'DisplayScene',
        init: function (staticParam) {
            if (staticParam.isHost) socket.emit('request placement', dynamicParam.round);
            console.log(staticParam);
            const shapeList = conf.SHAPE_LIST.shuffle(); //図形の出現順によるバイアスをなくすためにシャッフル .shuffle()はphina独自の記法
            this.superInit(conf.SCREEN);
            const gx = this.gridX;
            const gy = this.gridY;
            RoomLabel(staticParam.pairId).addChildTo(this).setPosition(gx.span(0), gy.span(0.5));
            TimerLabel().addChildTo(this).setPosition(gx.span(0), gy.span(1.5));
            RoundLabel().addChildTo(this).setPosition(gx.span(0), gy.span(2.5));
            ScoreLabel().addChildTo(this).setPosition(gx.span(0), gy.span(3.5));
            PhaseLabel().addChildTo(this).setPosition(gx.span(4), gy.span(0.5));
            NotificationLabel().addChildTo(this).setPosition(gx.span(6), gy.span(2));
            this.board = Board().addChildTo(this).setPosition(gx.span(2), gy.span(6));
            this.board.setEnabled(false);
            this.msgGroup = MsgGroup(shapeList).addChildTo(this).setPosition(gx.span(7), gy.span(6));
            // this.exit(param); //gameover
            // this.initPhase();
            socket.on('response placement', (visiblePosDic, movablePosList) => {
                this.board.drawVisibleObj(visiblePosDic);
                this.board.drawMovableCell(movablePosList, visiblePosDic);
                this.nextPhase(); //nextphase
            });
            socket.on('finish messaging', () => this.nextPhase());
            socket.on('finish moving', () => this.nextPhase());
            socket.on('response judgment', (judgmentResult) => {
                dynamicParam.score += judgmentResult.increment;
                dynamicParam.round++;
                this.nextPhase(judgmentResult.nextPhase);
                this.msgGroup.setEnabled(true);
            });
        },
        nextPhase: function (next = 'error') {
            switch (dynamicParam.phase) {
                case 'placement':
                    // this.msgGroup.setEnabled(true);
                    dynamicParam.phase = 'messaging';
                    dynamicParam.notification = '図形を選択し，送信してください';
                    break;
                case 'messaging':
                    this.msgGroup.setEnabled(false);
                    this.board.setEnabled(true);
                    dynamicParam.phase = 'moving';
                    break;
                case 'moving':
                    this.board.setEnabled(false);
                    dynamicParam.phase = 'judgment';
                    break;
                case 'judgment':
                    dynamicParam.phase = next;
                    break;
                default:
                    console.error('invaild phase name');
                    break;
            }
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
                text: isSelfMsg ? '● あなた' : '● 相手',
                fontSize: conf.FONT_SIZE,
                fill: isSelfMsg ? conf.SELF_COLOR : conf.PARTNER_COLOR,
                x: conf.MSG_FRAME_SIZE * conf.MSG_NUM / 4,
                y: -conf.MSG_FRAME_SIZE * 0.8,
            }).addChildTo(parent);
        },
        msgFrame: function (isSelfMsg, shapeList, i, parent) {
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
                    if (!this.currentShapeIndexList[i]) this.currentShapeIndexList[i] = 0;
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
            this.btn = Button({
                text: 'SEND',
                fontSize: conf.FONT_SIZE,
                fill: conf.ENABLE_BUTTON_COLOR,
                x: conf.MSG_FRAME_SIZE * conf.MSG_NUM / 4,
                y: conf.MSG_FRAME_SIZE * 0.8,
            }).addChildTo(parent);
            this.btn.onpush = () => {
                if (this.currentShapeIndexList.includes(undefined)) {
                    this.btn.tweener.clear().by({
                        x: 20,
                    }, 30, 'easeOutInElastic').by({
                        x: -40,
                    }, 60, 'easeOutInElastic').by({
                        x: 20,
                    }, 30, 'easeOutInElastic');
                    dynamicParam.notification = 'メッセージを全て入力してから送信してください';
                    // Label({
                    //     text: 'メッセージを全て入力してから\n送信してください',
                    //     fill: 'crimson',
                    //     fontSize: conf.FONT_SIZE,
                    //     backgroundColor: 'white',
                    //     x: conf.MSG_FRAME_SIZE * conf.MSG_NUM / 4,
                    // }).addChildTo(parent).tweener.wait(500).fadeOut(500).play();
                }
                else {
                    // 送信ボタンと自分のフレームのクリック判定をオフ
                    parent.children.forEach((frame) => {
                        frame.setInteractive(false);
                        this.btn.setInteractive(false);
                        this.btn.fill = conf.DISABLE_BUTTON_COLOR;
                    });
                    //　メッセージをサーバーに送信
                    const sendShapeList = this.currentShapeIndexList.map((currentShapeIndex) => {
                        return shapeList[currentShapeIndex];
                    });
                    socket.emit('request messaging', sendShapeList, dynamicParam);
                }
            };
        },
        reset: function () {
            this.setEnabled(true);
        },
        setEnabled: function (bool) {
            this.children.forEach((msgField) => {
                msgField.children.forEach((grandChild) => {
                    grandChild.setInteractive(bool); // grandChild=frameやbtn
                });
            });
            this.btn.setInteractive(bool);
            this.btn.fill = bool ? conf.ENABLE_BUTTON_COLOR : conf.DISABLE_BUTTON_COLOR;
        },
    });

    phina.define('RoundLabel', {
        superClass: 'Label',
        init: function () {
            this.superInit({
                text: '',
                align: 'left',
                fill: conf.FONT_COLOR,
                fontSize: conf.FONT_SIZE,
            });
        },
        update: function () {
            this.text = 'ROUND: ' + dynamicParam.round;
        },
    });

    phina.define('NotificationLabel', {
        superClass: 'LabelArea',
        init: function () {
            this.superInit({
                text: '',
                align: 'left',
                fill: conf.FONT_COLOR,
                fontSize: conf.FONT_SIZE,
                // backgroundColor: 'whitesmoke',
                backgroundColor: 'aliceblue',
                width: 800,
                height: 100,
                padding: 10,
            });
        },
        update: function () {
            this.text = dynamicParam.notification;
        },
        // temp: function (tempNotification) {
        //     this.text = tempNotification;
        //     wait(500);
        //     this.text = dynamicParam.notification;
        // }
    })

    phina.define('PhaseLabel', {
        superClass: 'Label',
        init: function () {
            this.superInit({
                text: '',
                align: 'center',
                fill: conf.FONT_COLOR,
                fontSize: conf.FONT_SIZE,
            });
        },
        update: function () {
            this.text = dynamicParam.phase;
        },
    });

    phina.define('RoomLabel', {
        superClass: 'Label',
        init: function (pairId) {
            this.superInit({
                text: 'ROOM: ' + pairId,
                align: 'left',
                fill: conf.FONT_COLOR,
                fontSize: conf.FONT_SIZE,
            });
        }
    });

    phina.define('ScoreLabel', {
        superClass: 'Label',
        init: function () {
            this.superInit({
                text: '',
                align: 'left',
                fill: conf.FONT_COLOR,
                fontSize: conf.FONT_SIZE,
            });
        },
        update: function () {
            this.text = 'SCORE: ' + dynamicParam.score;
        },
    });

    phina.define('TimerLabel', {
        superClass: 'Label',
        init: function () {
            this.superInit({
                text: '',
                align: 'left',
                fill: conf.FONT_COLOR,
                fontSize: conf.FONT_SIZE,
            });
            // globalGameData.time = 0;
        },
        update: function (app) {
            dynamicParam.time += app.deltaTime;
            const time = dynamicParam.time / 1000;
            const min = ('00' + Math.floor(time / 60)).slice(-2);
            const sec = ('00' + Math.floor(time % 60)).slice(-2);
            this.text = 'TIME: ' + min + ':' + sec; // 経過秒数表示
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
            this.rewardAvater = Reward();
            this.partnerAvater = Player(false);
            this.selfAvater = Player(true);
            this.selfAvaterShadow = PlayerShadow(true);
            this.destSendButton();
        },
        drawVisibleObj: function (visiblePosDic) {
            console.log(visiblePosDic);
            const bg = (visiblePos) => { return this.cellGrop[visiblePos] };
            const rewardPos = visiblePosDic.reward;
            const selfPos = this.dest = visiblePosDic.self;
            const partnerPos = visiblePosDic.partner;
            if (rewardPos != null) this.rewardAvater.addChildTo(this).setPosition(bg(rewardPos).x, bg(rewardPos).y);
            if (partnerPos != null) this.partnerAvater.addChildTo(this).setPosition(bg(partnerPos).x, bg(partnerPos).y);
            if (selfPos != null) {
                this.selfAvater.addChildTo(this).setPosition(bg(selfPos).x, bg(selfPos).y);
                // PlayerShadow(true).addChildTo(this).setPosition(bg(selfPos).x, bg(selfPos).y)
            }

            //かぶったとき
            if (selfPos === partnerPos) {
                this.partnerAvater.setPosition(bg(partnerPos).x + 30, bg(partnerPos).y);
                this.selfAvater.setPosition(bg(selfPos).x - 30, bg(selfPos).y);
            }
            if (selfPos === rewardPos) {
                this.rewardAvater.setPosition(bg(rewardPos).x, bg(rewardPos).y - 30);
                // const rect = RectangleShape({
                //     width: conf.CELL_SIZE * 0.5,
                //     fill: 'MISTYROSE',
                //     cornerRadius: conf.CELL_SIZE * 0.05
                // }).addChildTo(this).setPosition(bg(rewardPos).x - 50, bg(rewardPos).y + 50);
                // Label({
                //     text: 'GET!',
                //     fill: 'CRIMSON'
                // }).addChildTo(rect);
            }
        },
        drawMovableCell: function (movablePosList, visiblePosDic) { 
            movablePosList.forEach((movablePos) => {
                const cellButton = this.cellGrop[movablePos];
                cellButton.cell.fill = 'linen';
                cellButton.cell.onpointstart = () => {
                    // this.dest = cellButton.cellNum;
                    visiblePosDic.self = cellButton.cellNum;
                    this.drawVisibleObj(visiblePosDic);
                    // console.log('clicked(' + cellButton.cellNum + ')');
                }
            });
        },
        destSendButton: function () {
            this.btn = Button({
                text: 'MOVE',
                fontSize: conf.FONT_SIZE,
                fill: conf.ENABLE_BUTTON_COLOR,
                x: conf.GRID_SIZE,
                y: (conf.GRID_SIZE * conf.CELL_NUM_Y) - (conf.GRID_SIZE / 4),
            }).addChildTo(this);
            this.btn.onpush = () => {
                this.btn.setInteractive(false);
                this.btn.fill = conf.DISABLE_BUTTON_COLOR;
                socket.emit('request moving', this.dest, dynamicParam);
            }
        },
        setEnabled: function (bool) {
            if (bool === true) {
                this.btn.show();
            }
            else {
                this.btn.hide();
            }
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
            const playerColor = isSelf ? conf.SELF_COLOR : conf.PARTNER_COLOR;
            this.superInit({
                radius: conf.CELL_SIZE / 2 * 0.5,
                fill: 'transparent',
                stroke: playerColor,
                strokeWidth: 10,
            });
        },
    });

    phina.define('Player', {
        superClass: 'CircleShape',
        init: function (isSelf) {
            const playerColor = isSelf ? conf.SELF_COLOR : conf.PARTNER_COLOR;
            this.superInit({
                radius: conf.CELL_SIZE / 2 * 0.5,
                fill: playerColor,
                strokeWidth: false,
            });
            // Label(isSelf ? 'あなた' : '相手').addChildTo(this);
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