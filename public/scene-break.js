export default (phina, conf, socket) => {
    phina.define('BreakScene', {
        superClass: 'DisplayScene',
        init: function (staticParam) {
            console.log(staticParam);
            this.superInit(conf.SCREEN);
            Label({
                text: conf.BREAKING_MSG,
                fontSize: conf.FONT_SIZE,
            })
                .addChildTo(this)
                .setPosition(this.gridX.center(), this.gridY.center());
            // this.exit(param);// to placementScene
        },
    });
}