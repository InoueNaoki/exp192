export default {
    "CELL_COLOR": "white",
    "SCREEN": {
        "width": 1920,
        "height": 1080,
        "backgroundColor": "white"
    },
    "LIMIT_TIME": 60000*20,
    "MSG_NUM": 2,
    "MSG_FRAME_SIZE": 150,
    "ENABLE_BUTTON_COLOR": "skyblue",
    "DISABLE_BUTTON_COLOR": "lightgray",
    "SELF_COLOR": "skyblue",
    "PARTNER_COLOR": "orange",
    "FONT_COLOR": "black",
    "SHAPE_COLOR": "black",
    "FONT_SIZE": 48,
    "FONT_SIZE_S": 24,
    "CELL_NUM_X": 3,
    "CELL_NUM_Y": 3,
    "GRID_SIZE": 200,
    "CELL_SIZE": 200,
    "WALL_WIDTH": 10,
    "WALL_COLOR": "black",
    "notification": {
        'initial': '初期準備中...',
        'gettingReady': '準備中...',
        'waitPartner': '送信しました\n相手の選択を待っています',
        'pleaseExchange': '図形を選択し，送信してください',
        'undecidedShape': 'メッセージを全て入力してから送信してください',
        'receivedMessage': '相手からメッセージが届きました',
        'pleaseMove': '移動先を選択し，送信してください',
        'judging': '判定中...',
    },
    "MATCHMAKING_MSG": "マッチング中......\nブラウザを閉じないでください",
    "COMPLETE_MATCHMAKE_MSG": "マッチング成立！\nしばらくこのままお待ち下さい",
    "BREAKING_MSG": "お疲れさまでした．\n下のボタンを押してゲーム２を始めてください",
    "SHAPE_LIST": [
        { "id": 0, "name": "circle" },
        { "id": 1, "name": "triangle" },
        { "id": 2, "name": "square" },
        { "id": 3, "name": "hexagon" }
        // { "id": 4, "name": "diamond" },
        // { "id": 5, "name": "octagon" },
    ],
};