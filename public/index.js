import startScene from './start-scene.js';
import matchmakingScene from './matchmaking-scene.js';
import mainScene from './main-scene.js';

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


phina.globalize();

const socket = io();
// socket.on('connect', () => {
//     console.log('You are ' + socket.id);
// });

// let conf;
socket.on('initial setting', (initSetting) => {
    const conf = initSetting;
    let currentShapeIndex = 0;
    // const initialPosition = [].range(conf.CELL_NUM_X * conf.CELL_NUM_Y).shuffle().slice(-3); //0=player1,1=player2,3=reward
    const shapeList = conf.SHAPE_LIST.shuffle(); //図形の出現順によるバイアスをなくすためにシャッフル

    startScene();
    matchmakingScene();
    mainScene();

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