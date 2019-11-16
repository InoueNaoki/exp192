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
    const userId = socket.id;　//現時点ではソケットIDで代用，いずれはCookieかユーザー記入式のIDで対応
    // socket.id = 'testtesttest';でID変更可能
    logger.info('[socket.io]' + socket.id + ' connected successfully');
    socket.emit('initial setting', conf.client);
    
    /* マッチメイキング　*/
    socket.on('join lobby', async () => {
        socket.join(conf.LOBBY_NAME); // 待機ロビーに入室
        logger.info('[socket.io]' + socket.id + ' joined lobby');

        const createPlayerRecord = await sqlQuery(`INSERT INTO players(user_id,socket_id) VALUES ("${userId}","${socket.id}");`);
        const playerId = createPlayerRecord['insertId'];

        const selectMinId = await sqlQuery(`SELECT MIN(id) FROM pairs WHERE guest_id IS NULL;`);
        const mostWaitingPairId = selectMinId[0]['MIN(id)'];

        if (!mostWaitingPairId) { 
            // await sqlQuery(`INSERT INTO pairs(host_id) VALUES ("${currentsocket.id}");`);
            const createPairRecord = await sqlQuery(`INSERT INTO pairs(host_id) VALUES ("${socket.id}");`);
            pairId = createPairRecord['insertId'];
            console.log(playerId+' is host of room'+pairId);
            isHost = true;
            socket.join(pairId);
            socket.leave(conf.LOBBY_NAME);
        } else {
            await sqlQuery(`UPDATE pairs SET guest_id = "${socket.id}" WHERE id = "${mostWaitingPairId}";`);
            pairId = mostWaitingPairId;
            console.log(playerId + ' is guest of room' + pairId);
            isHost = false;
            socket.join(pairId);
            socket.leave(conf.LOBBY_NAME);
            const objNum = 3;
            const initPosi = createInitPosi(9, objNum);
            // console.log(initPosi);
            // console.log(getVisibleArr(initPosi, true));
            socket.emit('complete matchmake', pairId, initPosi);//ゲストが入ったらマッチング完了なのでゲスト側のクライアントにそう伝える
            socket.broadcast.to(pairId).emit('complete matchmake', pairId, initPosi);//ホストクライアントにもマッチング完了を伝える
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

// const coordArr1d = [...Array(cellNum).keys()];

// function getPairId(currentsocket.id) {
//     sqlQuery()
// }

function createInitPosi(cellNum, objNum) {
    let seq = [...Array(cellNum).keys()];
    seq = shuffle(seq);
    return seq.slice(0, objNum);
}

// function convertFrom2dTo1d(x, y) {
//     return conf.client.CELL_NUM_Y * y + x // ex.(0,0)–(2,2)→0–9
// }

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
function isSameCel(fromCoord, toCoord) {
    if (fromCoord === toCoord) return true;
    else return false;
}
function isAdjacentCel(fromCoord, toCoord) {
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

// function isAdjacent2d(from2d, to2d) {
//     //Y軸方向に隣接(or一致)
//     if (from2d[1] === to2d[1] && Math.abs(from2d[0] - to2d[0]) <= 1) {
//         return true;
//     }
//     //X軸方向に隣接(or一致)
//     else if (from2d[0] === to2d[0] && Math.abs(from2d[1] - to2d[1]) <= 1) {
//         return true;
//     } else {
//         return false;
//     }
// }

function getVisibleArr(posiArr, isHost) {
    // let reward = posiArr[0];
    // let host = posiArr[1];
    // let guest = posiArr[2];
    // if (isHost) {
    //     reward = isAdjacent(host, reward) ? reward : false;
    //     guest = isAdjacent(host, guest) ? guest : false;
    // } else {
    //     reward = isAdjacent(guest, reward) ? reward : false;
    //     host = isAdjacent(guest, host) ? host : false;
    // }
    // return [reward, host, guest];
}
