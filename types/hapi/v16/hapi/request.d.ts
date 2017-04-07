
import Events = require("events");
import http = require("http");
import stream = require("stream");
import url = require("url");

import {ServerConnection} from './connection';
import {IDictionary} from './misc';
import {Response} from './response';
import {IRoutePublicInterface} from './route';
import {Server} from './server';

export type RequestExtPoints = 'onRequest' | 'onPreResponse' | 'onPreAuth' | 'onPostAuth' | 'onPreHandler' | 'onPostHandler' | 'onPreResponse';

/** Request object

 The request object is created internally for each incoming request. It is different from the node.js request object received from the HTTP server callback (which is available in request.raw.req). The request object methods and properties change throughout the request lifecycle.
 Request events

 The request object supports the following events:

 'peek' - emitted for each chunk of payload data read from the client connection. The event method signature is function(chunk, encoding).
 'finish' - emitted when the request payload finished reading. The event method signature is function ().
 'disconnect' - emitted when a request errors or aborts unexpectedly.
 var Crypto = require('crypto');
 var Hapi = require('hapi');
 var server = new Hapi.Server();
 server.connection({ port: 80 });

 server.ext('onRequest', function (request, reply) {

var hash = Crypto.createHash('sha1');
request.on('peek', function (chunk) {

hash.update(chunk);
});

request.once('finish', function () {

console.log(hash.digest('hex'));
});

request.once('disconnect', function () {

console.error('request aborted');
});

return reply.continue();
});*/
export class Request extends Events.EventEmitter {
    /** application-specific state. Provides a safe place to store application data without potential conflicts with the framework. Should not be used by plugins which should use plugins[name].*/
    app: any;
    /** authentication information*/
    auth: {
        /** true is the request has been successfully authenticated, otherwise false.*/
        isAuthenticated: boolean;
        /** the credential object received during the authentication process. The presence of an object does not mean successful authentication.  can be set in the validate function's callback.*/
        credentials: any;
        /** an artifact object received from the authentication strategy and used in authentication-related actions.*/
        artifacts: any;
        /** the route authentication mode.*/
        mode: any;
        /** the authentication error is failed and mode set to 'try'.*/
        error: any;
    };
    /** the connection used by this request*/
    connection: ServerConnection;
    /** the node domain object used to protect against exceptions thrown in extensions, handlers and route prerequisites. Can be used to manually bind callback functions otherwise bound to other domains.*/
    domain: any;
    /** the raw request headers (references request.raw.headers).*/
    headers: IDictionary<string>;
    /** a unique request identifier (using the format '{now}:{connection.info.id}:{5 digits counter}').*/
    id: string;
    /** request information */
    info: {
        /** the request preferred encoding. */
        acceptEncoding: string;
        /** if CORS is enabled for the route, contains the following: */
        cors: {
            isOriginMatch: boolean; /** true if the request 'Origin' header matches the configured CORS restrictions. Set to false if no 'Origin' header is found or if it does not match. Note that this is only available after the 'onRequest' extension point as CORS is configured per-route and no routing decisions are made at that point in the request lifecycle. */
        };
        /** content of the HTTP 'Host' header (e.g. 'example.com:8080'). */
        host: string;
        /** the hostname part of the 'Host' header (e.g. 'example.com').*/
        hostname: string;
        /** request reception timestamp. */
        received: number;
        /** content of the HTTP 'Referrer' (or 'Referer') header. */
        referrer: string;
        /** remote client IP address. */
        remoteAddress: string;
        /** remote client port. */
        remotePort: number;
        /** request response timestamp (0 is not responded yet). */
        responded: number;
    };
    /** the request method in lower case (e.g. 'get', 'post'). */
    method: string;
    /** the parsed content-type header. Only available when payload parsing enabled and no payload error occurred. */
    mime: string;
    /** an object containing the values of params, query, and payload before any validation modifications made. Only set when input validation is performed.*/
    orig: {
        params: any;
        query: any;
        payload: any;
    };
    /** an object where each key is a path parameter name with matching value as described in Path parameters.*/
    params: IDictionary<string>;
    /** an array containing all the path params values in the order they appeared in the path.*/
    paramsArray: string[];
    /** the request URI's path component. */
    path: string;
    /** the request payload based on the route payload.output and payload.parse settings.*/
    payload: stream.Readable | Buffer | any;
    /** plugin-specific state. Provides a place to store and pass request-level plugin data. The plugins is an object where each key is a plugin name and the value is the state.*/
    plugins: any;
    /** an object where each key is the name assigned by a route prerequisites function. The values are the raw values provided to the continuation function as argument. For the wrapped response object, use responses.*/
    pre: IDictionary<any>;
    /** the response object when set. The object can be modified but must not be assigned another object. To replace the response with another from within an extension point, use reply(response) to override with a different response. Contains null when no response has been set (e.g. when a request terminates prematurely when the client disconnects).*/
    response: Response;
    /**preResponses - same as pre but represented as the response object created by the pre method.*/
    preResponses: any;
    /**an object containing the query parameters.*/
    query: any;
    /** an object containing the Node HTTP server objects. Direct interaction with these raw objects is not recommended.*/
    raw: {
        req: http.IncomingMessage;
        res: http.ServerResponse;
    };
    /** the route public interface.*/
    route: IRoutePublicInterface;
    /** the server object. */
    server: Server;
    /** an object containing parsed HTTP state information (cookies) where each key is the cookie name and value is the matching cookie content after processing using any registered cookie definition. */
    state: any;
    /** complex object contining details on the url */
    url: {
        /** null when i tested */
        auth: any;
        /** null when i tested */
        hash: any;
        /** null when i tested */
        host: any;
        /** null when i tested */
        hostname: any;
        href: string;
        path: string;
        /** path without search*/
        pathname: string;
        /** null when i tested */
        port: any;
        /** null when i tested */
        protocol: any;
        /** querystring parameters*/
        query: IDictionary<string>;
        /** querystring parameters as a string*/
        search: string;
        /** null when i tested */
        slashes: any;
    };

    /** request.setUrl(url)

     Available only in 'onRequest' extension methods.

     Changes the request URI before the router begins processing the request where:

     url - the new request path value.
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.connection({ port: 80 });

     server.ext('onRequest', function (request, reply) {

    // Change all requests to '/test'
    request.setUrl('/test');
    return reply.continue();
    });*/
    setUrl(url: string | url.Url): void;
    /** request.setMethod(method)

     Available only in 'onRequest' extension methods.

     Changes the request method before the router begins processing the request where:

     method - is the request HTTP method (e.g. 'GET').
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.connection({ port: 80 });

     server.ext('onRequest', function (request, reply) {

    // Change all requests to 'GET'
    request.setMethod('GET');
    return reply.continue();
    });*/
    setMethod(method: string): void;

    /** request.log(tags, [data, [timestamp]])

     Always available.

     Logs request-specific events. When called, the server emits a 'request' event which can be used by other listeners or plugins. The arguments are:

     data - an optional message string or object with the application data being logged.
     timestamp - an optional timestamp expressed in milliseconds. Defaults to Date.now() (now).
     Any logs generated by the server internally will be emitted only on the 'request-internal' channel and will include the event.internal flag set to true.

     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.connection({ port: 80 });

     server.on('request', function (request, event, tags) {

    if (tags.error) {
    console.log(event);
    }
    });

     var handler = function (request, reply) {

    request.log(['test', 'error'], 'Test event');
    return reply();
    };
     */
    log(/** a string or an array of strings (e.g. ['error', 'database', 'read']) used to identify the event. Tags are used instead of log levels and provide a much more expressive mechanism for describing and filtering events.*/
        tags: string | string[],
        /** an optional message string or object with the application data being logged.*/
        data?: any,
        /** an optional timestamp expressed in milliseconds. Defaults to Date.now() (now).*/
        timestamp?: number): void;

    /** request.getLog([tags], [internal])

     Always available.

     Returns an array containing the events matching any of the tags specified (logical OR)
     request.getLog();
     request.getLog('error');
     request.getLog(['error', 'auth']);
     request.getLog(['error'], true);
     request.getLog(false);*/

    getLog(/** is a single tag string or array of tag strings. If no tags specified, returns all events.*/
        tags?: string,
        /** filters the events to only those with a matching event.internal value. If true, only internal logs are included. If false, only user event are included. Defaults to all events (undefined).*/
        internal?: boolean): string[];

    /** request.tail([name])

     Available until immediately after the 'response' event is emitted.

     Adds a request tail which has to complete before the request lifecycle is complete where:

     name - an optional tail name used for logging purposes.
     Returns a tail function which must be called when the tail activity is completed.

     Tails are actions performed throughout the request lifecycle, but which may end after a response is sent back to the client. For example, a request may trigger a database update which should not delay sending back a response. However, it is still desirable to associate the activity with the request when logging it (or an error associated with it).

     When all tails completed, the server emits a 'tail' event.

     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.connection({ port: 80 });

     var get = function (request, reply) {

    var dbTail = request.tail('write to database');

    db.save('key', 'value', function () {

    dbTail();
    });

    return reply('Success!');
    };

     server.route({ method: 'GET', path: '/', handler: get });

     server.on('tail', function (request) {

    console.log('Request completed including db activity');
    });*/
    tail(/** an optional tail name used for logging purposes.*/
        name?: string): Function;
}

export interface IRequestHandler<T> {
    (request: Request): T;
}

export interface ICookieSettings {
    /** - time - to - live in milliseconds.Defaults to null (session time- life - cookies are deleted when the browser is closed).*/
    ttl?: number;
    /** - sets the 'Secure' flag.Defaults to false.*/
    isSecure?: boolean;
    /** - sets the 'HttpOnly' flag.Defaults to false.*/
    isHttpOnly?: boolean;
    /** - the path scope.Defaults to null (no path).*/
    path?: string;
    /** - the domain scope.Defaults to null (no domain).*/
    domain?: any;
    /** - if present and the cookie was not received from the client or explicitly set by the route handler, the cookie is automatically added to the response with the provided value.The value can be a function with signature function(request, next) where:
     request - the request object.
     next - the continuation function using the function(err, value) signature.*/
    autoValue?: (request: Request, next: (err: any, value: any) => void) => void;
    /** - encoding performs on the provided value before serialization.Options are:
     'none' - no encoding.When used, the cookie value must be a string.This is the default value.
     'base64' - string value is encoded using Base64.
     'base64json' - object value is JSON- stringified than encoded using Base64.
     'form' - object value is encoded using the x- www - form - urlencoded method. */
    encoding?: string;
    /** - an object used to calculate an HMAC for cookie integrity validation.This does not provide privacy, only a mean to verify that the cookie value was generated by the server.Redundant when 'iron' encoding is used.Options are:
     integrity - algorithm options.Defaults to require('iron').defaults.integrity.
     password - password used for HMAC key generation. */
    sign?: { integrity: any; password: string; }
    password?: string;
    iron?: any;
    ignoreErrors?: boolean;
    clearInvalid?: boolean;
    strictHeader?: boolean;
    passThrough?: any;
}
