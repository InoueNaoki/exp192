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

// const lobbyConnected = io.sockets.adapter.rooms[LOBBY_NAME];//ここにオブジェクト形式で接続中の"すべての"クライアントの情報入ってる

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
    let pairId;
    const currentSocketId = socket.id;
    const userId = currentSocketId;　//現時点ではソケットIDで代用，いずれはCookieかユーザー記入式のIDで対応
    logger.info('[socket.io]' + currentSocketId + ' connected successfully');
    socket.emit('initial setting', conf.client);
    
    /* マッチメイキング　*/
    socket.on('join lobby', async () => {
        socket.join(LOBBY_NAME); // 待機ロビーに入室
        logger.info('[socket.io]' + currentSocketId + ' joined lobby');
        

        const createPlayerRecord = await sqlQuery(`INSERT INTO players(user_id,current_socket_id) VALUES ("${userId}","${currentSocketId}");`);
        const playerId = createPlayerRecord['insertId'];

        const selectMinId = await sqlQuery(`SELECT MIN(id) FROM pairs WHERE guest_id IS NULL;`);
        const mostWaitingPairId = selectMinId[0]['MIN(id)'];

        if (!mostWaitingPairId) { 
            const createPairRecord = await sqlQuery(`INSERT INTO pairs(host_id) VALUES ("${currentSocketId}");`);
            pairId = createPairRecord['insertId'];
            console.log(playerId+' is host of room'+pairId);
            isHost = true;
            socket.join(pairId);
        } else {
            await sqlQuery(`UPDATE pairs SET guest_id = "${currentSocketId}" WHERE id = "${mostWaitingPairId}";`);
            pairId = mostWaitingPairId;
            console.log(playerId + ' is guest of room' + pairId);
            isHost = false;
            await socket.join(pairId);
            const initPosi = createInitPosi(conf.client.CELL_NUM_X * conf.client.CELL_NUM_Y, 3);
            socket.emit('complete matchmake', pairId, initPosi);//ゲストが入ったらマッチング完了なのでゲスト側のクライアントにそう伝える
            socket.broadcast.to(pairId).emit('complete matchmake', pairId, initPosi);//ホストクライアントにもマッチング完了を伝える
        }
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

function createInitPosi(cellNum,objNum) {
    const seq = [...Array(cellNum).keys()];
    for (let i = cellNum - 1; i >= 0; i--) {
        const rand = Math.floor(Math.random() * (i + 1)); // 0~iのランダムな数値を取得
        [seq[i], seq[rand]] = [seq[rand], seq[i]] // 配列の数値を入れ替える
    }
    return seq.slice(0, objNum);
}

function getPairId(currentSocketId) {
    sqlQuery()
}

// const seq = [...Array(result.length)].map((_, i) => i); //pythonでいうrange(result.length)
// const result_arr = seq.map(i => result[i][column]); //複数列返り値があるとうまくいかない