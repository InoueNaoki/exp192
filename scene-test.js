phina.globalize();

/*
 * メイン処理
 */
phina.main(function () {
    const app = GameApp({
        height: 1080,
        width: 1920,
        // fit: false,
        startLabel: "start",
        scenes: [
            {
                label: "start",
                className: "StartScene",
                nextLabel: "matchmaking"
            },
            {
                label: "matchmaking",
                className: "MatchmakingScene",
                nextLabel: "assignment"
            },
            {
                label: "assignment",
                className: "AssignmentScene",
                nextLabel: "messaging"
            },
            {
                label: "messaging",
                className: "MessagingScene",
                nextLabel: "shifting"
            },
            {
                label: "shifting",
                className: "ShiftingScene",
                nextLabel: "assignment"
            },
            {
                label: "thanks",
                className: "ThanksScene",
            },
            {
                label: "tutorial",
                className: "TutorialScene",
            },
        ]
    });
    app.run();
});

phina.define('StartScene', {
    superClass: 'DisplayScene',
    init: function (option) {
        this.superInit(option);
        this.backgroundColor = 'white';
        Label(this.className)
            .setPosition(this.gridX.center(), this.gridY.span(5))
            .addChildTo(this);
        // Label(params.message)
        //   .setPosition(this.gridX.center(), this.gridY.span(7))
        //   .addChildTo(this);
        Button({ text: 'tutorial' })
            .setPosition(this.gridX.center(), this.gridY.span(9))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit('tutorial');//to Scene
            };
        Button({ text: 'start' })
            .setPosition(this.gridX.center(), this.gridY.span(11))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit('matchmaking');
            };
    },
});

phina.define('TutorialScene', {
    superClass: 'DisplayScene',
    init: function (option) {
        this.superInit(option);
        this.backgroundColor = 'gold';
        Label(this.className)
            .setPosition(this.gridX.center(), this.gridY.span(5))
            .addChildTo(this);
        Button({ text: 'back' })
            .setPosition(this.gridX.center(), this.gridY.span(9))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit('start');//to Scene
            };
    },
});

phina.define('MatchmakingScene', {
    superClass: 'DisplayScene',
    init: function (option) {
        this.superInit(option);
        this.backgroundColor = 'gray';
        Label(this.className)
            .setPosition(this.gridX.center(), this.gridY.span(5))
            .addChildTo(this);
        Button({ text: 'next' })
            .setPosition(this.gridX.center(), this.gridY.span(9))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit();//to Scene
            };
        Button({ text: 'back' })
            .setPosition(this.gridX.center(), this.gridY.span(11))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit('start');
            };
    },
});

phina.define('AssignmentScene', {
    superClass: 'DisplayScene',
    init: function (option) {
        this.superInit(option);
        this.backgroundColor = 'green'
        Label(this.className)
            .setPosition(this.gridX.center(), this.gridY.span(5))
            .addChildTo(this);
        Button({ text: 'next' })
            .setPosition(this.gridX.center(), this.gridY.span(9))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit('messaging');//to MainScene
            };
    },
});

phina.define('MessagingScene', {
    superClass: 'DisplayScene',
    init: function (option) {
        this.superInit(option);
        this.backgroundColor = 'linen'
        Label(this.className)
            .setPosition(this.gridX.center(), this.gridY.span(5))
            .addChildTo(this);
        Button({ text: 'next' })
            .setPosition(this.gridX.center(), this.gridY.span(9))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit('shifting');//to ThanksScene
            };
    },
});

phina.define('ShiftingScene', {
    superClass: 'DisplayScene',
    init: function (option) {
        this.superInit(option);
        this.backgroundColor = 'skyblue'
        Label(this.className)
            .setPosition(this.gridX.center(), this.gridY.span(5))
            .addChildTo(this);
        Button({ text: 'assignment' })
            .setPosition(this.gridX.center(), this.gridY.span(9))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit('assignment');//to MainScene
            };
        Button({ text: 'messaging' })
            .setPosition(this.gridX.center(), this.gridY.span(11))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit('messaging');//to MainScene
            };
        Button({ text: 'gameover' })
            .setPosition(this.gridX.center(), this.gridY.span(13))
            .addChildTo(this)
            .onpointstart = () => {
                this.exit('thanks');// to ThanksScene
            };
    },
});

phina.define('ThanksScene', {
    superClass: 'DisplayScene',
    init: function (option) {
        this.superInit(option);
        this.backgroundColor = 'pink'
        Label(this.className)
            .setPosition(this.gridX.center(), this.gridY.span(5))
            .addChildTo(this);
        Label('THANK YOU')
            .setPosition(this.gridX.center(), this.gridY.center())
            .addChildTo(this);
        Button({ text: 'to start' })
            .setPosition(this.gridX.center(), this.gridY.span(11))
            .addChildTo(this)
            .onpointstart = () => {
                // this.nextLabel="start";
                this.exit('start');//to MainScene
            };
    },
});