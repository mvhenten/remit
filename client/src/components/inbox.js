const {Component} = require("preact");

import { Router } from 'preact-router';
import { Link } from 'preact-router';


import MessageList from "./inbox/messages";
import Thread from "./inbox/thread";
import Maildir from "./maildir";

const {appState} = require("../action/app");
const {authStore, logout} = require("../action/auth");

export default class Inbox extends Component {
	componentDidMount() {
		let {folderId, parentId} = this.props;
		appState.setState({folderId, parentId});
	}

	componentWillReceiveProps(nextProps) {
		let {folderId, parentId} = nextProps;
		appState.setState({folderId, parentId});
	}


	render({folderId, parentId}) {
		const style = {flexFlow: "column", height: "100vh", display: "flex"};
		const containerStyle = { display: "flex", flex: 2};

// flex solid between white padding-bottom-1
		return (
			<div style={style}>
				<header>
					<section class="flex between solid light padding-horizontal-1" style={{justifyContent: "space-between"}}>
						<div style={{flexBasis: "220px"}}>
							<a class="icon fa-gear solid light button">Remit</a>
						</div>
						<div class="spaced-4 flex end row middle">
							<div class="icon fa-search grow info text-info">
								<input style={{background: "transparent"}} placeholder="search" />
							</div>
							<Link onClick={logout} class="button solid small default" href="/login">logout {authStore.profile.name}</Link>
						</div>

					</section>


					<div style={{marginBottom: "-55px", marginLeft: "220px"}}>
						<section style={{}} class="flex middle">
							<a class="solid button white icon fa-ban">spam</a>
							<a class="solid button white icon fa-trash">delete</a>
							<a class="solid button white icon fa-reply">reply</a>
							<a class="solid button white icon fa-reply-all">reply al</a>
							<a class="solid button white icon fa-share">forward</a>
						</section>
						<hr />
					</div>
				</header>
				<section style={containerStyle}>
					<div class="solid dark" style={{flexBasis: "220px", flexGrow: 0}}>
						<Maildir />
					</div>
					<div style={{flex: 2, overflow: "auto", marginTop: "55px"}}>
						 <Router>
							<MessageList path="/inbox/:folderId" folderId={folderId} parentId={parentId} />
							<Thread path="/inbox/:folderId/:parentId?" id={parentId} />
						</Router>
					</div>

				</section>
			</div>
		);

	}
}



