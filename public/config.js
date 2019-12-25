export default {
    "CELL_COLOR": "white",
    "SCREEN": {
        "width": 1920,
        "height": 1080,
        "backgroundColor": "white"
    },
    "MSG_NUM": 2,
    "MSG_FRAME_SIZE": 150,
    "ENABLE_BUTTON_COLOR": "skyblue",
    "DISABLE_BUTTON_COLOR": "lightgray",
    "SELF_COLOR": "skyblue",
    "PARTNER_COLOR": "orange",
    "FONT_COLOR": "black",
    "SHAPE_COLOR": "black",
    "FONT_SIZE": 48,
    "CELL_NUM_X": 3,
    "CELL_NUM_Y": 3,
    "GRID_SIZE": 200,
    "CELL_SIZE": 200,
    "WALL_WIDTH": 10,
    "WALL_COLOR": "black",
    "notification": {
        'placing': '準備中...',
        'waitPartner': '送信しました\n相手の選択を待っています',
        'pleaseExchange': '図形を選択し，送信してください',
        'undecidedShape': 'メッセージを全て入力してから送信してください',
        'receivedMessage': '相手からメッセージが届きました',
        'pleaseMove': '移動先を選択し，送信してください',
        'judging': '判定中...',
    },
    "MATCHMAKING_MSG": "マッチング中......\nブラウザを閉じないでください",
    "COMPLETE_MATCHMAKE_MSG": "マッチング成立！\nしばらくこのままお待ち下さい",
    "SHAPE_LIST": [
        { "id": 0, "name": "circle" },
        { "id": 1, "name": "triangle" },
        { "id": 2, "name": "square" },
        { "id": 3, "name": "hexagon" },
        // { "id": 4, "name": "diamond" },
        // { "id": 5, "name": "octagon" },
    ],
    // "OPTION": {
    //     "height": this.SCREEN_HEIGHT,
    //     "width": this.SCREEN_WIDTH,
    // }
};
// const SCREEN_WIDTH = 1920; // 画面横サイズ
// const SCREEN_HEIGHT = 1080; // 画面縦サイズ
// const MSG_FRAME_SIZE = 150;
// const BACKGROUND_COLOR = 'white';
// const FONT_COLOR = 'black';
// const SHAPE_COLOR = 'black';
// const FONT_SIZE = 48;
// const CELL_NUM_X = 3; // 小部屋（マス目）のX軸方向の数
// const CELL_NUM_Y = 3; // 小部屋（マス目）のY軸方向の数
// const GRID_SIZE = 200; // グリッドのサイズ
// const CELL_SIZE = conf.GRID_SIZE; // パネルの大きさ
// const WALL_WIDTH = 10;
// const CELL_COLOR = BACKGROUND_COLOR;
// const WALL_COLOR = 'black';