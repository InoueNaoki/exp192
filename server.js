const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client.html');
});
app.get('/game.js', function (req, res) {
    res.sendFile(__dirname + '/game.js');
});

io.on('connection', (socket) => {
    const playerId = socket.id;
    console.log('User(' + playerId + ') connected');
    socket.on('chat', (msg) => {
        io.emit('chat', msg);
        console.log('message: ' + msg);
    });
});

http.listen(port, () => {
    console.log('listening on *:' + port);
});