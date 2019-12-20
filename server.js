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
io.on('connection', async (socket) => {
    // const userId = socket.id;　//現時点ではソケットIDで代用，いずれはCookieかユーザー記入式のIDで対応
    // socket.id = 'hoge'; //でID変更可能
    logger.info('[socket.io]' + socket.id + ' connected successfully');
    
    /* マッチメイキング　*/
    await socket.on('join lobby', async () => {
        socket.join(conf.LOBBY_NAME); // 待機ロビーに入室
        logger.info('[socket.io]' + socket.id + ' joined lobby');
        await sql('INSERT INTO players SET id = ?', [socket.id]);
        // logger.info('[socket.io]' + socket.id + ' changed socket.id to ' + player.name);
        const mostWaitingPairId = (await sql('SELECT MIN(id) FROM pairs WHERE guest_id IS NULL'))[0]['MIN(id)'];
        if (!mostWaitingPairId) { 
            // Hosts
            await sql('UPDATE players SET is_host = true WHERE id = ?', [socket.id]);
            const pairId = (await sql('INSERT INTO pairs SET host_id = ?', [socket.id]))['insertId'];
            // logger.info('[game]' + socket.id + ' is host of room' + pairId);
            socket.join(pairId);
            socket.leave(conf.LOBBY_NAME);
        } else {
            // Guest
            const pairId = mostWaitingPairId;
            await sql('UPDATE pairs SET guest_id = ? WHERE id = ?', [socket.id, pairId]);
            const hostId = (await sql('SELECT host_id FROM pairs WHERE id = ?', [pairId]))[0]['host_id'];
            await sql('UPDATE players SET is_host = false, partner_id = ? WHERE id = ?', [hostId, socket.id]);
            await sql('UPDATE players SET partner_id = ? WHERE id = ?', [socket.id, hostId]); //hostのパートナーは自分
            // logger.info('[game]' + socket.id + ' is guest of room' + pairId);
            // logger.info('[game] pair' + pairId + ' matchmaking complete (host:' + hostId+', guest:'+socket.id+')')
            socket.join(pairId);
            socket.leave(conf.LOBBY_NAME);
            socket.to(hostId).emit('finish matchmaking', pairId, true, hostId, socket.id);//ホスト(部屋全体)にもマッチング完了を伝える
            socket.emit('finish matchmaking', pairId, false, hostId, socket.id);//ゲストが入ったらマッチング完了なのでゲスト側のクライアントにそう伝える
        }
    });

    /* placementフェーズ: Hostのみがrequest */
    await socket.on('request placement', async (round) => {
        const pairId = await getPairId(socket.id);
        const initialPre = createInitialPosDic(9);
        await sql('INSERT INTO commons (pair_id, current_round, reward, host_pre, guest_pre) VALUE (?)', [[pairId, round, initialPre.reward, initialPre.host, initialPre.guest]]);
        socket.emit('response placement', getVisibleDic(initialPre, true), getMovableList(initialPre.host));　//ホストの部屋割当情報をホストクライアントに送信
        socket.to(pairId).emit('response placement', getVisibleDic(initialPre, false), getMovableList(initialPre.guest)); //ゲストの部屋割当情報をゲストクライアントに送信
        // logger.info('[game]pair(' + socket.id + ', ' + guestId + ') were assigned ' + JSON.stringify(initialPre));
    });

    /* messagingフェーズ: お互いが任意の時間にrequest　*/
    await socket.on('request messaging', async (msg, game) => {
        const pairId = await getPairId(socket.id);
        socket.broadcast.to(pairId).emit('response messaging', msg);
        // logger.info('[game]' + socket.id + ' send message ' + JSON.stringify(msg) + ' at room' + pairId);
        //後手かどうか
        const isSecond = Object.values((await sql('SELECT EXISTS(SELECT * FROM personals WHERE pair_id = ? AND current_round = ?)', [pairId, game.round]))[0])[0];
        const msgColumnArr = ['message0', 'message1']; //msg数を可変にするならこの辺いじる
        const msgArr = [msg[0].id, msg[1].id];
        await sql('INSERT INTO personals (player_id, pair_id, current_round, score, is_first, message_at, ??) VALUE (?,?)', [msgColumnArr, [socket.id, pairId, game.round, game.score, !isSecond, game.time], msgArr]);
        if (isSecond) {
            socket.to(pairId).emit('finish messaging'); //これだけだと自分にemitされない　そういう仕様なのかも？
            socket.emit('finish messaging'); // 自分にemitされなかったので
        }
    });

    /* movingフェーズ: お互いが任意の時間にrequest */
    await socket.on('request moving', async (dest,game) => {
        // const pairId = await getPairId(socket.id);
        // const partnerId = await getPartnerId(socket.id);
        const pairId = await getPairId(socket.id);
        const isHost =  await getIsHost(socket.id);
        const playerPostColumnName = isHost ? 'host_post' : 'guest_post';
        await sql('UPDATE commons SET ?? = ? WHERE current_round = ? AND pair_id = ?', [playerPostColumnName, dest, game.round, pairId]);
        //後手かどうか
        const isSecond = Object.values((await sql('SELECT EXISTS(SELECT * FROM commons WHERE host_post IS NOT NULL AND guest_post IS NOT NULL AND pair_id = ? AND current_round = ?)', [pairId, game.round]))[0])[0];
        if (isSecond) {
            socket.to(pairId).emit('finish moving'); //これだけだと自分にemitされない
            socket.emit('finish moving'); // 自分にemitされなかったので
            const selectPost = (await sql('SELECT reward,host_post,guest_post FROM commons WHERE current_round = ? AND pair_id = ?', [game.round, pairId]))[0];
            const judgment = await judge(selectPost.reward, selectPost.host_post, selectPost.guest_post, game.round, pairId);
            console.log(judgment);
            const playerResult = await isHost ? judgment.hostResult : judgment.guestResult;
            await sql('UPDATE personals SET behavior = ?, behavior_at = ? WHERE current_round = ? AND player_id = ?', [playerResult.id, game.time, game.round, socket.id]);
            await socket.emit('response judgment', playerResult); // 自分に

            const partnerResult = await isHost ? judgment.guestResult : judgment.hostResult;
            await sql('UPDATE personals SET behavior = ?, behavior_at = ? WHERE current_round = ? AND player_id IN (SELECT partner_id FROM players WHERE id = ?)', [partnerResult.id, game.time, game.round, socket.id]);
            await socket.to(pairId).emit('response judgment', partnerResult); //パートナーに
        }
    });

    /* ソケット切断時の処理 */
    socket.on('disconnect', async () => {
        // const role = getIsHost(socket.id) ? 'host' : 'guest';
        // console.log(await getIsHost(socket.id)); //socketidがinitialのままの人が切断したときちょっと不安
        logger.info('[socket.io]' + socket.id + ' disconnected');
    });
});

http.listen(port, ip, () => {
    logger.info('[nodejs]port:' + port);
    logger.info('[nodejs]ip:' + ip);
});

async function judge(reward, host, guest, round, pairId) {
    const createResult = (judgmentName) => {
        const result = {};
        switch (judgmentName) {
            case 'continuation':
                result.id = 'c';
                result.incremental = conf.payoff.continuation;
                result.isGet = false;
                result.nextPhase = 'messaging';
                break;
            case 'sharing':
                result.id = 's';
                result.incremental = conf.payoff.sharing;
                result.isGet = true;
                result.nextPhase = 'placement';
                break;
            case 'monopoly':
                result.id = 'm';
                result.incremental = conf.payoff.monopoly;
                result.isGet = true;
                result.nextPhase = 'placement';
                break;
            case 'failure':
                result.id = 'f';
                result.incremental = conf.payoff.failure;
                result.isGet = false;
                result.nextPhase = 'placement';
                break;
            default:
                break;
        }
        return result;
    };
    
    const judgment = {};
    if (reward === host && reward === guest) {
        judgment.hostResult = createResult('sharing');
        judgment.guestResult = createResult('sharing');
    }
    else if (reward === host) {
        judgment.hostResult = createResult('monopoly');
        judgment.guestResult = createResult('failure');
    }
    else if (reward === guest) {
        judgment.hostResult = createResult('failure');
        judgment.guestResult = createResult('monopoly');
    }
    else {
        judgment.hostResult = createResult('continuation');
        judgment.guestResult = createResult('continuation');
        // placementを経由しないのでの代わりに次のラウンドの位置情報をinsert
        await sql('INSERT INTO commons (pair_id, current_round, reward, host_pre, guest_pre) VALUE (?)', [[pairId, round+1, reward, host, guest]]);
    }
    return judgment;
}

/**
 * MySQLにSQL文を投げる関数 sqlインジェクション対策版
 * @param {String} sqlStatement SQL文 
 */
async function sql(sqlStatement, placeholder) {
    logger.trace('[mysql.query]' + sqlStatement +','+placeholder);//投げられた文をトレース
    const pool = mysql.createPool(dbConfig);
    pool.query = util.promisify(pool.query);
    try {
        const result = await pool.query(sqlStatement, placeholder);
        logger.trace('[mysql.result]' + JSON.stringify(result)); //実行結果を返す．そのまま連結すると中身が見れなくなるのでJSON.stringify()を使用
        pool.end();
        return result;
    } catch (err) {
        throw logger.error(err);
    }
}

/**
 * Hostかどうかを返す(boolean)関数
 * @param {String} socketId socket.id
 * @return {Boolean} true:host,false:guest
 */
async function getIsHost(socketId) {
    const result = await sql('SELECT is_host FROM players WHERE id = ?', [socketId]);
    return result[0]['is_host'];
}

/**
 * hostIdを入力するとguestIdを返す関数
 * @param {String} hostId socket.id
 * @return {String} guestId
 */
async function getGuestId(hostId) {
    const result = await sql('SELECT guest_id FROM pairs WHERE host_id = ?', [hostId]);
    return result[0]['guest_id'];
}

// /**
//  * socketIdを入力するとpartnerIdを返す関数
//  * @param {String} socketId socket.id
//  * @return {String} partnerId
//  */
// async function getGuestId(socketId, isHost) {
//     const playerColumnName = isHost ? 'host_id' : 'guest_id';
//     const partnerColumnName = isHost ? 'guest_id' : 'host_id';
//     const result = await sql('SELECT guest_id FROM pairs WHERE host_id = ?', [hostId]);
//     return result[0]['guest_id'];
// }

/**
 * socket.idが入室しているroom name(pairId)を返す関数
 * @param {String} socketId 自分のsocket.id
 * @return {String} room name(pairId)
 */
async function getPairId(socketId) {
    const result = await sql('SELECT id FROM pairs WHERE host_id = ? OR guest_id = ?', [socketId, socketId]);
    return result[0]['id'];
}

/**
 * 報酬，プレイヤー1・２の位置を表す配列を返す関数
 * @return {Array} initPosArr:初期位置を示す配列
 */
function createInitialPosDic() {
    const CELL_NUM = 9;
    const shuffledSeq = shuffle([...Array(CELL_NUM).keys()]);
    const initialPre = {
        reward: shuffledSeq[0],
        host: shuffledSeq[1],
        guest: shuffledSeq[2],
    };
    return {
        reward: 0,
        host: 1,
        guest: 1
    };
    // return initialPre;
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

function getVisibleDic(posDic, isHost) {
    // let dic = JSON.parse(JSON.stringify(posDic)); 
    const rewardPos = posDic.reward;
    const selfPos = isHost ? posDic.host : posDic.guest;
    const partnerPos = isHost ? posDic.guest : posDic.host;
    const isVisible = (fromCoord, toCoord) => {
        return isAdjacentCell(fromCoord, toCoord) || isSameCell(fromCoord, toCoord)
    };
    const VisibleDic = {
        reward: isVisible(selfPos, rewardPos) ? rewardPos : null,
        self: selfPos,
        partner: isVisible(selfPos, partnerPos) ? partnerPos : null,
    };
    return VisibleDic;
}

function getMovableList(currentPosi) {
    const CELL_NUM = 9;
    let movableList = [];
    [...Array(CELL_NUM)].forEach((_, i) => {
        if (isAdjacentCell(currentPosi, i) || isSameCell(currentPosi, i)) {
            movableList.push(i);
        }
    });
    return movableList;
}