import conf from './config.js';
import browserOpe from './browser-operation.js';
import startScene from './scene-start.js';
import matchmakingScene from './scene-matchmaking.js';
import assignmentScene from './scene-assignment.js';
// import msgScene from './scene-msg.js/index.js.js';
// import shiftingScene from './scene-shifting.js/index.js.js';

browserOpe(UAParser);//ユーザーのゲーム実施環境(ブラウザ)に関する初期設定

phina.globalize();// phina.js をグローバル領域に展開

startScene(phina, conf);
const socket = io();
socket.on('connect', () => {console.log('You are '+socket.id)});
matchmakingScene(phina, conf, socket);
assignmentScene(phina, conf, socket);

// メイン処理
phina.main(() => {
    // アプリケーション生成
    const app = GameApp({
        startLabel: 'start', // メインシーンから開始する
        width: conf.SCREEN_WIDTH,
        height: conf.SCREEN_HEIGHT,
        // シーンのリストを引数で渡す
        scenes: [
            {
                className: 'StartScene',
                label: 'start',
                nextLabel: 'matchmaking',
            },
            {
                className: 'MatchmakingScene',
                label: 'matchmaking',
                nextLabel: 'assignment',
            },
            {
                className: 'AssignmentScene',
                label: 'assignment',
            }
        ]
    });
    // アプリケーション実行
    app.run();
});