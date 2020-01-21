export default (phina, conf, socket) => {
    phina.define('QuestionnaireScene', {
        superClass: 'DisplayScene',
        init: function (param) {
            console.log(param);
            this.superInit(conf.SCREEN);
            Label({
                text: conf.QUESTIONNAIRE_MSG,
                fontSize: conf.FONT_SIZE,
            })
                .addChildTo(this)
                .setPosition(this.gridX.center(), this.gridY.center());
            Button({
                text: '回答する',
                fontSize: conf.FONT_SIZE,
                fill: conf.ENABLE_BUTTON_COLOR
            })
                .addChildTo(this)
                .setPosition(this.gridX.center(), this.gridY.center(2))
                .onpointstart = () => {
                    window.open(`https://docs.google.com/forms/d/e/1FAIpQLSf6_6t37-p7Un9Zg9wTTCKim--zm9prQFwa8Epy-T0SW28xbg/viewform?usp=pp_url&entry.2048707448=${socket.id}`, '_blank');
                };
            // this.exit(param);// to placementScene
        },
    });
}
