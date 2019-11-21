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
                nextLabel: "assignment",
                arguments: { gameMode: 1 },
            },
            {
                label: "experimentMode",
                className: "ExperimentModeSequence",
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

phina.define('ExperimentModeSequence', {
    superClass: 'ManagerScene',
    init: function (param) {
        this.superInit({
            startLabel: "assignment",
            scenes: [
                {
                    label: "assignment",
                    className: "AssignmentScene",
                    nextLabel: "messaging",
                    arguments: param
                },
                {
                    label: "messaging",
                    className: "MessagingScene",
                    nextLabel: "shifting",
                    arguments: param
                },
                {
                    label: "shifting",
                    className: "ShiftingScene",
                    nextLabel: "judgment",
                    arguments: param
                },
                {
                    label: "judgment",
                    className: "JudgmentScene",
                    arguments: param
                },
            ]
        });
        this.on('finish', () => {
            this.exit(param);
        });
    },
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
                this.exit('experimentMode', { gameMode: 0 });
            };
        Button({ text: 'start exp1' })
            .setPosition(this.gridX.center(), this.gridY.span(11))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit('matchmaking');
            };
    },
});

// phina.define('ErrorScene', {
//   superClass: 'DisplayScene',
//   init: function(param) {
//     this.superInit(option);
//     Label('エラー:'+param.err)
//       .setPosition(this.gridX.center(), this.gridY.span(5))
//       .addChildTo(this);
//     Button({text:'next'})
//       .setPosition(this.gridX.center(), this.gridY.span(9))
//       .addChildTo(this)
//       .onpointstart = () => {
//         this.exit();
//       };
//   },
// });

phina.define('MatchmakingScene', {
    superClass: 'DisplayScene',
    init: function (param) {
        this.superInit(option);
        Label(this.className)
            .setPosition(this.gridX.center(), this.gridY.span(5))
            .addChildTo(this);
        Button({ text: 'next' })
            .setPosition(this.gridX.center(), this.gridY.span(9))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit('experimentMode', param); // param.gameModeをAssignmentSceneにそのまま渡す
            };
    },
});

phina.define('AssignmentScene', {
    superClass: 'DisplayScene',
    init: function (param) {
        this.superInit(option);
        Label(this.className + '\n Now GameMode is ' + param.gameMode)
            .setPosition(this.gridX.center(), this.gridY.span(5))
            .addChildTo(this);
        Button({ text: 'next' })
            .setPosition(this.gridX.center(), this.gridY.span(9))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit(param);//to MainScene
            };
    },
});

phina.define('MessagingScene', {
    superClass: 'DisplayScene',
    init: function (param) {
        this.superInit(option);
        Label(this.className + '\n Now GameMode is ' + param.gameMode)
            .setPosition(this.gridX.center(), this.gridY.span(5))
            .addChildTo(this);
        Button({ text: 'next' })
            .setPosition(this.gridX.center(), this.gridY.span(9))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit(param);//to MainScene
            };
    },
});

phina.define('ShiftingScene', {
    superClass: 'DisplayScene',
    init: function (param) {
        this.superInit(option);
        Label(this.className + '\n Now GameMode is ' + param.gameMode)
            .setPosition(this.gridX.center(), this.gridY.span(5))
            .addChildTo(this);
        Button({ text: 'next' })
            .setPosition(this.gridX.center(), this.gridY.span(9))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit(param);
            };
    },
});

phina.define('JudgmentScene', {
    superClass: 'DisplayScene',
    init: function (param) {
        this.superInit(option);
        Label(this.className + '\n Now GameMode is ' + param.gameMode)
            .setPosition(this.gridX.center(), this.gridY.span(5))
            .addChildTo(this);
        Button({ text: 'to assignment' })
            .setPosition(this.gridX.center(), this.gridY.span(7))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit('assignment', param);
            };
        Button({ text: 'to messaging' })
            .setPosition(this.gridX.center(), this.gridY.span(9))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit('messaging', param);
            };
        Button({ text: 'finish game!' })
            .setPosition(this.gridX.center(), this.gridY.span(11))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit(param);
            };
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
                        this.exit('experimentMode', { gameMode: 2 });//to Exp2
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