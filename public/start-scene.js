export default function () {
    phina.define('StartScene', {
        // 継承
        superClass: 'DisplayScene',
        // 初期化
        init: function (option) {
            // 親クラス初期化
            this.superInit(option);
            // 背景色
            this.backgroundColor = 'gray';
            Label({
                text: '指示があるまで始めないでください',
                fontSize: 48,
            }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(-1));
            const startBtn = Button({
                text: 'START',
                fontSize: 48,
            }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(1));
            const self = this;
            startBtn.onpointstart = () => {
                self.exit();//to MatchmakingScene
            };
        },
    });
}