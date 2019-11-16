phina.define('Player', {
    superClass: 'CircleShape',
    init: function (isSelf) {
        const playerColor = isSelf ? 'skyblue' : 'orange';
        this.superInit({
            radius: conf.CELL_SIZE / 2 * 0.5,
            fill: playerColor,
            strokeWidth: false,
        });
    },
});

// ゲーム盤クラス
phina.define('Board', {
    superClass: 'DisplayElement',
    init: function (initPosi) {
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
                // X軸方向の通路
                if (spanX == 0) {
                    isLeft = false;
                    isRight = true;
                } else if (spanX == conf.CELL_NUM_X - 1) {
                    isLeft = true;
                    isRight = false;
                } else {
                    isLeft = true;
                    isRight = true;
                }
                // Y軸方向の通路
                if (spanY == 0) {
                    isTop = false;
                    isBottom = true;
                } else if (spanY == conf.CELL_NUM_Y - 1) {
                    isTop = true;
                    isBottom = false;
                } else {
                    isTop = true;
                    isBottom = true;
                }
                const cell = Cell(isTop, isBottom, isLeft, isRight).addChildTo(this).setPosition(boardGridX.span(spanX), boardGridY.span(spanY));
                cell.setInteractive(true);
                cell.onpointstart = () => {
                    console.log('clicked(' + spanX + ',' + spanY + ')' + this);
                };
                const coord = convertFrom2dTo1d(spanX, spanY);
                const self = this;
                switch (coord) {
                    case initPosi[0]:
                        StarShape({ radius: conf.CELL_SIZE * 0.4, stroke: false, fill: 'gold' }).addChildTo(self).setPosition(boardGridX.span(spanX), boardGridY.span(spanY));
                        break;
                    case initPosi[1]:
                        Player(true).addChildTo(self).setPosition(boardGridX.span(spanX), boardGridY.span(spanY));
                        break;
                    case initPosi[2]:
                        Player(false).addChildTo(self).setPosition(boardGridX.span(spanX), boardGridY.span(spanY));
                        break;
                    default:
                        break;
                }
                // cell.fill = 'linen';
            });
        });
    },
});

// 通路クラス
phina.define('Aisle', {
    superClass: 'RectangleShape',
    init: function (angle) {
        this.superInit({
            width: conf.WALL_WIDTH,// +1しないとstroke: falseしても謎の枠が出る
            height: conf.CELL_SIZE / 2, //道幅
            fill: conf.CELL_COLOR,
            stroke: false,
            rotation: angle,
        });
    },
});

// 部屋クラス
phina.define('Cell', {
    superClass: 'RectangleShape',
    init: function (isTop, isBottom, isLeft, isRight) {
        this.superInit({
            width: conf.CELL_SIZE,
            height: conf.CELL_SIZE,
            fill: conf.CELL_COLOR,
            stroke: conf.WALL_COLOR,
            strokeWidth: conf.WALL_WIDTH,
        });
        if (isTop) Aisle(90).addChildTo(this).setPosition(0, -conf.CELL_SIZE / 2);
        if (isBottom) Aisle(90).addChildTo(this).setPosition(0, conf.CELL_SIZE / 2);
        if (isLeft) Aisle(0).addChildTo(this).setPosition(-conf.CELL_SIZE / 2, 0);
        if (isRight) Aisle(0).addChildTo(this).setPosition(conf.CELL_SIZE / 2, 0);
    },
});