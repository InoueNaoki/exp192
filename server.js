const conf = require('config');
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

const LOBBY_NAME = conf.lobbyName;

/**
 * ペア(部屋)名=socketioのルームid
 * @type {String}
 */
let pairId;

let isHost;

/*　mysql初期設定　*/
const mysql = require('mysql');
const dbConfig = conf.mysql;

/* ファイル読み込み */
app.get('/', (req, res)=> {
    res.sendFile(__dirname + '/client.html');
});
app.get('/game.js', (req, res)=> {
    res.sendFile(__dirname + '/game.js');
});

/* socket.io接続 */
io.on('connection', (socket) => {
    const currentSocketId = socket.id;
    const cookieId = currentSocketId;　//現時点ではソケットIDで代用，いずれはCookieかユーザー記入式のIDで対応
    logger.info('[socket.io]' + currentSocketId + ' connected successfully');
    
    /* マッチメイキング　*/
    socket.on('join lobby', async () => {
        socket.join(LOBBY_NAME); // 待機ロビーに入室
        logger.info('[socket.io]' + currentSocketId + ' joined lobby');

        const createPlayerRecord = await sqlQuery(`INSERT INTO players(cookie_id,current_socket_id) VALUES ("${cookieId}","${currentSocketId}");`);
        const playerId = createPlayerRecord['insertId'];

        const selectMinId = await sqlQuery(`SELECT MIN(id) FROM pairs WHERE guest_id IS NULL;`);
        const mostWaitingPairId = selectMinId[0]['MIN(id)'];

        if (!mostWaitingPairId) { 
            const createPairRecord = await sqlQuery(`INSERT INTO pairs(host_id) VALUES ("${currentSocketId}");`);
            pairId = createPairRecord['insertId'];
            console.log(playerId+' is host of room'+pairId);
            isHost = true;
        } else {
            await sqlQuery(`UPDATE pairs SET guest_id = "${currentSocketId}" WHERE id = "${mostWaitingPairId}";`);
            pairId = mostWaitingPairId;
            console.log(playerId + ' is guest of room' + pairId);
            isHost = false;
        }
        // const lobbyConnected = io.sockets.adapter.rooms[LOBBY_NAME];//ここにオブジェクト形式で接続中の"すべての"クライアントの情報入ってる
        // roomId = 'room' + (Math.ceil(lobbyConnected.length / 2) - 1);
        // await async function(){
        //     console.log('ここにいる');

        socket.join(pairId);
        io.emit('join room', pairId);
        // }
    });

    /* メッセージ送信　*/
    socket.on('send message', (msg) => {
        socket.broadcast.to(pairId).emit('new message', msg);
        logger.debug(currentSocketId+'send msg to '+pairId+': ' + msg);
    });

    /* ソケット切断時の処理 */
    socket.on('disconnect', () => {
        logger.info('[socket.io]' + currentSocketId + ' disconnected');
        // const columnName = isHost ? 'host_id' : 'guest_id';
        // sqlQuery(`UPDATE pairs SET ${columnName} = NULL WHERE id = ${pairId};`);
        // これだとpairIdやcurrentSocketIdが最後に通信を始めたプレーヤーのものになってしまう
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

/**
 * MySQLにSQL文を投げる関数
 * @param {String} sqlStatement SQL文 
 */
async function sqlQuery(sqlStatement) {
    logger.trace('[mysql]' + sqlStatement);//投げられた文をトレース
    const pool = mysql.createPool(dbConfig);
    pool.query = util.promisify(pool.query);
    try {
        const result = await pool.query(sqlStatement);
        logger.trace('[mysql]' + JSON.stringify(result)); //実行結果を返す．そのまま連結すると中身が見れなくなるのでJSON.stringify()を使用
        pool.end();
        return result;
    } catch (err) {
        throw logger.error(err);
    }
}

// const seq = [...Array(result.length)].map((_, i) => i); //pythonでいうrange(result.length)
// const result_arr = seq.map(i => result[i][column]); //複数列返り値があるとうまくいかない
