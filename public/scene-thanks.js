export default (phina, conf) => { 
    phina.define('ThanksScene', {
        superClass: 'DisplayScene',
        init: function () {
            this.superInit({
                backgroundColor: 'pink'
            });
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
                    this.exit();//to MainScene
                };
        },
    });
}