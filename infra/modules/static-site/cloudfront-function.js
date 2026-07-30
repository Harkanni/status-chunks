function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // Root landing page
    if (uri === "/") {
        request.uri = "/index.html";
        return request;
    }

    // App root
    if (uri === "/app" || uri === "/app/") {
        request.uri = "/app/index.html";
        return request;
    }

    // React Router inside /app
    if (uri.startsWith("/app/")) {

        // Ignore assets and files with extensions
        if (uri.match(/\.[^\/]+$/)) {
            return request;
        }

        request.uri = "/app/index.html";
        return request;
    }

    // Landing page routes (future-proof)
    if (!uri.match(/\.[^\/]+$/)) {
        request.uri = "/index.html";
    }

    return request;
}