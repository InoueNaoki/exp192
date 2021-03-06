export default (phina,conf)=> {
    phina.define('StartScene', {
        superClass: 'DisplayScene',// 継承
        // 初期化
        init: function () {
            this.superInit(conf.SCREEN);// 親クラス初期化
            Label({
                text: '指示があるまで始めないでください',
                fontSize: conf.FONT_SIZE,
            })
                .addChildTo(this)
                .setPosition(this.gridX.center(), this.gridY.center(-1));
            Button({
                text: 'START',
                fontSize: conf.FONT_SIZE,
                fill: conf.ENABLE_BUTTON_COLOR
            })
                .addChildTo(this)
                .setPosition(this.gridX.center(), this.gridY.center(1))
                .onpointstart = () => {
                    this.exit();//to MatchmakingScene
                };
        },
    });
}