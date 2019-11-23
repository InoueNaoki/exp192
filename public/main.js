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
        width: conf.SCREEN.width,
        height: conf.SCREEN.height,
        scenes: [
            {
                label: "start",
                className: "StartScene",
            },
            {
                label: "matchmaking",
                className: "MatchmakingScene",
                nextLabel: "experimentMode",
                arguments: { gameMode: 1 },
            },
            {
                label: "experimentMode",
                className: "ExperimentModeSequence",
                nextLabel: "break",
            },
            {
                label: "break",
                className: "BreakScene",
            },
            {
                label: "questionnaire",
                className: "QuestionnaireScene",
                nextLabel: "thanks",
            },
            {
                label: "thanks",
                className: "ThanksScene",
            },
        ]     
    });
    app.run(); // アプリケーション実行
});

phina.define('ExperimentModeSequence', {
    superClass: 'ManagerScene',
    init: function (param) {
        this.superInit({
            startLabel: "assignment",
            scenes: [
                {
                    label: "assignment",
                    className: "AssignmentScene",
                    nextLabel: "messaging",
                    arguments: param
                },
                {
                    label: "messaging",
                    className: "MessagingScene",
                    nextLabel: "shifting",
                    arguments: param
                },
                {
                    label: "shifting",
                    className: "ShiftingScene",
                    nextLabel: "judgment",
                    arguments: param
                },
                {
                    label: "judgment",
                    className: "JudgmentScene",
                    arguments: param
                },
            ]
        });
        this.on('finish', () => {
            this.exit(param);
        });
    },
});

startScene(phina, conf);
const socket = io();
// socket.on('connect', () => {console.log('You are '+socket.id)});
matchmakingScene(phina, conf, socket);
assignmentScene(phina, conf, socket);