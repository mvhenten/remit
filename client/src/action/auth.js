const { route } = require("preact-router");

const { authStore } = require("./store/auth");
const api = require("../lib/api");

const authenticate = async(username, password) => {
    const { token, error } = await api.post("auth", { username, password });

    authStore.setState({ processing: true });

    if (error) {
        authStore.setState({ error, processing: false });
        return;
    }

    authStore.setState({ token, error: "", processing: false });
    route("/inbox");
};

const logout = async() => {
    authStore.setState({ token: "" });
    route("/login");
};

module.exports = { authStore, authenticate, logout };