# Worker Runtime

Findkit Workers is a custom V8 runtime which implements some browser APIs such a
fetch, Request, Response, URL, btoa and atob.

We use a recent version of V8 meaning most modern Javascript features
are available but it should be noted that the runtime is not Node.js or the
Browser. So there's no `require()` or any other Node.js APIs available.
