import { h, Component } from 'preact';
import { Router } from 'preact-router';

import Inbox from "./inbox";
import Login from "./login";

const route = require("../route/index");

const appStyle = {
	"height": "100vh",
};


export default class App extends Component {
	handleRoute(evt) {
		route(evt);
	}

	render() {
		return (
			<div id="app" class="solid white" style={appStyle}>
				 <Router onChange={this.handleRoute}>
					<Login path="/login" />
					<Inbox path="/inbox/*" />
					<Inbox path="/inbox/:folderId/:parentId?" />
				</Router>
			</div>
		);
	}
}
