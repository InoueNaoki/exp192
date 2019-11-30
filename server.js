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

/* socket.io接続 */
io.on('connection', (socket) => {
    // const userId = socket.id;　//現時点ではソケットIDで代用，いずれはCookieかユーザー記入式のIDで対応
    // socket.id = 'hoge'; //でID変更可能
    logger.info('[socket.io]' + socket.id + ' connected successfully');
    
    /* マッチメイキング　*/
    socket.on('join lobby', async () => {
        socket.join(conf.LOBBY_NAME); // 待機ロビーに入室
        logger.info('[socket.io]' + socket.id + ' joined lobby');
        await sqlQuery(`INSERT INTO players SET id = "${socket.id}";`);
        // const playerId = insertPlayerRecord['insertId'];
        // logger.info('[socket.io]' + socket.id + ' changed socket.id to ' + player.name);
        const selectMinId = await sqlQuery(`SELECT MIN(id) FROM pairs WHERE guest_id IS NULL;`);
        let pairId = selectMinId[0]['MIN(id)']; //mostWaitingPairId
        if (!pairId) { 
            // Hosts
            const insertPairRecord = await sqlQuery(`INSERT INTO pairs SET host_id = "${socket.id}";`);
            await sqlQuery(`UPDATE players SET is_host = true WHERE id = "${socket.id}";`);
            pairId = insertPairRecord['insertId'];
            logger.info('[game]' + socket.id + ' is host of room' + pairId);
            socket.join(pairId);
            socket.leave(conf.LOBBY_NAME);
        } else {
            // Guest
            await sqlQuery(`UPDATE pairs SET guest_id = "${socket.id}" WHERE id = "${pairId}";`);
            await sqlQuery(`UPDATE players SET is_host = false WHERE id = "${socket.id}";`);
            const selectHostId = await sqlQuery(`SELECT host_id FROM pairs WHERE id = "${pairId}";`);
            const hostId = selectHostId[0]['host_id'];
            logger.info('[game]' + socket.id + ' is guest of room' + pairId);
            logger.info('[game] pair' + pairId + ' matchmaking complete (host:' + hostId+', guest:'+socket.id+')')
            socket.join(pairId);
            socket.leave(conf.LOBBY_NAME);
            socket.to(hostId).emit('finish matchmaking', pairId, true, hostId, socket.id);//ホスト(部屋全体)にもマッチング完了を伝える
            socket.emit('finish matchmaking', pairId, false, hostId, socket.id);//ゲストが入ったらマッチング完了なのでゲスト側のクライアントにそう伝える
        }
    });

    /* assignmentフェーズ: Hostのみがrequest */
    socket.on('request assignment', async () => {
        const guestId = await getGuestId(socket.id);
        const initialPosArr = createInitPosArr(9);
        socket.emit('response assignment', getVisibleArr(initialPosArr, true), getMovableArr(initialPosArr[1]));　//ホストの部屋割当情報をホストクライアントに送信
        socket.to(guestId).emit('response assignment', getVisibleArr(initialPosArr, false), getMovableArr(initialPosArr[2])); //ゲストの部屋割当情報をゲストクライアントに送信
        logger.info('[game]pair('+socket.id + ', ' + guestId + ') were assigned ' + initialPosArr);
    });

    /* messagingフェーズ: お互いが任意の時間にrequest　*/
    socket.on('request messaging', async (msg) => {
        const pairId = await getPairId(socket.id);
        // const partnerId = await getPartnerId(socket.id);
        socket.broadcast.to(pairId).emit('response messaging', msg);
        logger.info('[game]' + socket.id + ' send message ' + JSON.stringify(msg) + ' at room' + pairId);
        await updateStatus(pairId);
        if (await selectCurrentStatus(pairId) === 'DONE') {
            socket.to(pairId).emit('finish messaging'); //これだけだと自分にemitされない　なぜ？
            socket.emit('finish messaging'); // 自分にemitされなかったので
            await updateStatus(pairId);
        };
    });

    /* ソケット切断時の処理 */
    socket.on('disconnect', async () => {
        // const role = isHost(socket.id) ? 'host' : 'guest';
        // console.log(await isHost(socket.id)); //socketidがinitialのままの人が切断したときちょっと不安
        logger.info('[socket.io]' + socket.id + ' disconnected');
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

/**
 * 
 * @param {String} socketId socket.id
 */
async function selectCurrentStatus(pairId) {
    // const pairId = await getPairId(socketId);
    const result = await sqlQuery(`SELECT status FROM pairs WHERE id = "${pairId}";`);
    return result[0]['status'];
}

/**
 * 次のstatusにする関数 DEFAULT(先手・後手待ち)→WAITING(先手完了，後手待ち)→DONE(先手・後手完了)→(次のフェーズの)DEFAULT...のループ
 * @param {String} socketId socket.id
 */
async function updateStatus(pairId) {
    // const pairId = await getPairId(socketId);
    await sqlQuery(`UPDATE pairs SET status = IF(status = "DEFAULT","WAITING",IF(status = "WAITING" ,"DONE","DEFAULT")) WHERE id = "${pairId}";`);
}

/**
 * Hostかどうかを返す(boolean)関数
 * @param {String} socketId socket.id
 * @return {Boolean} true:host,false:guest
 */
async function isHost(socketId) {
    const result = await sqlQuery(`SELECT is_host FROM players WHERE id = "${socketId}";`);
    return result[0]['is_host'];
}

/**
 * パートナーのsocket.idを返す関数
 * @param {String} socketId 自分のsocket.id
 * @return {String} パートナーのsocket.id
 */
async function getPartnerId(socketId) {
    if (await isHost(socketId)) {
        const result = await sqlQuery(`SELECT guest_id FROM pairs WHERE host_id = "${socketId}";`);
        return result[0]['guest_id'];
    }
    else {
        const result = await sqlQuery(`SELECT host_id FROM pairs WHERE guest_id = "${socketId}";`);
        return result[0]['host_id'];
    }
}

/**
 * HostIdを入力するとguestIdを返す関数
 * @param {String} hostId socket.id
 * @return {String} guestId
 */
async function getGuestId(hostId) {
    const result = await sqlQuery(`SELECT guest_id FROM pairs WHERE host_id = "${hostId}";`);
    return result[0]['guest_id'];
}

/**
 * socket.idが入室しているroom name(pairId)を返す関数
 * @param {String} socketId 自分のsocket.id
 * @return {String} room name(pairId)
 */
async function getPairId(socketId) {
    const result = await sqlQuery(`SELECT id FROM pairs WHERE host_id = "${socketId}" or guest_id = "${socketId}";`);
    return result[0]['id'];
}

/**
 * 報酬，プレイヤー1・２の位置を表す配列を返す関数
 * @return {Array} initPosArr:初期位置を示す配列
 */
function createInitPosArr() {
    const CELL_NUM = 9;
    const objNum = 3;
    let seq = [...Array(CELL_NUM).keys()];
    const initPosArr = shuffle(seq).slice(0, objNum);
    return [3, 4, 5];
    // return initPosArr;
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
    const absDiff = Math.abs(fromCoord - toCoord);
    switch (fromCoord % 3) {
        case 0: //左端の列
            if (fromCoord + 1 === toCoord) return true; //左端の列で右にtoCoordがあるとき
            else if (absDiff === 3) return true; //Y軸方向に隣接してるとき
            else return false;
        case 3 - 1: //右端の列
            if (fromCoord - 1 === toCoord) return true; //右端の列で左にtoCoordがあるとき
            else if (absDiff === 3) return true; //Y軸方向に隣接してるとき
            else return false;

        default: //端ではない列
            if (absDiff === 3) return true; //Y軸方向に隣接してるとき
            else if (absDiff === 1) return true; //他の列でX軸方向に隣接してるとき
            else return false;
    }
}

function getVisibleArr(initPosArrArr, isHost) {
    const visibleArr = JSON.parse(JSON.stringify(initPosArrArr));
    let reward = visibleArr[0];
    let host = visibleArr[1];
    let guest = visibleArr[2];
    if (isHost) {
        if (!(isAdjacentCell(host, reward) || isSameCell(host, reward))) reward = null;
        if (!(isAdjacentCell(host, guest) || isSameCell(host, guest))) guest = null;
    } else {
        // ゲストのとき
        if (!(isAdjacentCell(guest, reward) || isSameCell(guest, reward))) reward = null;
        if (!(isAdjacentCell(guest, host) || isSameCell(guest, host))) host = null;
    }
    return [reward, host, guest];
    // return [null, 6, 6];　//テスト用
}

function getIsMovableArr(currentPos) {
    const CELL_NUM = 9;
    return [...Array(CELL_NUM)].map((_, i) => {
        return isAdjacentCell(currentPos, i) || isSameCell(currentPos, i);
    });
}

function getMovableArr(currentPosi) {
    const CELL_NUM = 9;
    let movableArr = [];
    [...Array(CELL_NUM)].forEach((_, i) => {
        if (isAdjacentCell(currentPosi, i) || isSameCell(currentPosi, i)) {
            movableArr.push(i);
        }
    });
    return movableArr;
    // return [...Array(CELL_NUM)].map((_, i) => {
    //     return isAdjacentCell(currentPosi, i) || isSameCell(currentPosi, i);
    // });
}