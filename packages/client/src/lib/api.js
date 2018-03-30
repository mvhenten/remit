const url = require("url");
const fetchStream = require("fetch-readablestream");
const { authStore } = require("../action/store/auth");

const { Headers } = window;

function readAllChunks(readableStream) {
	const reader = readableStream.getReader();
	const chunks = [];

	function pump() {
		return reader.read().then(({ value, done }) => {
			if (done) {
				return chunks;
			}
			chunks.push(value);

			console.log("value", value);

			return pump();
		});
	}

	return pump();
}

function getFormData(payload) {
	const form = new FormData();

	for (let key in payload) {
		form.append(key, payload[key]);
	}

	return form;
}

class Api {
	get base() {
		return url.parse(document.location.href);
	}

	format(pathname, query) {
		const { protocol, hostname } = this.base;

		pathname = "/api/" + pathname;

		return url.format({ protocol, hostname, pathname, query });
	}

	request(method, uri, payload) {
		const headers = new Headers();
		const options = { method, headers };

		if (authStore.authenticated)
			headers.append("Authorization", `Bearer ${authStore.token}`);

		if (payload)
			options.body = getFormData(payload);

		return window.fetch(uri, options).then(res => {
			if (res.ok && res.status !== 200)
				return Promise.resolve();
				
			// console.log("response", res);


			// // console.log(res.text());

			// if (!res.ok) {
			// 	const err = new Error("Request failed");
			// 	err.response = res;
			// 	throw err;
			// }

			return res.json().catch((err) => {
				console.log("CAUHGOT", err);
			});
		});
	}

	fetchStream(uri) {
		fetchStream(uri)
			.then(res => readAllChunks(res.body))
			.then(chunks => console.dir(chunks));
	}

	delete(pathname) {
		return this.request("DELETE", this.format(pathname));
	}

	post(pathname, body = {}) {
		return this.request("POST", this.format(pathname), body);
	}

	get(pathname, query) {
		return this.request("GET", this.format(pathname, query));
	}
}

module.exports = new Api();