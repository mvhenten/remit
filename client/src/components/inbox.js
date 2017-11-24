const {Component} = require("preact");
import { Link } from 'preact-router';


import MessageList from "./inbox/messages";
import Thread from "./inbox/thread";
import Maildir from "./maildir";
import Spacer from "./spacer";

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
		console.log(authStore.profile);
		return (
			<div>
				<div class="flex solid between white padding-bottom-1">
					<div>
						<a class="icon fa-gear solid white button">{authStore.profile.name}</a>
					</div>
					<div class="flex middle">
						<a class="solid button white icon fa-ban">spam</a>
						<a class="solid button white icon fa-trash">delete</a>
						<a class="solid button white icon fa-reply">reply</a>
						<a class="solid button white icon fa-reply-all">reply al</a>
						<a class="solid button white icon fa-share">forward</a>
						<select>
							<option>Take one...</option>
							<option>Take two...</option>
							<option>Take three...</option>
						</select>
					</div>
					<div class="spaced-4 flex end">
						<div class="icon fa-search grow info text-info">
							<input placeholder="search" />
						</div>						
						<Link onClick={logout} class="button solid info" href="/login">logout</Link>
					</div>
				</div>
				<Spacer style={{height: "calc(100vh - 54px)"}}>
				    <Maildir />
					<MessageList folderId={folderId} parentId={parentId} />
					<Thread id={parentId} />
				</Spacer>
			</div>
		);
		
	}
}

