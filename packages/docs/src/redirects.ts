function redirect() {
	const url = new URL(window.location.href);

	if (url.pathname.startsWith("/workers/events")) {
		url.pathname = url.pathname.replace("/workers/events", "/workers/handlers");
		window.location.href = url.toString();
		return;
	}
}

if (typeof document !== "undefined") {
	redirect();
}
