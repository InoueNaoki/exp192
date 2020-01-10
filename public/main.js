import conf from './config.js';
import browserOpe from './browser-operation.js';
import startScene from './scene-start.js';
import matchmakingScene from './scene-matchmaking.js';
import game1Scene from './scene-game1.js';
// import game2Scene from './scene-game2.js';
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
                nextLabel: 'game1',
            },
            {
                label: 'game1',
                className: 'Game1Scene',
                nextLabel: 'break',
            },
            {
                label: 'break',
                className: 'BreakScene',
                nextLabel: 'game2',
            },
            {
                label: 'game2',
                className: 'Game2Scene',
                nextLabel: 'questionnaire',
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
game1Scene(phina, conf, socket);
breakScene(phina, conf, socket);
// game2Scene(phina, conf, socket);