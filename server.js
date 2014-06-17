var app = require('http').Server(handler)
  , io = require('socket.io')(app)
  , fs = require('fs');

app.listen(process.env.OPENSHIFT_NODEJS_PORT || 80, process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1');

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      res.end('Error loading index.html');
			return;
    }
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(data);
  });
}

var userdata = {};

io.on('connection', function (socket) {
	socket.emit('data', userdata);
	
  socket.on('join', function (nick) {
		console.log(nick + ' joined');
		userdata[nick] = {x: 0, y: 0};
		socket.nick = nick;
		socket.broadcast.emit('join', nick);
  });
	
	socket.on('move', function (data) {
		if(socket.nick){
			console.log(socket.nick + ' moved to (' + data.x + ', ' + data.y + ')');
			userdata[socket.nick].x = data.x;
			userdata[socket.nick].y = data.y;
			socket.broadcast.emit('move', {'nick': socket.nick, 'x': data.x, 'y': data.y});
		}
  });
	
	socket.on('chat', function (message) {
		if(socket.nick){
			console.log(socket.nick + ' said ' + message);
			userdata[socket.nick].lastchat = message;
			socket.broadcast.emit('chat', {'nick': socket.nick, 'message': message});
		}
  });
	
	socket.on('disconnect', function () {
		if(socket.nick){
			console.log(socket.nick + ' left');
			io.emit('leave', socket.nick);
			delete userdata[socket.nick];
		}
	});
});