// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var configDB = require('./config/database.js');
var diff_match_patch=require('googlediff');
var dmp = new diff_match_patch;
// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

app.configure(function() {

	// set up our express application
	app.use(express.logger('dev')); // log every request to the console
	app.use(express.cookieParser()); // read cookies (needed for auth)
	app.use(express.bodyParser()); // get information from html forms

	app.set('view engine', 'ejs'); // set up ejs for templating

	// required for passport
	app.use(express.session({ secret: 'blahblahblahblahblahblahblahblah' })); // session secret
	app.use(passport.initialize());
	app.use(passport.session()); // persistent login sessions
	app.use(flash()); // use connect-flash for flash messages stored in session

});

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport


var clients = {};

var drawinginstructions = {};
var data = '';
//io is a global that you can emit or listen to, that everyone
io.on('connection', function(socket){
	//socket is the local instance for each user.

	clients[socket.id]=socket;
	console.log('############# NEW CONNECTION #############');


	socket.on('room',function(room) {
		socket.join(room);
		console.log(socket.id + 'joined:' + room)
		console.log('data:'+data);
		var patches = dmp.patch_make('',data);
		var temp = dmp.patch_toText(patches);
		socket.emit('draw',temp);

	});


	// add user to the global clients-object

	/*

	for (var key in clients) {
	var id = clients[key].id;
	var client = clients[key];
	io.emit('test',id); //broadcast to all


	socket.emit('test2',id); //send to own socket



	client.emit('test3',id); //send to specific socket
	socket.broadcast.to(id).emit('test3',id); //another way to send to a specific socket //cant send to self this way
}
*/


socket.on('draw',function(point) {
	var room = socket.rooms[1];
	io.to(room).emit('draw', point);
	var patches = dmp.patch_fromText(point);
	data = dmp.patch_apply(patches, data)[0];
	console.log(socket.id + point + '\nRoom: ' + room);
});
socket.on('clear',function() {
	var room = socket.rooms[1];
	io.to(room).emit('clear',{});
	drawinginstructions[room] = [];
});
//console.log(io.eio.clients);

socket.on('disconnect', function(){
	console.log('### user disconnected ###');
	delete clients[socket.id];
});




// socket.on('chat message', function(msg){
// 	socket.broadcast.emit('chat message', msg);
// });

// console.log('############# NEW CONNECTION #############');


//	for (var key in io.eio.clients) {
//		var client = io.eio.clients[key].id;
//		io.emit('test',client);
//		socket.emit('test3',client);
//	io.sockets.socket(client).emit('test2',client);
//console.log(client);
//emit to all users
//	}


});

app.use(express.static(__dirname));
// launch ======================================================================
app.listen(port);
server.listen(8000);
console.log('The magic happens on port ' + port);
