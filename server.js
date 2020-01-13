/* express初期設定 */
const express = require('express')
const http = require('http');
//make sure you keep this order
const app = express();
const server = http.createServer(app);
const io = require('socket.io').listen(server); //io.sockets.adapter.rooms[LOBBY_NAME]

const util = require('util');
const conf = require('config'); //サーバーサイド設定ファイル
const port = conf.server.port;
const ip = conf.server.ip;

/* ファイル読み込み */
app.use(express.static('public')); //クライアントサイド

/*　mysql初期設定　*/
const mysql = require('mysql');
const dbConfig = conf.mysql;

server.listen(port, ip, () => {
    // logger.info('[nodejs]port:' + port);
    // logger.info('[nodejs]ip:' + ip);
});

/* socket.io接続 */
io.on('connection', async (socket) => {
    // const userId = socket.id;　//現時点ではソケットIDで代用，いずれはCookieかユーザー記入式のIDで対応
    // socket.id = 'hoge'; //でID変更可能
    // logger.info('[socket.io]' + socket.id + ' connected successfully');
    
    /* マッチメイキング　*/
    await socket.on('request matchmaking', async () => {
        socket.join(conf.LOBBY_NAME); // 待機ロビーに入室
        // logger.info('[socket.io]' + socket.id + ' joined lobby');
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
            socket.to(hostId).emit('response matchmaking', pairId, true, hostId, socket.id);//ホスト(部屋全体)にもマッチング完了を伝える
            socket.emit('response matchmaking', pairId, false, hostId, socket.id);//ゲストが入ったらマッチング完了なのでゲスト側のクライアントにそう伝える
        }
    });

    /* 初期化: Hostのみがrequest */
    await socket.on('request init', async(mode, round) => {
        await place(socket, mode, round, 0);
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
        await sql('INSERT INTO personals (player_id, pair_id, game_mode, current_round, score, is_first, message_at, ??) VALUE (?,?)', [msgColumnArr, [socket.id, pairId, game.mode, game.round, game.score, !isSecond, game.time], msgArr]);
        if (isSecond) {
            socket.to(pairId).emit('finish messaging'); //これだけだと自分にemitされない　そういう仕様なのかも？
            socket.emit('finish messaging'); // 自分にemitされなかったので
        }
    });

    /* movingフェーズ: お互いが任意の時間にrequest */
    await socket.on('request moving', async (dest,game) => {
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
            const results = await judge(selectPost.reward, selectPost.host_post, selectPost.guest_post);
            // logger.info('[game]' + JSON.stringify(results));
            
            const playerResult = await isHost ? results.hostResult : results.guestResult;
            await sql('UPDATE personals SET score = score + ?, behavior = ?, behavior_at = ? WHERE current_round = ? AND player_id = ?', [playerResult.increment, playerResult.id, game.time, game.round, socket.id]);
            await socket.emit('response judgment', playerResult); // 自分に

            const partnerResult = await isHost ? results.guestResult : results.hostResult;
            await sql('UPDATE personals SET score = score + ?, behavior = ?, behavior_at = ? WHERE current_round = ? AND player_id IN (SELECT partner_id FROM players WHERE id = ?)', [partnerResult.increment, partnerResult.id, game.time, game.round, socket.id]);
            await socket.to(pairId).emit('response judgment', partnerResult); //パートナーに

            if (playerResult.isGet || partnerResult.isGet) {
                //誰か報酬取得
                await place(socket, game.mode, game.round + 1);
            } else {
                //誰も報酬取得していない
                await through(socket, game.mode, game.round + 1, { reward: selectPost.reward, host: selectPost.host_post, guest: selectPost.guest_post });
            }
        }
    });

    /* ソケット切断時の処理 */
    socket.on('disconnect', async () => {
        // const role = getIsHost(socket.id) ? 'host' : 'guest';
        // console.log(await getIsHost(socket.id)); //socketidがinitialのままの人が切断したときちょっと不安
        // logger.info('[socket.io]' + socket.id + ' disconnected');
    });
});

async function place(socket, mode, round) {
    const pairId = await getPairId(socket.id);
    const initialPre = createInitialPosDic(9);
    
    await sql('INSERT INTO commons (pair_id, game_mode, current_round, reward, host_pre, guest_pre) VALUE (?)', [[pairId, mode, round, initialPre.reward, initialPre.host, initialPre.guest]]);
    socket.emit('response placement', getVisibleDic(initialPre, true), getMovableList(initialPre.host), round);　//ホストの部屋割当情報をホストクライアントに送信
    socket.to(pairId).emit('response placement', getVisibleDic(initialPre, false), getMovableList(initialPre.guest),round); //ゲストの部屋割当情報をゲストクライアントに送信
        // logger.info('[game]pair(' + socket.id + ', ' + guestId + ') were assigned ' + JSON.stringify(initialPre));
}

async function through(socket, mode, round, continuationPre) {
    const pairId = await getPairId(socket.id);
    await sql('INSERT INTO commons (pair_id, game_mode, current_round, reward, host_pre, guest_pre) VALUE (?)', [[pairId, mode, round, continuationPre.reward, continuationPre.host, continuationPre.guest]]);
    // await sql('UPDATE personals SET score = score + ? WHERE current_round = ? AND player_id = ?', [0, round, socket.id]);
    socket.emit('response placement', getVisibleDic(continuationPre, true), getMovableList(continuationPre.host), round);　//ホストの部屋割当情報をホストクライアントに送信
    socket.to(pairId).emit('response placement', getVisibleDic(continuationPre, false), getMovableList(continuationPre.guest), round); //ゲストの部屋割当情報をゲストクライアントに送信
    // logger.info('[game]pair(' + socket.id + ', ' + guestId + ') were assigned ' + JSON.stringify(initialPre));
}

// async function getPreRound(){};

async function judge(reward, host, guest) {
    const createResult = (judgmentName) => {
        const result = {};
        switch (judgmentName) {
            case 'continuation':
                result.id = 'c';
                result.increment = conf.payoff.continuation;
                result.isGet = false;
                break;
            case 'sharing':
                result.id = 's';
                result.increment = conf.payoff.sharing;
                result.isGet = true;
                break;
            case 'monopoly':
                result.id = 'm';
                result.increment = conf.payoff.monopoly;
                result.isGet = true;
                break;
            case 'failure':
                result.id = 'f';
                result.increment = conf.payoff.failure;
                result.isGet = false;
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
    }
    return judgment;
}

/**
 * MySQLにSQL文を投げる関数 sqlインジェクション対策版
 * @param {String} sqlStatement SQL文 
 */
async function sql(sqlStatement, placeholder) {
    // logger.trace('[mysql.query]' + sqlStatement +','+placeholder);//投げられた文をトレース
    const pool = mysql.createPool(dbConfig);
    pool.query = util.promisify(pool.query);
    try {
        const result = await pool.query(sqlStatement, placeholder);
        // logger.trace('[mysql.result]' + JSON.stringify(result)); //実行結果を返す．そのまま連結すると中身が見れなくなるのでJSON.stringify()を使用
        pool.end();
        return result;
    } catch (err) {
        // throw logger.error(err);
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
 * @param {String} socketId socket.id
 * @return {String} guestId
 */
async function getPreScoreId(socketId, round) {
    const result = await sql('SELECT guest_id FROM pairs WHERE host_id = ?', [hostId]);
    return result[0]['guest_id'];
}

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
    return initialPre;
}

function shuffle(arr) {
    for (let i = arr.length - 1; i >= 0; i--) {
        const rand = Math.floor(Math.random() * (i + 1)); // 0~iのランダムな数値を取得
        [arr[i], arr[rand]] = [arr[rand], arr[i]] // 配列の数値を入れ替える
    }
    return arr;
}

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