/* express初期設定 */
const app = require('express')();
const http = require('http').createServer(app);
const port = process.env.PORT || 3000;
const ip = '127.0.0.1';

const util = require('util');

/* log4js初期設定 */
const log4js = require('log4js')
// コンソール出力用
const logger = log4js.getLogger();
logger.level = 'trace';
// ログファイル出力用
// log4js.configure({
//     appenders: {
//         system: { type: 'file', filename: 'system.log' },
//     },
//     categories: {
//         default: { appenders: ['system'], level: 'trace' },
//     }
// });
// const logger = log4js.getLogger('system');

/* socket.io初期設定 */
const io = require('socket.io')(http);
/**
 * 待機ロビー名(socketioのルーム名)
 * @type {String}
 */
const LOBBY_NAME = 'lobby';
/**
 * 対戦部屋名(socketioのルーム名)
 * @type {String}
 */
let roomId;

/*　mysql初期設定　*/
const mysql = require('mysql');
const dbConfig = {
    host: 'localhost', //接続先ホスト
    user: 'exp192_user',      //ユーザー名
    password: 'acml2016',          //パスワード
    database: 'exp192'       //DB名
};

//mysql接続
// const connection = mysql.createConnection(dbConfig);
// connection.connect((err) => {
//     if (err) {
//         logger.error(err);
//     };
//     logger.info('[mysql]connected successfully');
// });

/* ファイル読み込み */
app.get('/', (req, res)=> {
    res.sendFile(__dirname + '/client.html');
});
app.get('/game.js', (req, res)=> {
    res.sendFile(__dirname + '/game.js');
});

/* socket.io接続 */
io.on('connection', (socket) => {
    const socketId = socket.id;
    logger.info('[socket.io]' + socketId + ' connected successfully');
    
    /* マッチメイキング　*/
    socket.on('join lobby', async () => {
        socket.join(LOBBY_NAME); // 待機ロビーに入室
        logger.info('[socket.io]' + socketId + ' joined lobby');

        const uniqueUserId = socketId;　//ユニークユーザーのID，現時点ではソケットIDで代用，いずれはキャッシュかユーザー記入式のIDで対応

        const sqlResult1 = await sqlQuery(`INSERT INTO players(socket_id) VALUES ("${socketId}");`);
        const playerId = sqlResult1['insertId'];

        // const sqlResult2 = await sqlQuery(`SELECT EXISTS(SELECT * FROM pairs);`);
        // const pairsTableExists = sqlResult2[0]['EXISTS(SELECT * FROM pairs)'];

        const sqlResult4 = await sqlQuery(`select MIN(id) from pairs WHERE guest_id IS NULL;`);
        const mostWaitingPairId = sqlResult4[0]['MIN(id)'];

        let isHost;
        if (!mostWaitingPairId) { 
            const sqlResult3 = await sqlQuery(`INSERT INTO pairs(host_id) VALUES ("${playerId}");`);
            const pairId = sqlResult3['insertId'];
            console.log(pairId + 'のほすとになるよ' + playerId);
            isHost = true;
        } else {
            const sqlResult5 = await sqlQuery(`UPDATE pairs SET guest_id = "${playerId}" WHERE id = "${mostWaitingPairId}";`);
            const pairId = sqlResult5['insertId'];
            console.log(pairId + 'のげすとになるよ' + playerId);
            isHost = false;
        }
        const lobbyConnected = io.sockets.adapter.rooms[LOBBY_NAME];//ここにオブジェクト形式で接続中の"すべての"クライアントの情報入ってる
        // roomId = 'room' + (Math.ceil(lobbyConnected.length / 2) - 1);
        await async function(){
            console.log('ここにいる');
            await socket.join(pairId);
            await io.emit('join room', pairId);
        }
    });

    /* メッセージ送信　*/
    socket.on('send message', (msg) => {
        socket.broadcast.to(roomId).emit('new message', msg);
        logger.debug(socketId+'send msg to '+roomId+': ' + msg);
    });

    /* ソケット切断時の処理 */
    socket.on('disconnect', ()=> {
        logger.info('[socket.io]'+socketId+' disconnected');
    });
});

http.listen(port, ip, () => {
    logger.info('[nodejs]port:' + port);
    logger.info('[nodejs]ip:' + ip);
});

// /**
//  * クエリ実行結果を返すためのコールバック（returnが使えなかったので）
//  * @callback queryExecutionResult
//  * @param {Object} result オブジェクト形式のSQLクエリ実行結果
//  */
// /**
//  * MySQLにクエリを投げるための関数
//  * @param {String} sqlStatement SQLのクエリ文
//  * @param {queryExecutionResult} callback 実行結果のコールバック
//  */
// function sqlQuery(sqlStatement, callback = () => { }) {//callbackがいらないときデフォルト値として何もしない
//     logger.trace('[mysql]' + sqlStatement);//投げられたクエリ分をトレース
//     connection.query(sqlStatement, (err, result) => {
//         if (err) logger.error(err);
//         else {
//             logger.trace('[mysql]' + JSON.stringify(result)); //そのまま連結すると中身が見れなくなるのでJSON.stringify()を使用
//             callback(result);//resultはオブジェクト形式
//         }
//     });
// }

async function sqlQuery(sqlStatement) {
    const pool = mysql.createPool(dbConfig);
    pool.query = util.promisify(pool.query);
    try {
        const result = await pool.query(sqlStatement);
        pool.end();
        return result;
    } catch (err) {
        throw new Error(err)
    }
}

// const seq = [...Array(result.length)].map((_, i) => i); //pythonでいうrange(result.length)
// const result_arr = seq.map(i => result[i][column]); //複数列返り値があるとうまくいかない
