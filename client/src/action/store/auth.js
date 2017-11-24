const Store = require("kabinet/store");
const persist = require("./persist");
const jwtDecode = require("jwt-decode");

const AuthStoreBase = Store.create("AuthStore", {
    processing: Boolean,
    error: String,
    token: String
});

class AuthStore extends AuthStoreBase {
    constructor() {
        super();
    }

    get state() {
        return this.getState();
    }
    
    get authenticated() {
        return !!this.state.token;
    }
    
    get profile() {
        if (this.authenticated) {
            return jwtDecode(this.token);            
        }
    }
    
    get token() {
        return this.state.token;
    }
}

const authStore = new AuthStore();

persist("auth", authStore);

module.exports = { authStore };