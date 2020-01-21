import conf from './config.js';
import browserOpe from './browser-operation.js';
import startScene from './scene-start.js';
import matchmakingScene from './scene-matchmaking.js';
import gameScene from './scene-game.js';
import breakScene from './scene-break.js';
import questionnaireScene from './scene-questionnaire.js';

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
            },
            {
                label: 'break',
                className: 'BreakScene',
                nextLabel: 'game',
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
const socket = io.connect('localhost:3000');
matchmakingScene(phina, conf, socket);
gameScene(phina, conf, socket);
breakScene(phina, conf, socket);
questionnaireScene(phina, conf, socket);