//Dependencies
var os = require('os');
var express = require('express');
var app = express();
var http = require('http');
var socketIO = require('socket.io');

app.use(express.static('public'))
app.get("/", function(req, res){
	res.render("index.ejs");
});

// Port and server initialisation
var server = http.createServer(app);
server.listen(process.env.PORT || 8000);
var io = socketIO(server);

// socket io implementation
io.sockets.on('connection', function(socket) {

	function log() {
	  var array = ['Message from server:'];
	  array.push.apply(array, arguments);
	  socket.emit('log', array);
	}
	
	// Send Message
    socket.on('message', function(message, room) {
	  log('Client said: ', message);
	  socket.in(room).emit('message', message, room);
	});
	
	// Create/Join room
	socket.on('create or join', function(room) {
	  log('Received request to create or join room ' + room);
  
	  var clientsInRoom = io.sockets.adapter.rooms[room];
	  var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
	  log('Room ' + room + ' now has ' + numClients + ' client(s)');
		
	  // Check if room is created/joined/already full
	  if (numClients === 0) { // created
		socket.join(room);
		log('Client ID ' + socket.id + ' created room ' + room);
		socket.emit('created', room, socket.id);
  
	  } else if (numClients === 1) { // joined
		log('Client ID ' + socket.id + ' joined room ' + room);
		io.sockets.in(room).emit('join', room);
		socket.join(room);
		socket.emit('joined', room, socket.id);
		io.sockets.in(room).emit('ready');
	  } else { //already full
		socket.emit('full', room);
	  }
	});
  
	socket.on('ipaddr', function() {
	  var ifaces = os.networkInterfaces();
	  for (var dev in ifaces) {
		ifaces[dev].forEach(function(details) {
		  if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
			socket.emit('ipaddr', details.address);
		  }
		});
	  }
	});
	
	// Some particiapnt leaves the room
	socket.on('bye', function(){
	  console.log('received bye');
	});
  
  });