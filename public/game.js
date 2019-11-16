//モバイルからアクセスがあった場合アクセス拒否
if (UAParser().device.type === 'mobile') {
    alert('PCからアクセスしてください');
    location.replace('http://Google.com');//戻るURL指定
}

// Chrome以外から閲覧されている場合アクセス拒否
if (UAParser().browser.name !== 'Chrome') {
    alert('ブラウザをChromeに変更してください');
    location.replace('http://Google.com');//戻るURL指定
}

// window.onbeforeunload = (e) => {
//     e.preventDefault();// Cancel the event as stated by the standard.
//     e.returnValue = '';// Chrome requires returnValue to be set.
// }

// phina.js をグローバル領域に展開
phina.globalize();

const socket = io();
let playerId;
socket.on('connect', () => {
    playerId = socket.id;
    console.log('You are '+playerId);
});

// let conf;
socket.on('initial setting', (initSetting) => {
    const conf = initSetting;
    let currentShapeIndex = 0;
    // const initialPosition = [].range(conf.CELL_NUM_X * conf.CELL_NUM_Y).shuffle().slice(-3); //0=player1,1=player2,3=reward
    const shapeList = conf.SHAPE_LIST.shuffle(); //図形の出現順によるバイアスをなくすためにシャッフル

    

    

    // メイン処理
    phina.main(() => {
        // アプリケーション生成
        const app = GameApp({
            startLabel: 'startScene', // メインシーンから開始する
            width: conf.SCREEN_WIDTH,
            height: conf.SCREEN_HEIGHT,
            // シーンのリストを引数で渡す
            scenes: [
                {
                    className: 'StartScene',
                    label: 'startScene',
                    nextLabel: 'matchmakingScene',
                },
                {
                    className: 'MatchmakingScene',
                    label: 'matchmakingScene',
                    nextLabel: 'mainScene',
                },
                {
                    className: 'MainScene',
                    label: 'mainScene',
                },
            ],
        });
        // アプリケーション実行
        app.run();
    });
    function wait(sec) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, sec * 1000);
            //setTimeout(() => {reject(new Error("エラー！"))}, sec*1000);
        });
    };

    function convertFrom2dTo1d(x, y) {
        return conf.CELL_NUM_Y * y + x // ex.(0,0)–(2,2)→0–9
    }
});
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
// const zWALL_COLOR = 'black';