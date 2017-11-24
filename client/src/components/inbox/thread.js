const { Component } = require("preact");
const { threadStore } = require("../../action/thread");
const { prefStore, trustImages } = require("../../action/preferences");
const { displayDate } = require("../../lib/util/date");

const ImageWarning = ({ display = false, onClick }) => {
	if (!display)
		return null;
	return (
		<div class="solid warning padding-2">
			<h4>This email contains images. Do you want to display them? <a onClick={onClick} class="dark">show images</a></h4>
		</div>
	);
};

class MessageHtml extends Component {
	constructor() {
		super();
		this.state = {};
		this.showImages = this.showImages.bind(this);
	}

	componentDidMount() {
		let trusted = prefStore.getState() || {};
		

		if (trusted.images && trusted.images.includes(this.props.from)) {
			this.setState({
				showImages: true,
				images: false
			});
			return;
		}
		
		
		let images = this.base.querySelectorAll(".remit-image-placeholder");

		if (images.length) {
			this.setState({ images: true });
		}
	}

	componentDidUpdate() {
		let images = this.base.querySelectorAll(".remit-image-placeholder");
		images = [].slice.call(images);

		let { showImages } = this.state;
		images.forEach((img) => {
			if (!/^https/.test(img.dataset.src))
				return;
				
			if (/beacon/.test(img.dataset.src))
				return;
			
			if (!showImages) {
				img.style.backgroundColor = "pink";
				img.style.border = "3px solid #ccc";
				return;
			}
			img.setAttribute("src", img.dataset.src);
			img.setAttribute("style", img.dataset.style);
		});
	}

	showImages() {
		trustImages(this.props.from);
		this.setState({
			images: false,
			showImages: true
		});
	}

	render({ html, from }) {
		return (
			<div>
				<ImageWarning onClick={this.showImages} display={this.state.images} />
				 <div class="padding-1" dangerouslySetInnerHTML={{ __html: html }} />
			</div>
		);
	}
}


const MessageBody = ({ message }) => {
	if (message.body.html)
		return <MessageHtml from={message.from} html={message.body.html} />;

	if (message.body.text)
		return <div class="padding-1">{message.body.text}</div>;

	return <div>No message contents</div>;
};

const MessageAddress = ({ label, address }) => {
	address = [...address];

	return (
		<small class="spaced-2">
			<span class="text-dark text-lighten">{label}</span>
			{address.map(addr => (<span>{addr.name || addr.address}</span>))}
		</small>
	);
};

const MessageHeaders = ({ message }) => {
	if (!message)
		return null;

	return (
		<section class="flex col padding-1">
			<div class="flex between">
				<strong>{message.from}</strong>
				<span>{displayDate(message.date)}</span>
			</div>
			<MessageAddress label="To:" address={message.to} />
			<div>{message.subject}</div>
			<hr/>
		</section>
	);
};

const ThreadItem = ({ message }) => {
	return (
		<section class="solid white shadow-1 margin-bottom-1">
			<MessageHeaders message={message} />
			<section class="type">
				<MessageBody message={message} />
			</section>
		</section>
	);
};

const ThreadList = ({ messages }) => {
	if (!messages) return null;

	let style = { width: "100%", overflow: "scroll" };
	
	return (
		<div>
			{messages.map(message => (<ThreadItem message={message} />))}
		</div>
	);
};

export default class Message extends Component {
	constructor(props) {
		super(props);

		this.state = threadStore.getState();
		this.setState = this.setState.bind(this);
	}

	componentDidMount() {
		threadStore.observe(this.setState);
	}
	
	componentWillUnmount() {
		threadStore.stopObserving(this.setState);
	}

	render({ id }) {
		if (!id) return null;
		
		const messages = this.state.threads[id];

		return (
			<article class="solid light padding-right-1">
				<ThreadList messages={messages} />
			</article>
		);

	}

}
