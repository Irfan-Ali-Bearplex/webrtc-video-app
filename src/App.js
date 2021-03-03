import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import CreateRoom from './routes/CreateRoom';
import Room from './routes/Room';

import './App.css';

function App() {
	return (
		<div className='container'>
			<div className='WrapperBG h-100 d-flex justify-content-center align-items-center'>
				<BrowserRouter>
					<Switch>
						<Route path='/' exact component={CreateRoom} />
						<Route path='/room/:roomID' exact component={Room} />
						<Route path='*' component={CreateRoom} />
					</Switch>
				</BrowserRouter>
			</div>
		</div>
	);
}

export default App;
