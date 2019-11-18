/* express初期設定 */
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const port = process.env.PORT || 3000;
const ip = '127.0.0.1';
const util = require('util');
const conf = require('config'); //サーバーサイド設定ファイル
/* ファイル読み込み */
app.use(express.static('public')); //クライアントサイド

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

// const lobbyConnected = io.sockets.adapter.rooms[LOBBY_NAME];//ここにオブジェクト形式で接続中の"すべての"クライアントの情報入ってる

/*　mysql初期設定　*/
const mysql = require('mysql');
const dbConfig = conf.mysql;

const CELL_NUM = 9;

/* socket.io接続 */
io.on('connection', (socket) => {
    let pairId;
    const userId = socket.id;　//現時点ではソケットIDで代用，いずれはCookieかユーザー記入式のIDで対応
    // socket.id = 'testtesttest';でID変更可能
    logger.info('[socket.io]' + socket.id + ' connected successfully');
    
    /* マッチメイキング　*/
    socket.on('join lobby', async () => {
        socket.join(conf.LOBBY_NAME); // 待機ロビーに入室
        logger.info('[socket.io]' + socket.id + ' joined lobby');
        const createPlayerRecord = await sqlQuery(`INSERT INTO players SET user_id = "${userId}", socket_id = "${socket.id}";`);
        const playerId = createPlayerRecord['insertId'];

        const selectMinId = await sqlQuery(`SELECT MIN(id) FROM pairs WHERE guest_id IS NULL;`);
        const mostWaitingPairId = selectMinId[0]['MIN(id)'];

        if (!mostWaitingPairId) { 
            // Host
            const createPairRecord = await sqlQuery(`INSERT INTO pairs SET host_id = "${socket.id}";`);
            await sqlQuery(`UPDATE players SET is_host = true WHERE socket_id = "${socket.id}";`);
            pairId = createPairRecord['insertId'];
            console.log(playerId+' is host of room'+pairId);
            isHost = true;
            socket.join(pairId);
            socket.leave(conf.LOBBY_NAME);
        } else {
            // Guest
            await sqlQuery(`UPDATE pairs SET guest_id = "${socket.id}" WHERE id = "${mostWaitingPairId}";`);
            await sqlQuery(`UPDATE players SET is_host = false WHERE socket_id = "${socket.id}";`);
            pairId = mostWaitingPairId;
            console.log(playerId + ' is guest of room' + pairId);
            isHost = false;
            socket.join(pairId);
            socket.leave(conf.LOBBY_NAME);
            const objNum = 3;
            const initPosi = createInitPosi(9, objNum);
            // console.log(initPosi);
            // console.log(getVisibleArr(initPosi, true));
            socket.emit('complete matchmake', pairId, getVisibleArr(initPosi, false));//ゲストが入ったらマッチング完了なのでゲスト側のクライアントにそう伝える
            socket.broadcast.to(pairId).emit('complete matchmake', pairId, getVisibleArr(initPosi, true));//ホスト(部屋全体)にもマッチング完了を伝える
        }
    });

    /* メッセージ送信　*/
    socket.on('send message', (msg) => {
        socket.broadcast.to(pairId).emit('new message', msg);
        logger.debug(socket.id+'send msg to '+pairId+': ' + msg);
    });

    /* ソケット切断時の処理 */
    socket.on('disconnect', () => {
        logger.info('[socket.io]' + socket.id + ' disconnected');
        // const columnName = isHost ? 'host_id' : 'guest_id';
        // sqlQuery(`UPDATE pairs SET ${columnName} = NULL WHERE id = ${pairId};`);
        // これだとpairIdやcurrentsocket.idが最後に通信を始めたプレーヤーのものになってしまう
    });
});

http.listen(port, ip, () => {
    logger.info('[nodejs]port:' + port);
    logger.info('[nodejs]ip:' + ip);
});

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

function isHost() {
    return sqlQuery.query(`SELECT is_host FROM players WHERE user_id = "${socket.id}" `)['is_host'];
}

function createInitPosi(cellNum, objNum) {
    let seq = [...Array(cellNum).keys()];
    seq = shuffle(seq);
    return seq.slice(0, objNum);
}

function shuffle(arr) {
    for (let i = arr.length - 1; i >= 0; i--) {
        const rand = Math.floor(Math.random() * (i + 1)); // 0~iのランダムな数値を取得
        [arr[i], arr[rand]] = [arr[rand], arr[i]] // 配列の数値を入れ替える
    }
    return arr;
}

// function create2dCoordArr(numX, numY) {
//     let coordArr = [];
//     [...Array(numX)].forEach((_, x) => {
//         [...Array(numY)].forEach((_, y) => {
//             coordArr.push([x, y]);
//         })
//     });
//     return coordArr;
// }
function isSameCell(fromCoord, toCoord) {
    if (fromCoord === toCoord) return true;
    else return false;
}
function isAdjacentCell(fromCoord, toCoord) {
    switch (fromCoord % conf.CELL_NUM_X) {
        case 0: //左端の列
            if (fromCoord + 1 === toCoord) return true; //左端の列で右にtoCoordがあるとき
        case conf.CELL_NUM_X - 1: //右端の列
            if (fromCoord - 1 === toCoord) return true; //右端の列で左にtoCoordがあるとき
        default: //端ではない列
            const absDiff = Math.abs(fromCoord - toCoord);
            if (absDiff === 3) return true; //Y軸方向に隣接してるとき
            if (absDiff === 1) return true; //他の列でX軸方向に隣接してるとき
            return false;
    }
}

function getVisibleArr(posiArr, isHost) {
    let reward = posiArr[0];
    let host = posiArr[1];
    let guest = posiArr[2];
    if (isHost) {
        reward = isAdjacentCell(host, reward) || isSameCell(host, reward) ? reward : false;
        guest = isAdjacentCell(host, guest) || isSameCell(host, guest) ? guest : false;
    } else {
        reward = isAdjacentCell(guest, reward) || isSameCell(guest, reward) ? reward : false;
        host = isAdjacentCell(guest, host) || isSameCell(guest, host) ? host : false;
    }
    return [reward, host, guest];
}

function getMovableArr(currentPosi) {
    return [...Array(CELL_NUM)].map((_, i) => {
        return isAdjacentCell(currentPosi, i) || isSameCell(currentPosi, i) ? true : false
    });
}