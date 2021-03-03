import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import styled from 'styled-components';

const ENDPOINT = 'http://localhost:5200/';
let socket;

const StyledVideo = styled.video`
	height: 40%;
	width: 50%;
`;

const Video = (props) => {
	const ref = useRef();

	useEffect(() => {
		props.peer.on('stream', (stream) => {
			ref.current.srcObject = stream;
		});
	}, []);

	return <StyledVideo muted autoPlay playsInline ref={ref} />;
};

const videoConstraints = {
	height: window.innerHeight / 2,
	width: window.innerWidth / 2,
};

const Room = (props) => {
	const [role, setRole] = useState('');
	const [peers, setPeers] = useState([]);
	const socketRef = useRef();
	const userVideo = useRef();
	const peersRef = useRef([]);
	const roomID = props.match.params.roomID;

	useEffect(() => {
		// socket = io(ENDPOINT);
		let checkRole = props.location.search.slice(6, 11);
		setRole(checkRole);
		socketRef.current = io.connect('/');

		navigator.mediaDevices
			.getUserMedia({
				video: videoConstraints,
				audio: true,
			})
			.then((stream) => {
				if (checkRole == 'admin') {
					userVideo.current.srcObject = stream;
					console.log('Admin');
				}
				socketRef.current.emit('join room', { roomID, checkRole });
				socketRef.current.on('all users', (users) => {
					console.log('Users');
					const peers = [];
					users.forEach((user) => {
						const peer = user.role
							? createPeer(user.id, socketRef.current.id, stream)
							: [];
						peer.user = user;
						peersRef.current.push({
							peerID: user.id,
							peerRole: user.role,
							peer,
						});
						peers.push(peer);
					});
					setPeers(peers);
				});

				socketRef.current.on('user joined', (payload) => {
					payload.role = role ? role : 'guest';
					const peer = addPeer(payload.signal, payload.callerID, stream);

					peersRef.current.push({
						peerID: payload.callerID,
						peer,
					});
					setPeers((users) => [...users, peer]);
				});

				socketRef.current.on('receiving returned signal', (payload) => {
					const item = peersRef.current.find((p) => p.peerID === payload.id);
					item.peer.signal(payload.signal);
				});
			});
	}, []);

	function createPeer(userToSignal, callerID, stream) {
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream,
		});

		peer.on('signal', (signal) => {
			socketRef.current.emit('sending signal', {
				userToSignal,
				callerID,
				signal,
			});
		});

		return peer;
	}

	function addPeer(incomingSignal, callerID, stream) {
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream,
		});

		peer.on('signal', (signal) => {
			socketRef.current.emit('returning signal', {
				signal,
				callerID,
			});
		});

		peer.signal(incomingSignal);

		return peer;
	}

	return (
		<div className='flex flex-row flex-wrap justify-content-center align-items-center'>
			<div className='text-center VideoDiv d-block w-100'>
				{peersRef?.current.length > 0 ? (
					<h6 className='LiveUser'>Live Users {peersRef?.current.length}</h6>
				) : (
					<h6 className='LiveUser'>No User live yet!</h6>
				)}
				{role == 'admin' ? (
					<StyledVideo ref={userVideo} autoPlay playsInline />
				) : null}

				{role == 'admin'
					? null
					: peers.map((peer, index) => {
							if (peer.user?.role == 'admin')
								return <Video key={index} peer={peer} />;
					  })}
			</div>
		</div>
	);
};

export default Room;
