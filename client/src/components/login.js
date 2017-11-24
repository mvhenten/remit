const { Component } = require("preact");
const { authStore, authenticate } = require("../action/auth");

const Error = ({ error }) => {
    if (!error) return null;
    return (
        <div class="text-danger">
            {error}
        </div>
    );
};

export default class Maildir extends Component {
    constructor(props) {
        super(props);
        
        this.onSubmit = this.onSubmit.bind(this);
        this.onChange = this.onChange.bind(this);
        this.setState = this.setState.bind(this);
    }
    
    componentDidMount() {
        authStore.observe(this.setState);
        this.base.querySelector("form").reset();
        this.base.querySelector("[name]").focus();
    }
    
    componentWillUnmount() {
        authStore.stopObserving(this.setState);
    }

    onChange(evt) {
        const name = evt.target.name;
        const value = evt.target.value;

        this.setState({
            error: null,
            [name]: value });
    }

    onSubmit(evt) {
        evt.preventDefault();

        let { name, password } = this.state;

        if (!(name && password)) {
            this.setState({ error: "Enter email and password" });
            return;
        }

        authenticate(name, password);
    }

    render({ filter }) {
        let style = {
            alignItems: "center",
            justifyContent: "center",
        };

        return (
            <article style={style} id="articles" class="solid important vh-100 flex around">
                <section class="min-height-10 min-width-10 solid light padding-4 shadow-1">
                    <form disabled={this.state.processing} onSubmit={this.onSubmit} class="flex col spaced-vertical-1">
                        <h4>Enter your login details</h4>
                        <input autoFocus={true} onChange={this.onChange} type="text" name="name" placeholder="username" />
                        <input onChange={this.onChange} type="password" name="password" placeholder="***" />
                        <button class="important solid">submit</button>
                        <Error error={this.state.error} />
                    </form>
                </section>
			</article>
        );

    }
}