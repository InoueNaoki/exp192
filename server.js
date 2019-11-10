const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const ip = '127.0.0.1';

const log4js = require('log4js')

/*　コンソール出力用 */
const logger = log4js.getLogger();
logger.level = 'trace';

/*　ログファイル出力用 */
// log4js.configure({
//     appenders: {
//         system: { type: 'file', filename: 'system.log' },
//     },
//     categories: {
//         default: { appenders: ['system'], level: 'trace' },
//     }
// });
// const logger = log4js.getLogger('system');

const LOBBY_NAME = 'lobby';
let roomId;

//mysqlモジュールを呼び出します
const mysql = require('mysql');
//DBの定義
const dbConfig = {
    host: 'localhost', //接続先ホスト
    user: 'exp192_user',      //ユーザー名
    password: 'acml2016',          //パスワード
    database: 'exp192'       //DB名
};
const connection = mysql.createConnection(dbConfig);
connection.connect((err) => {
    if (err) {
        logger.error(err);
    };
    logger.info('[mysql]connected successfully');
});

app.get('/', (req, res)=> {
    res.sendFile(__dirname + '/client.html');
});
app.get('/game.js', (req, res)=> {
    res.sendFile(__dirname + '/game.js');
});

io.on('connection', (socket) => {
    const socketId = socket.id;
    logger.info('[socket.io]' + socketId+' connected successfully');
    //クエリ文
    socket.on('join lobby', () => {
        logger.info('[socket.io]' + socketId +' joined lobby');
        socket.join(LOBBY_NAME);
        const uniqueUserId = socketId;　//ユニークユーザーのID，現時点ではソケットIDで代用，いずれはキャッシュかユーザー記入式のIDで対応
        sqlQuery(`INSERT INTO players(socket_id) VALUES ("${socketId}");`);

        // insert('pairs', 'host_id', 1);
        let pairsTableExists;
        sqlQuery(`SELECT EXISTS(SELECT * FROM pairs);`, (result) => {
            if (!result[0]["EXISTS(SELECT * FROM pairs)"]) {
                sqlQuery(`INSERT INTO pairs(host_id) VALUES ("${playersのあいでぃー}");`);
            };
        });
        // if (tableList.length == 0) {
        //     //最初のユーザー
        //     tableList.push({ id: 0, host: playerId });
        // }
        // const lastTable = tableList[tableList.length - 1];
        // if (!('guest' in lastTable)) {
        //     lastTable.guest = playerId;
        // } else {
        //     tableList.push({ id: tableList.length, host: playerId });
        // }
        // process.stdout.write('tableList = ');
        // console.log(tableList);
        // socket.join(lastTable.id);
        const lobbyConnected = io.sockets.adapter.rooms[LOBBY_NAME];//ここにオブジェクト形式で接続中の"すべての"クライアントの情報入ってる
        roomId = 'room' + (Math.ceil(lobbyConnected.length / 2) - 1);
        socket.join(roomId);
        io.emit('join room', roomId);
    });
    socket.on('send message', (msg) => {
        socket.broadcast.to(roomId).emit('new message', msg);
        logger.debug(socketId+'send msg to '+roomId+': ' + msg);
    });
    // console.log('-------------------------------------------------------------------------');
    // console.log("部屋番号は" + roomId);
    // console.log(io.sockets.adapter.rooms[roomId]);

    socket.on('disconnect', ()=> {
        logger.info('[socket.io]'+socketId+' disconnected');
    });
});

http.listen(port, ip, () => {
    logger.info('[nodejs]port:' + port);
    logger.info('[nodejs]ip:' + ip);
});

function sqlQuery(sqlStatement, callback = () => { }) {//callbackがいらないときデフォルト値として何もしない
    logger.trace('[mysql]' + sqlStatement);//投げられたクエリ分をトレース
    connection.query(sqlStatement, (err, result) => {
        if (err) logger.error(err);
        else {
            logger.trace('[mysql]' + JSON.stringify(result));//
            callback(result);//resultはオブジェクト形式
        }
    });s
}
        // const seq = [...Array(result.length)].map((_, i) => i); //pythonでいうrange(result.length)
        // const result_arr = seq.map(i => result[i][column]); //複数列返り値があるとうまくいかない
