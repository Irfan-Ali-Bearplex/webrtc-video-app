import React from 'react';
import { v1 as uuid } from 'uuid';
// import io from 'socket.io-client';

const CreateRoom = (props) => {
	function create() {
		let id = uuid();
		// let role = 'admin';
		// const socket = io.connect('/');
		// socket.emit('create meeting', { id, role });
		props.history.push(`/room/${id}?role=admin`);
	}

	return (
		<div className='d-flex flex-column w-100 justify-content-center align-items-center'>
			<p className='title text-white font-weight-bold text-center text-uppercase font-italic'>
				Join Live Meeting
			</p>
			<button
				onClick={create}
				className='btn btn-outline-info text-uppercase px-5'
			>
				Create Room
			</button>
		</div>
	);
};

export default CreateRoom;
