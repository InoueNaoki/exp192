phina.globalize();

const option = {
    height: 1080,
    width: 1920,
}

/*
 * メイン処理
 */
phina.main(function () {
    const app = GameApp({
        height: 1080,
        width: 1920,
        startLabel: "start",
        scenes: [
            {
                label: "start",
                className: "StartScene",
            },
            {
                label: "matchmaking",
                className: "MatchmakingScene",
                nextLabel: "main",
            },
            {
                label: "main",
                className: "MainScene",
                nextLabel: "break",
            },
            {
                label: "break",
                className: "BreakScene",
            },
            {
                label: "questionnaire",
                className: "QuestionnaireScene",
                nextLabel: "thanks",
            },
            {
                label: "thanks",
                className: "ThanksScene",
            },
        ]
    });
    app.run();
});

phina.define('MainScene', {
    superClass: 'DisplayScene',
    init: function (param) {
        this.superInit(option);
        this.phase = 'assignmnent';
        // this.setNextPhase(param);
        Button({ text: 'next' })
            .setPosition(this.gridX.center(), this.gridY.span(9))
            .addChildTo(this)
            .onpointstart = () => {
                // this.exit(param);
                this.setNextPhase(param);
            };
        this.lbl = SendButton()
            .setPosition(this.gridX.center(), this.gridY.span(5))
            .addChildTo(this);
        // Board().test(true);
        this.board = Board()
        this.board.addChildTo(this).setPosition(200, 500);
        // this.board.test();
    },
    setNextPhase: function (param) {
        switch (this.phase) {
            case 'assignmnent':
                this.phase = 'messaging';
                this.board.setInteractive(true);
                break;
            case 'messaging':
                this.phase = 'moving';
                this.board.setInteractive(false);
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
        this.lbl.text = this.phase;
    },
});

phina.define('SendButton', {
    superClass: 'Button',
    init: function () {
        this.superInit({
            text: 'SEND',     // 表示文字
        });
    },

});

const conf = {
    "BACKGROUND_COLOR": "white",
    "CELL_COLOR": "white",
    "SCREEN": {
        "width": 1920,
        "height": 1080,
    },
    "MSG_FRAME_SIZE": 150,
    "FONT_COLOR": "black",
    "SHAPE_COLOR": "black",
    "FONT_SIZE": 48,
    "CELL_NUM_X": 3,
    "CELL_NUM_Y": 3,
    "GRID_SIZE": 200,
    "CELL_SIZE": 200,
    "WALL_WIDTH": 10,
    "WALL_COLOR": "black",
    "MATCHMAKING_MSG": "マッチング中......\nブラウザを閉じないでください",
    "COMPLETE_MATCHMAKE_MSG": "マッチング成立！\nしばらくこのままお待ち下さい",
    "SHAPE_LIST": [
        { "id": 0, "shape": "circle" },
        { "id": 1, "shape": "triangle" },
        { "id": 2, "shape": "square" },
        { "id": 3, "shape": "hexagon" }
    ],

}

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
        (conf.CELL_NUM_X).times((spanX) => {
            (conf.CELL_NUM_Y).times((spanY) => {
                let isTop, isBottom, isLeft, isRight;
                // X軸方向の通
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
                Cell(isTop, isBottom, isLeft, isRight)
                    .addChildTo(this)
                    .setPosition(boardGridX.span(spanX), boardGridY.span(spanY))
                    .onpointstart = () => {
                        console.log('clicked(' + spanX + ',' + spanY + ')and')
                    }
            });
        });
    },
    setInteractive: function (bool) {
        this.children.forEach((cell) => { cell.setInteractive(bool) });
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
            cornerRadius: 0
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

phina.define('StartScene', {
    superClass: 'DisplayScene',
    init: function () {
        this.superInit(option);
        Label(this.className)
            .setPosition(this.gridX.center(), this.gridY.span(5))
            .addChildTo(this);

        Button({ text: 'tutorial' })
            .setPosition(this.gridX.center(), this.gridY.span(9))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit('main', { gameMode: 0 });
            };
        Button({ text: 'start exp1' })
            .setPosition(this.gridX.center(), this.gridY.span(11))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit('matchmaking');
            };
    },
});

phina.define('ErrorScene', {
    superClass: 'DisplayScene',
    init: function (param) {
        this.superInit(option);
        Label('エラー:' + param.err)
            .setPosition(this.gridX.center(), this.gridY.span(5))
            .addChildTo(this);
        Button({ text: 'next' })
            .setPosition(this.gridX.center(), this.gridY.span(9))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit();
            };
    },
});

phina.define('MatchmakingScene', {
    superClass: 'DisplayScene',
    init: function () {
        this.superInit(option);
        Button({ text: 'next' })
            .setPosition(this.gridX.center(), this.gridY.span(9))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit('main', { gameMode: 1 });
            };
        // Label(this.className)
        //   .setPosition(this.gridX.center(), this.gridY.span(5))
        //   .addChildTo(this);
    },
});

phina.define('BreakScene', {
    superClass: 'DisplayScene',
    init: function (param) {
        this.superInit(option);
        this.backgroundColor = 'gray';
        Label(this.className + '\n Now GameMode ' + param.gameMode + ' is finished.')
            .setPosition(this.gridX.center(), this.gridY.span(5))
            .addChildTo(this);
        switch (param.gameMode) {
            case 0: // チュートリアル終了時
                Button({ text: 'back to start' })
                    .setPosition(this.gridX.center(), this.gridY.span(9))
                    .addChildTo(this)
                    .onpointstart = () => {
                        this.exit('start');//to StartScene
                    };
                break;
            case 1: // exp1終了時
                Button({ text: 'start exp2' })
                    .setPosition(this.gridX.center(), this.gridY.span(9))
                    .addChildTo(this)
                    .onpointstart = () => {
                        this.exit('main', { gameMode: 2 });//to Exp2
                    };
                break;
            case 2: // exp2終了時
                Button({ text: 'questionnaire' })
                    .setPosition(this.gridX.center(), this.gridY.span(9))
                    .addChildTo(this)
                    .onpointstart = () => {
                        this.exit('questionnaire');//to Thanks
                    };
                break;
            default:
                console.log('Invaild value: param.gameMode=' + param.gameMode)
                break;
        }
    },
});

phina.define('QuestionnaireScene', {
    superClass: 'DisplayScene',
    init: function () {
        this.superInit(option);
        Label(this.className)
            .setPosition(this.gridX.center(), this.gridY.span(5))
            .addChildTo(this);
        Button({ text: 'send' })
            .setPosition(this.gridX.center(), this.gridY.span(11))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit();//to MainScene
            };
    },
});

phina.define('ThanksScene', {
    superClass: 'DisplayScene',
    init: function () {
        this.superInit(option);
        Label(this.className)
            .setPosition(this.gridX.center(), this.gridY.span(5))
            .addChildTo(this);
        Button({ text: 'to start' })
            .setPosition(this.gridX.center(), this.gridY.span(11))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit('start');//to MainScene
            };
    },
});