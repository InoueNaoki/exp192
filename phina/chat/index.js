const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const POST = 3000;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
//   socket.on('setUserName', (userName) => {
//     if (!userName) userName = '匿名';

//     socket.userName = userName;
//   });
//   socket.on('chat', (msg) => {
//     console.log(msg);
//     io.emit('chat', socket.userName + ': ' + msg);
//   });
// });
  //接続時に振られた一意のIDをコンソールに表示
  console.log('%s さんが接続しました。', socket.id);

  //デフォルトのチャンネル
  var channel = 'channel-a';

  //接続時に自分以外の全員にIDを表示
  socket.broadcast.emit('message', socket.id + 'さんが入室しました！', 'system');

  //Roomを初期化するらしい
  socket.join(channel);

  //messageイベントで動く
  //同じチャンネルの人にメッセージを送る
  socket.on('message', function (msg) {
    io.sockets.in(channel).emit('message', msg, socket.id);
  });

  //接続が切れた時に動く
  //接続が切れたIDを全員に表示
  socket.on('disconnect', function (e) {
    console.log('%s さんが退室しました。', socket.id);
  });

  //チャンネルを変えた時に動く
  //今いるチャンネルを出て、選択されたチャンネルに移動する
  socket.on('change channel', function (newChannel) {
    socket.leave(channel); //チャンネルを去る
    socket.join(newChannel); //選択された新しいチャンネルのルームに入る
    channel = newChannel; //今いるチャンネルを保存
    socket.emit('change channel', newChannel); //チャンネルを変えたこと自分に送信
  });
});

http.listen(POST, () => {
  console.log('listening on *:', POST);
});
