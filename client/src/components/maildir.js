const {Component} = require("preact");

import { Link } from 'preact-router';

const {maildirStore} = require("../action/maildir");

const InboxListItem = ({href, title, unseen}) => {
    if (unseen) {
        return (
            <li>
                <Link href={href} class="button solid dark padding-1 hover-important block">
                    <div class="flex between">
                        <div>{title}</div>
                        <div>{unseen}</div>
                    </div>
                </Link>
            </li>
        );
    }

    return (
        <li>
            <Link href={href} class="button solid dark hover-important block">{title}</Link>
        </li>
    );
};


export default class Maildir extends Component {
	constructor(props) {
		super(props);

		this.state = maildirStore.getState();
		this.setState = this.setState.bind(this);
	}

	componentDidMount() {
	    maildirStore.observe(this.setState);
	}

	render({filter}) {
	    const {maildir=[]} = this.state;

	    let style = { flexBasis: "220px"};

		return (
			<article id="articles" style={style} class="solid dark">
				<nav class="list-none list-flat padding-vertical-3 flex col">
                    {maildir.map(item => <InboxListItem {...item} />)}
			    </nav>
			</article>
		);

	}
}