import conf from './config.js';
import browserOpe from './browser-operation.js';
import startScene from './scene-start.js';
import matchmakingScene from './scene-matchmaking.js';
import assignmentScene from './scene-assignment.js';
import messagingScene from './scene-messaging.js';
import shiftingScene from './scene-shifting.js';

browserOpe(UAParser);//ユーザーのゲーム実施環境(ブラウザ)に関する初期設定

phina.globalize();// phina.js をグローバル領域に展開

// メイン処理
phina.main(() => {
    const app = GameApp({
        startLabel: 'start',
        width: conf.SCREEN_WIDTH,
        height: conf.SCREEN_HEIGHT,
        scenes: [
            {
                label: "start",
                className: "StartScene",
                nextLabel: "matchmaking"
            },
            {
                label: "matchmaking",
                className: "MatchmakingScene",
                nextLabel: "assignment"
            },
            {
                label: "assignment",
                className: "AssignmentScene",
                nextLabel: "messaging"
            },
            {
                label: "messaging",
                className: "MessagingScene",
                nextLabel: "shifting"
            },
            {
                label: "shifting",
                className: "ShiftingScene",
                nextLabel: "assignment"
            },
            {
                label: "thanks",
                className: "ThanksScene",
            },
            {
                label: "tutorial",
                className: "TutorialScene",
            },
        ]     
    });
    app.run(); // アプリケーション実行
});

startScene(phina, conf);
const socket = io();
// socket.on('connect', () => {console.log('You are '+socket.id)});
matchmakingScene(phina, conf, socket);
// assignmentScene(phina, conf, socket);