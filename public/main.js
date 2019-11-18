import conf from './config.js';
import browserOpe from './browser-operation.js';
import startScene from './phina-scene-start.js';
import matchmakingScene from './phina-scene-matchmaking.js';
import mainScene from './phina-scene-main.js';
browserOpe(UAParser);

phina.globalize();// phina.js をグローバル領域に展開

startScene(phina, conf);
const socket = io();
// socket.on('connect', () => {console.log('You are '+socket.id)});
matchmakingScene(phina, conf, socket);
mainScene(phina, conf, socket);

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
            }
        ]
    });
    // アプリケーション実行
    app.run();
});