export default function () {
    phina.define('MatchmakingScene', {
        superClass: 'DisplayScene',
        init: function (option) {
            // 親クラス初期化
            this.superInit(option);
            this.backgroundColor = conf.BACKGROUND_COLOR;
            const label = Label({
                text: 'マッチング中......\nブラウザを閉じないでください',
                fontSize: conf.FONT_SIZE,
            }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(-1));
            // label.tweener.wait(1000).fadeOut(1000).wait(500).fadeIn(1000).setLoop(true).play(); //呼吸アニメーション
            const loading = Loading(8).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(+1));
            const self = this;
            socket.emit('join lobby');
            socket.on('complete matchmake', async (pairId, initPosi) => {
                console.log(pairId + 'のマッチングが完了');
                label.text = conf.COMPLETE_MATCHMAKE_MSG;
                label.fill = 'seagreen';
                loading.remove();
                await wait(1);
                console.log({ initPosi: initPosi });
                self.exit({ initPosi: initPosi, });// to MainScene
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