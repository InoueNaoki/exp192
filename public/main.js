import conf from './config.js';
import browserOpe from './browser-operation.js';
import startScene from './scene-start.js';
import matchmakingScene from './scene-matchmaking.js';
import gameScene from './scene-game.js';
import breakScene from './scene-break.js';

browserOpe(UAParser);//ユーザーのゲーム実施環境(ブラウザ)に関する初期設定

phina.globalize();// phina.js をグローバル領域に展開

// メイン処理
phina.main(() => {
    const app = GameApp({
        startLabel: 'start',
        width: conf.SCREEN.width,
        height: conf.SCREEN.height,
        scenes: [
            {
                label: 'start',
                className: 'StartScene',
            },
            {
                label: 'matchmaking',
                className: 'MatchmakingScene',
                nextLabel: 'game',
            },
            {
                label: 'game',
                className: 'GameScene',
                nextLabel: 'break',
            },
            {
                label: 'break',
                className: 'BreakScene',
            },
            {
                label: 'questionnaire',
                className: 'QuestionnaireScene',
                nextLabel: 'thanks',
            },
            {
                label: 'thanks',
                className: 'ThanksScene',
            },
        ]     
    });
    app.run(); // アプリケーション実行
});

startScene(phina, conf);
const socket = io();
// socket.on('connect', () => {console.log('You are '+socket.id)});
matchmakingScene(phina, conf, socket);
gameScene(phina, conf, socket);
breakScene(phina, conf, socket);