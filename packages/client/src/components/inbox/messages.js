const { h, Component } = require("preact");

import { Link } from 'preact-router';
const { displayDate } = require("../../lib/util/date");
const { appState } = require("../../action/app");
const { maildirStore } = require("../../action/maildir");

const MessageHeader = ({ message }) => {
	const { date, from, flags } = message;

	if (flags.seen) {
		return (
			<div class="flex between">
				<span>{from}</span>
				{displayDate(date)}
			</div>
		);

	}

	return (
		<div class="flex between">
			<strong>{from}</strong>
			{displayDate(date)}
		</div>
	);
};

const MessageListItem = ({ thread }) => {
	const { folder, messages } = thread;
	const { subject, parentId } = messages[0];

	const href = `/inbox/${folder.id}/${parentId}`;
	const style = { borderBottom: "1px solid #fee" };
	let classNames = "flex col padding-left-2 button solid padding-1 block";

	if (appState.isSelectedThread(parentId))
		classNames += " info";
	else classNames += " white hover-light";

	return (
		<Link style={style} href={href} class={classNames}>
			<MessageHeader message={messages[0]} />
			<div>
    			{subject}
			</div>
		</Link>
	);
};

class MessageList extends Component {
	constructor(props) {
		super(props);

		this.state = maildirStore.getState();
		this.setState = this.setState.bind(this);
	}

	componentDidMount() {
		maildirStore.observe(this.setState);
		appState.observe(this.setState);
	}

	render({ folderId, parentId }) {
		if (!folderId)
			return null;

		let messages = maildirStore.getMessages(folderId);

		if (!messages)
			return null;

		return (
			<article id="messages">
				{messages.map(thread => (<MessageListItem thread={thread} />))}
			</article>
		);
	}

}

export default MessageList;