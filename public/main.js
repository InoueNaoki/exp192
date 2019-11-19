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
                label: 'start',
                className: 'StartScene',
                nextLabel: 'experimentMode'
            },
            {
                label: 'experimentMode',
                className: 'ExperimentModeSequence',
                arguments: { index: '2' },
                nextLabel: 'thanks'
            },
            {
                label: 'thanks',
                className: 'ThanksScene',
                nextlabel: 'start',
            },
        ]
        // scenes: [
        //     {
        //         className: 'StartScene',
        //         label: 'start',
        //         nextLabel: 'matchmaking',
        //     },
        //     {
        //         className: 'MatchmakingScene',
        //         label: 'matchmaking',
        //         nextLabel: 'assignment',
        //     },
        //     {
        //         className: 'AssignmentScene',
        //         label: 'assignment',
        //     }
        // ]
    });
    app.run(); // アプリケーション実行
});

// phina.define('MainSequence', {
//     superClass: 'ManagerScene',
//     init: function () {
//         this.superInit({
//             startLabel: 'start',
//             scenes: [
//                 {
//                     label: 'start',
//                     className: 'StartScene',
//                     nextLabel: 'experimentMode'
//                 },
//                 {
//                     label: 'experimentMode',
//                     className: 'ExperimentModeSequence',
//                     arguments: { index: '2' },
//                     nextLabel: 'thanks'
//                 },
//                 {
//                     label: 'thanks',
//                     className: 'ThanksScene',
//                     nextlabel: 'start',
//                 },
//             ]
//         });
//     }
// });

phina.define('ExperimentModeSequence', {
    superClass: 'ManagerScene',
    init: function (params) {
        this.superInit({
            startLabel: 'matchmaking',
            scenes: [
                {
                    label: 'matchmaking',
                    className: 'MatchmakingScene',
                    nextLabel: 'assignment'
                },
                {
                    label: 'assignment',
                    className: 'AssignmentScene',
                    arguments: { message: params.index + '-b' },
                    nextLabel: 'messaging'
                },
                {
                    label: 'messaging',
                    className: 'MessagingScene',
                    arguments: { message: params.index + '-c' },
                    nextLabel: 'shifting'
                },
                {
                    label: 'shifting',
                    className: 'ShiftingScene',
                    arguments: { message: params.index + '-d' },
                    nextLabel: 'assignment'
                },
            ]
        });
    },
    onfinish: function () {
        this.exit();
    }
});


startScene(phina, conf);
const socket = io();
// socket.on('connect', () => {console.log('You are '+socket.id)});
matchmakingScene(phina, conf, socket);
// assignmentScene(phina, conf, socket);