const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const clientsObj = io.sockets.connected;//ここにオブジェクト形式で接続中の"すべての"クライアントの情報入ってるのでそれを取り出す
const LOBBY_NAME = 'lobby';
const tableList = [];
let roomId = '初期宣言';

app.get('/', (req, res)=> {
    res.sendFile(__dirname + '/client.html');
});
app.get('/game.js', (req, res)=> {
    res.sendFile(__dirname + '/game.js');
});
app.get('/img/loading.png', (req, res) => {
    res.sendFile(__dirname + '/img/loading.png');
});
io.on('connection', (socket) => {
    const playerId = socket.id;
    socket.on('join lobby', () => {
        socket.join(LOBBY_NAME);
        console.log('-------------------------------------------------------------------------');
        const lobbyConnected = io.sockets.adapter.rooms[LOBBY_NAME];
        console.log(lobbyConnected);
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
        
        roomId = 'room' + (Math.ceil(lobbyConnected.length / 2) - 1);
        socket.join(roomId);
        io.emit('start game', roomId);
    });
    socket.on('send message', (msg) => {
        socket.broadcast.to(roomId).emit('receive message', msg);
        console.log('msg('+roomId+'): ' + msg);
    });
    // console.log('-------------------------------------------------------------------------');
    // console.log("部屋番号は" + roomId);
    // console.log(io.sockets.adapter.rooms[roomId]);

    socket.on('disconnect', ()=> {
        console.log('user disconnected');
    });
});

http.listen(port, () => {
    console.log('listening on *:' + port);
});