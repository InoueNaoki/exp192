export default (phina, conf, socket) => {
    phina.define('BreakScene', {
        superClass: 'DisplayScene',
        init: function (param) {
            this.superInit(conf.SCREEN);
            const label = Label({
                text: conf.BREAKING_MSG,
                fontSize: conf.FONT_SIZE,
            })
                .addChildTo(this)
                .setPosition(this.gridX.center(), this.gridY.center(-1));
            const btn = Button({
                text: 'START',
                fontSize: conf.FONT_SIZE,
                fill: conf.ENABLE_BUTTON_COLOR
            })
                .addChildTo(this)
                .setPosition(this.gridX.center(), this.gridY.center(2));
            btn.onpointstart = () => {
                btn.hide();
                Loading(8)
                    .addChildTo(this)
                    .setPosition(this.gridX.center(), this.gridY.center(2));
                label.text = 'パートナーが開始するのを待っています';
                param.mode = 2;
                this.exit(param);//to GameScene(game2)
                socket.emit('request game2');
            };
            socket.on('response game2', async () => { 
                // this.exit(param);//to GameScene(game2)
            });
        },
    });
    phina.define('Loading', {
        superClass: 'DisplayElement',
        init: function (circleNum) {
            this.superInit();
            const firstDeg = 360 / circleNum;
            const self = this;
            Array.range(0, 360, firstDeg).each((deg) => {
                const rad = Math.degToRad(deg); // 度をラジアンに変換
                const circle = CircleShape({ radius: conf.FONT_SIZE / 5, fill: conf.FONT_COLOR, }).addChildTo(self);
                circle.alpha = (deg + firstDeg) / 360;
                // 円周上に配置
                circle.x = Math.cos(rad) * 40;
                circle.y = Math.sin(rad) * 40;
            });
        },
        update: function () {
            this.rotation += 8;
        },
    });
}