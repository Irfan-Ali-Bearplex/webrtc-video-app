require('dotenv').config();
const express = require('express');
const http = require('http');
var path = require('path');
var cors = require('cors');
var app = express();

const server = http.createServer(app);
const socket = require('socket.io');
const io = socket(server);

const users = {};

const socketToRoom = {};

app.use(cors());
app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', 'http://localhost:3000/'); // update to match the domain you will make the request from
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept'
	);
	next();
});

app.get('/', (req, res) => {
	res.status(200).send('Server is working!');
});

//Run the clients files
// if (process.env.NODE_ENV === 'production') {
// 	app.use(express.static('client/build'));

// 	app.get('*', (req, res) => {
// 		res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
// 	});
// }

io.on('connection', (socket) => {
	socket.on('join room', ({ roomID, checkRole }) => {
		let user = {
			id: socket.id,
			role: checkRole ? checkRole : 'guest',
		};
		if (users[roomID]) {
			users[roomID].push(user);
		} else {
			users[roomID] = [user];
		}
		console.log(users[roomID]);
		socketToRoom[socket.id] = roomID;
		const usersInThisRoom = users[roomID].filter(
			(item) => item.id !== socket.id
		);
		socket.emit('all users', usersInThisRoom);
	});

	socket.on('create meeting', ({ id, role }) => {
		if (id && role) {
			let user = {
				id: socket.id,
				role,
			};
			users[id] = [user];
		} else {
			socket.emit('create meeting error', {
				message: 'Meeting id and role is required!',
			});
		}
	});

	socket.on('sending signal', (payload) => {
		io.to(payload.userToSignal).emit('user joined', {
			signal: payload.signal,
			callerID: payload.callerID,
			role: payload.role,
		});
	});

	socket.on('returning signal', (payload) => {
		io.to(payload.callerID).emit('receiving returned signal', {
			signal: payload.signal,
			id: socket.id,
		});
	});

	socket.on('disconnect', () => {
		const roomID = socketToRoom[socket.id];
		let room = users[roomID];
		if (room) {
			room = room.filter((id) => id !== socket.id);
			console.log({ room });
			const usersInThisRoom = users[roomID].filter((id) => id !== socket.id);
			socket.emit('all users', usersInThisRoom);
		}
	});
});

const PORT = process.env.PORT || 5200;

server.listen(PORT, () =>
	console.log(`Server is running on port http://localhost:${PORT}/`)
);
