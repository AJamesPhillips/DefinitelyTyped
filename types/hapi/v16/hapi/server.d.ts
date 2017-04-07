
import Events = require("events");
import http = require("http");

import {
    Engine as CatBoxEngine,
    IPolicyOptions as ICatBoxPolicyOptions
} from 'catbox';

import {
    IConnectionConfigurationServerDefaults,
    ServerConnection,
    IServerConnectionInfo,
    IServerConnectionOptions
} from './connection';
import {IServerViewsConfiguration} from './server_views';
import {IDictionary} from './misc';
import {IReply, IStrictReply} from './reply';
import {RequestExtPoints, Request, ICookieSettings} from './request';
import {IRoutePublicInterface, IRouteHandler, IRouteConfiguration} from './route';

export type ServerExtPoints = 'onPreStart' | 'onPostStart' | 'onPreStop' | 'onPostStop';

/** host - optional host to filter routes matching a specific virtual host. Defaults to all virtual hosts.
 The return value is an array where each item is an object containing:
 info - the connection.info the connection the table was generated for.
 labels - the connection labels.
 table - an array of routes where each route contains:
 settings - the route config with defaults applied.
 method - the HTTP method in lower case.
 path - the route path.*/
export interface IConnectionTable {
    info: any;
    labels: any;
    table: IRoutePublicInterface[];
}

/** method - the method function with the signature is one of:
 function(arg1, arg2, ..., argn, next) where:
 arg1, arg2, etc. - the method function arguments.
 next - the function called when the method is done with the signature function(err, result, ttl) where:
 err - error response if the method failed.
 result - the return value.
 ttl - 0 if result is valid but cannot be cached. Defaults to cache policy.
 function(arg1, arg2, ..., argn) where:
 arg1, arg2, etc. - the method function arguments.
 the callback option is set to false.
 the method must returns a value (result, Error, or a promise) or throw an Error.*/
export interface IServerMethod {
    //(): void;
    //(next: (err: any, result: any, ttl: number) => void): void;
    //(arg1: any): void;
    //(arg1: any, arg2: any, next: (err: any, result: any, ttl: number) => void): void;
    //(arg1: any, arg2: any): void;
    (...args: any[]): void;
}

/** options - optional configuration:
 bind - a context object passed back to the method function (via this) when called. Defaults to active context (set via server.bind() when the method is registered.
 cache - the same cache configuration used in server.cache().
 callback - if false, expects the method to be a synchronous function. Note that using a synchronous function with caching will convert the method interface to require a callback as an additional argument with the signature function(err, result, cached, report) since the cache interface cannot return values synchronously. Defaults to true.
 generateKey - a function used to generate a unique key (for caching) from the arguments passed to the method function (the callback argument is not passed as input). The server will automatically generate a unique key if the function's arguments are all of types 'string', 'number', or 'boolean'. However if the method uses other types of arguments, a key generation function must be provided which takes the same arguments as the function and returns a unique string (or null if no key can be generated).*/
export interface IServerMethodOptions {
    bind?: any;
    cache?: ICatBoxPolicyOptions;
    callback?: boolean;
    generateKey?(args: any[]): string;
}

/** Note that the options object is deeply cloned and cannot contain any values that are unsafe to perform deep copy on.*/
export interface IServerOptions {
    /** application-specific configuration which can later be accessed via server.settings.app. Note the difference between server.settings.app which is used to store static configuration values and server.app which is meant for storing run-time state. Defaults to {}.  */
    app?: any;
    /**  sets up server-side caching. Every server includes a default cache for storing application state. By default, a simple memory-based cache is created which has limited capacity and capabilities. hapi uses catbox for its cache which includes support for common storage solutions (e.g. Redis, MongoDB, Memcached, and Riak). Caching is only utilized if methods and plugins explicitly store their state in the cache. The server cache configuration only defines the storage container itself. cache can be assigned:
     a prototype function (usually obtained by calling require() on a catbox strategy such as require('catbox-redis')).
     a configuration object with the following options:
     enginea prototype function or catbox engine object.
     namean identifier used later when provisioning or configuring caching for server methods or plugins. Each cache name must be unique. A single item may omit the name option which defines the default cache. If every cache includes a name, a default memory cache is provisions as well.
     sharedif true, allows multiple cache users to share the same segment (e.g. multiple methods using the same cache storage container). Default to false.
     other options passed to the catbox strategy used.
     an array of the above object for configuring multiple cache instances, each with a unique name. When an array of objects is provided, multiple cache connections are established and each array item (except one) must include a name.  */
    cache?: CatBoxEngine | ICatBoxPolicyOptions | ICatBoxPolicyOptions[];
    /**
     * Removed cache's type union with `any` for the moment as it makes this interface useless for type checking
     * against.  It can be typed correctly by making IServerOptions generic and overloading the server constructor.
     * If the consumer of this typing wants to pass `any` then they should do so explicitly. */

    /** sets the default connections configuration which can be overridden by each connection where:  */
    connections?: IConnectionConfigurationServerDefaults;
    /** determines which logged events are sent to the console (this should only be used for development and does not affect which events are actually logged internally and recorded). Set to false to disable all console logging, or to an object*/
    debug?: boolean | {
        /** - a string array of server log tags to be displayed via console.error() when the events are logged via server.log() as well as internally generated server logs. For example, to display all errors, set the option to ['error']. To turn off all console debug messages set it to false. Defaults to uncaught errors thrown in external code (these errors are handled automatically and result in an Internal Server Error response) or runtime errors due to developer error. */
        log: string[];
        /** - a string array of request log tags to be displayed via console.error() when the events are logged via request.log() as well as internally generated request logs. For example, to display all errors, set the option to ['error']. To turn off all console debug messages set it to false. Defaults to uncaught errors thrown in external code (these errors are handled automatically and result in an Internal Server Error response) or runtime errors due to developer error.*/
        request: string[];
    };
    /** file system related settings*/
    files?: {
        /** sets the maximum number of file etag hash values stored in the etags cache. Defaults to 10000.*/
        etagsCacheMaxSize?: number;
    };
    /** process load monitoring*/
    load?: {
        /** the frequency of sampling in milliseconds. Defaults to 0 (no sampling).*/
        sampleInterval?: number;
    };

    /** options passed to the mimos module (https://github.com/hapijs/mimos) when generating the mime database used by the server and accessed via server.mime.*/
    mime?: any;
    /** if true, does not load the inert (file and directory support), h2o2 (proxy support), and vision (views support) plugins automatically. The plugins can be loaded manually after construction. Defaults to false (plugins loaded). */
    minimal?: boolean;
    /** plugin-specific configuration which can later be accessed via server.settings.plugins. plugins is an object where each key is a plugin name and the value is the configuration. Note the difference between server.settings.plugins which is used to store static configuration values and server.plugins which is meant for storing run-time state. Defaults to {}.*/
    plugins?: IDictionary<any>;

}

/** server.realm http://hapijs.com/api#serverrealm
 The realm object contains server-wide or plugin-specific state that can be shared across various methods. For example, when calling server.bind(),
 the active realm settings.bind property is set which is then used by routes and extensions added at the same level (server root or plugin).
 Realms are a limited version of a sandbox where plugins can maintain state used by the framework when adding routes, extensions, and other properties.
 The server.realm object should be considered read-only and must not be changed directly except for the plugins property can be directly manipulated by the plugins (each setting its own under plugins[name]).
 exports.register = function (server, options, next) {
console.log(server.realm.modifiers.route.prefix);
return next();
};
 */
export interface IServerRealm {
    /** when the server object is provided as an argument to the plugin register() method, modifiers provides the registration preferences passed the server.register() method */
    modifiers: {
        /** routes preferences: */
        route: {
            /** - the route path prefix used by any calls to server.route() from the server. */
            prefix: string;
            /** the route virtual host settings used by any calls to server.route() from the server. */
            vhost: string;
        };

    };
    /** the active plugin name (empty string if at the server root). */
    plugin: string;
    /** plugin-specific state to be shared only among activities sharing the same active state. plugins is an object where each key is a plugin name and the value is the plugin state. */
    plugins: IDictionary<any>;
    /** settings overrides */
    settings: {
        files: {
            relativeTo: any;
        };
        bind: any;
    }
}

/** server.state(name, [options]) http://hapijs.com/api#serverstatename-options
 HTTP state management uses client cookies to persist a state across multiple requests. Registers a cookie definitions where:*/
export interface IServerState {
    /** - the cookie name string. */
    name: string;

    /** - are the optional cookie settings: */
    options: {
        /** - time - to - live in milliseconds.Defaults to null (session time- life - cookies are deleted when the browser is closed).*/
        ttl: number;
        /** - sets the 'Secure' flag.Defaults to false.*/
        isSecure: boolean;
        /** - sets the 'HttpOnly' flag.Defaults to false.*/
        isHttpOnly: boolean
        /** - the path scope.Defaults to null (no path).*/
        path: any;
        /** - the domain scope.Defaults to null (no domain). */
        domain: any;
        /** if present and the cookie was not received from the client or explicitly set by the route handler, the cookie is automatically added to the response with the provided value. The value can be a function with signature function(request, next) where:
         request - the request object.
         next - the continuation function using the function(err, value) signature.*/
        autoValue: (request: Request, next: (err: any, value: any) => void) => void;
        /** - encoding performs on the provided value before serialization. Options are:
         'none' - no encoding. When used, the cookie value must be a string. This is the default value.
         'base64' - string value is encoded using Base64.
         'base64json' - object value is JSON-stringified than encoded using Base64.
         'form' - object value is encoded using the x-www-form-urlencoded method.
         'iron' - Encrypts and sign the value using iron.*/
        encoding: string;
        /** - an object used to calculate an HMAC for cookie integrity validation.This does not provide privacy, only a mean to verify that the cookie value was generated by the server.Redundant when 'iron' encoding is used.Options are:*/
        sign: {
            /** - algorithm options.Defaults to require('iron').defaults.integrity.*/
            integrity: any;
            /** - password used for HMAC key generation.*/
            password: string;
        };
        /** - password used for 'iron' encoding.*/
        password: string;
        /** - options for 'iron' encoding.Defaults to require('iron').defaults.*/
        iron: any;
        /** - if false, errors are ignored and treated as missing cookies.*/
        ignoreErrors: boolean;
        /** - if true, automatically instruct the client to remove invalid cookies.Defaults to false.*/
        clearInvalid: boolean;
        /** - if false, allows any cookie value including values in violation of RFC 6265. Defaults to true.*/
        strictHeader: boolean;
        /** - overrides the default proxy localStatePassThrough setting.*/
        passThrough: any;
    };
}

export interface IServerAuthScheme {
    /** authenticate(request, reply) - required function called on each incoming request configured with the authentication scheme where:
     request - the request object.
     reply - the reply interface the authentication method must call when done authenticating the request where:
     reply(err, response, result) - is called if authentication failed where:
     err - any authentication error.
     response - any authentication response action such as redirection. Ignored if err is present, otherwise required.
     result - an object containing:
     credentials - the authenticated credentials.
     artifacts - optional authentication artifacts.
     reply.continue(result) - is called if authentication succeeded where:
     result - same object as result above.
     When the scheme authenticate() method implementation calls reply() with an error condition, the specifics of the error affect whether additional authentication strategies will be attempted if configured for the route.
     .If the err returned by the reply() method includes a message, no additional strategies will be attempted.
     If the err does not include a message but does include a scheme name (e.g. Boom.unauthorized(null, 'Custom')), additional strategies will be attempted in order of preference.
     var server = new Hapi.Server();
     server.connection({ port: 80 });
     var scheme = function (server, options) {
    return {
    authenticate: function (request, reply) {
    var req = request.raw.req;
    var authorization = req.headers.authorization;
    if (!authorization) {
    return reply(Boom.unauthorized(null, 'Custom'));
    }
    return reply(null, { credentials: { user: 'john' } });
    }
    };
    };
     server.auth.scheme('custom', scheme);*/
    authenticate(request: Request, reply: IReply): void;
    authenticate<T>(request: Request, reply: IStrictReply<T>): void;
    /** payload(request, reply) - optional function called to authenticate the request payload where:
     request - the request object.
     reply(err, response) - is called if authentication failed where:
     err - any authentication error.
     response - any authentication response action such as redirection. Ignored if err is present, otherwise required.
     reply.continue() - is called if payload authentication succeeded.
     When the scheme payload() method returns an error with a message, it means payload validation failed due to bad payload. If the error has no message but includes a scheme name (e.g. Boom.unauthorized(null, 'Custom')), authentication may still be successful if the route auth.payload configuration is set to 'optional'.*/
    payload?(request: Request, reply: IReply): void;
    payload?<T>(request: Request, reply: IStrictReply<T>): void;
    /** response(request, reply) - optional function called to decorate the response with authentication headers before the response headers or payload is written where:
     request - the request object.
     reply(err, response) - is called if an error occurred where:
     err - any authentication error.
     response - any authentication response to send instead of the current response. Ignored if err is present, otherwise required.
     reply.continue() - is called if the operation succeeded.*/
    response?(request: Request, reply: IReply): void;
    response?<T>(request: Request, reply: IStrictReply<T>): void;
    /** an optional object  */
    options?: {
        /** if true, requires payload validation as part of the scheme and forbids routes from disabling payload auth validation. Defaults to false.*/
        payload: boolean;
    }
}

/**the response object where:
 statusCode - the HTTP status code.
 headers - an object containing the headers set.
 payload - the response payload string.
 rawPayload - the raw response payload buffer.
 raw - an object with the injection request and response objects:
 req - the simulated node request object.
 res - the simulated node response object.
 result - the raw handler response (e.g. when not a stream or a view) before it is serialized for transmission. If not available, the value is set to payload. Useful for inspection and reuse of the internal objects returned (instead of parsing the response string).
 request - the request object.*/
export interface IServerInjectResponse {
    statusCode: number;
    headers: IDictionary<string>;
    payload: string;
    rawPayload: Buffer;
    raw: {
        req: http.IncomingMessage;
        res: http.ServerResponse
    };
    result: string;
    request: Request;
}

export interface IServerInject {
    (options: string | IServerInjectOptions, callback: (res: IServerInjectResponse) => void): void;
    (options: string | IServerInjectOptions): Promise<IServerInjectResponse>;
}

export interface IServerInjectOptions {
    /** the request HTTP method (e.g. 'POST'). Defaults to 'GET'.*/
    method: string;
    /** the request URL. If the URI includes an authority (e.g. 'example.com:8080'), it is used to automatically set an HTTP 'Host' header, unless one was specified in headers.*/
    url: string;
    /** an object with optional request headers where each key is the header name and the value is the header content. Defaults to no additions to the default Shot headers.*/
    headers?: IDictionary<string>;
    /** n optional string, buffer or object containing the request payload. In case of an object it will be converted to a string for you. Defaults to no payload. Note that payload processing defaults to 'application/json' if no 'Content-Type' header provided.*/
    payload?: string | {} | Buffer;
    /** an optional credentials object containing authentication information. The credentials are used to bypass the default authentication strategies, and are validated directly as if they were received via an authentication scheme. Defaults to no credentials.*/
    credentials?: any;
    /** an optional artifacts object containing authentication artifact information. The artifacts are used to bypass the default authentication strategies, and are validated directly as if they were received via an authentication scheme. Ignored if set without credentials. Defaults to no artifacts.*/
    artifacts?: any;
    /** sets the initial value of request.app*/
    app?: any;
    /** sets the initial value of request.plugins*/
    plugins?: any;
    /** allows access to routes with config.isInternal set to true. Defaults to false.*/
    allowInternals?: boolean;
    /** sets the remote address for the incoming connection.*/
    remoteAddress?: boolean;
    /**object with options used to simulate client request stream conditions for testing:
     error - if true, emits an 'error' event after payload transmission (if any). Defaults to false.
     close - if true, emits a 'close' event after payload transmission (if any). Defaults to false.
     end - if false, does not end the stream. Defaults to true.*/
    simulate?: {
        error: boolean;
        close: boolean;
        end: boolean;
    };
}

/** Server http://hapijs.com/api#server
 The Server object is the main application container. The server manages all incoming connections along with all the facilities provided by the framework. A server can contain more than one connection (e.g. listen to port 80 and 8080).
 Server events
 The server object inherits from Events.EventEmitter and emits the following events:
 'log' - events logged with server.log() and server events generated internally by the framework.
 'start' - emitted when the server is started using server.start().
 'stop' - emitted when the server is stopped using server.stop().
 'request' - events generated by request.log(). Does not include any internally generated events.
 'request-internal' - request events generated internally by the framework (multiple events per request).
 'request-error' - emitted whenever an Internal Server Error (500) error response is sent. Single event per request.
 'response' - emitted after the response is sent back to the client (or when the client connection closed and no response sent, in which case request.response is null). Single event per request.
 'tail' - emitted when a request finished processing, including any registered tails. Single event per request.
 Note that the server object should not be used to emit application events as its internal implementation is designed to fan events out to the various plugin selections and not for application events.
 MORE EVENTS HERE: http://hapijs.com/api#server-events*/
export class Server extends Events.EventEmitter {

    constructor(options?: IServerOptions);

    /** Provides a safe place to store server-specific run-time application data without potential conflicts with the framework internals. The data can be accessed whenever the server is accessible. Initialized with an empty object.
     var Hapi = require('hapi');
     server = new Hapi.Server();
     server.app.key = 'value';
     var handler = function (request, reply) {
    return reply(request.server.app.key);
    }; */
    app: any;
    /** An array containing the server's connections. When the server object is returned from server.select(), the connections array only includes the connections matching the selection criteria.
     var server = new Hapi.Server();
     server.connection({ port: 80, labels: 'a' });
     server.connection({ port: 8080, labels: 'b' });
     // server.connections.length === 2
     var a = server.select('a');
     // a.connections.length === 1*/
    connections: ServerConnection[];
    /** When the server contains exactly one connection, info is an object containing information about the sole connection.
     * When the server contains more than one connection, each server.connections array member provides its own connection.info.
     var server = new Hapi.Server();
     server.connection({ port: 80 });
     // server.info.port === 80
     server.connection({ port: 8080 });
     // server.info === null
     // server.connections[1].info.port === 8080
     */
    info: IServerConnectionInfo;
    /** An object containing the process load metrics (when load.sampleInterval is enabled):
     rss - RSS memory usage.
     var Hapi = require('hapi');
     var server = new Hapi.Server({ load: { sampleInterval: 1000 } });
     console.log(server.load.rss);*/
    load: {
        /** - event loop delay milliseconds.*/
        eventLoopDelay: number;
        /** - V8 heap usage.*/
        heapUsed: number;
    };
    /** When the server contains exactly one connection, listener is the node HTTP server object of the sole connection.
     When the server contains more than one connection, each server.connections array member provides its own connection.listener.
     var Hapi = require('hapi');
     var SocketIO = require('socket.io');
     var server = new Hapi.Server();
     server.connection({ port: 80 });
     var io = SocketIO.listen(server.listener);
     io.sockets.on('connection', function(socket) {
    socket.emit({ msg: 'welcome' });
    });*/
    listener: http.Server;

    /** server.methods
     An object providing access to the server methods where each server method name is an object property.
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.method('add', function (a, b, next) {
    return next(null, a + b);
    });
     server.methods.add(1, 2, function (err, result) {
    // result === 3
    });*/
    methods: IDictionary<Function>;

    /** server.mime
     Provides access to the server MIME database used for setting content-type information. The object must not be modified directly but only through the mime server setting.
     var Hapi = require('hapi');
     var options = {
    mime: {
    override: {
    'node/module': {
    source: 'steve',
    compressible: false,
    extensions: ['node', 'module', 'npm'],
    type: 'node/module'
    }
    }
    }
    };
     var server = new Hapi.Server(options);
     // server.mime.path('code.js').type === 'application/javascript'
     // server.mime.path('file.npm').type === 'node/module'*/
    mime: any;
    /**server.plugins
     An object containing the values exposed by each plugin registered where each key is a plugin name and the values are the exposed properties by each plugin using server.expose(). Plugins may set the value of the server.plugins[name] object directly or via the server.expose() method.
     exports.register = function (server, options, next) {
    server.expose('key', 'value');
    // server.plugins.example.key === 'value'
    return next();
    };
     exports.register.attributes = {
    name: 'example'
    };*/
    plugins: IDictionary<any>;
    /** server.realm
     The realm object contains server-wide or plugin-specific state that can be shared across various methods. For example, when calling server.bind(), the active realm settings.bind property is set which is then used by routes and extensions added at the same level (server root or plugin). Realms are a limited version of a sandbox where plugins can maintain state used by the framework when adding routes, extensions, and other properties.
     modifiers - when the server object is provided as an argument to the plugin register() method, modifiers provides the registration preferences passed the server.register() method and includes:
     route - routes preferences:
     prefix - the route path prefix used by any calls to server.route() from the server.
     vhost - the route virtual host settings used by any calls to server.route() from the server.
     plugin - the active plugin name (empty string if at the server root).
     plugins - plugin-specific state to be shared only among activities sharing the same active state. plugins is an object where each key is a plugin name and the value is the plugin state.
     settings - settings overrides:
     files.relativeTo
     bind
     The server.realm object should be considered read-only and must not be changed directly except for the plugins property can be directly manipulated by the plugins (each setting its own under plugins[name]).
     exports.register = function (server, options, next) {
    console.log(server.realm.modifiers.route.prefix);
    return next();
    };*/
    realm: IServerRealm;

    /** server.root
     The root server object containing all the connections and the root server methods (e.g. start(), stop(), connection()).*/
    root: Server;
    /** server.settings
     The server configuration object after defaults applied.
     var Hapi = require('hapi');
     var server = new Hapi.Server({
    app: {
    key: 'value'
    }
    });
     // server.settings.app === { key: 'value' }*/
    settings: IServerOptions;

    /** server.version
     The hapi module version number.
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     // server.version === '8.0.0'*/
    version: string;

    /** server.after(method, [dependencies])
     Adds a method to be called after all the plugin dependencies have been registered and before the server starts (only called if the server is started) where:
     after - the method with signature function(plugin, next) where:
     server - server object the after() method was called on.
     next - the callback function the method must call to return control over to the application and complete the registration process. The function signature is function(err) where:
     err - internal error which is returned back via the server.start() callback.
     dependencies - a string or array of string with the plugin names to call this method after their after() methods. There is no requirement for the other plugins to be registered. Setting dependencies only arranges the after methods in the specified order.
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.connection({ port: 80 });
     server.after(function () {
    // Perform some pre-start logic
    });
     server.start(function (err) {
    // After method already executed
    });
     server.auth.default(options)*/
    after(method: (plugin: any, next: (err: any) => void) => void, dependencies: string | string[]): void;

    auth: {
        /** server.auth.api
         An object where each key is a strategy name and the value is the exposed strategy API. Available on when the authentication scheme exposes an API by returning an api key in the object returned from its implementation function.
         When the server contains more than one connection, each server.connections array member provides its own connection.auth.api object.
         const server = new Hapi.Server();
         server.connection({ port: 80 });
         const scheme = function (server, options) {
        return {
        api: {
        settings: {
        x: 5
        }
        },
        authenticate: function (request, reply) {
        const req = request.raw.req;
        const authorization = req.headers.authorization;
        if (!authorization) {
        return reply(Boom.unauthorized(null, 'Custom'));
        }
        return reply.continue({ credentials: { user: 'john' } });
        }
        };
        };
         server.auth.scheme('custom', scheme);
         server.auth.strategy('default', 'custom');
         console.log(server.auth.api.default.settings.x);    // 5
         */
        api: IDictionary<any>;
        /** server.auth.default(options)
         Sets a default strategy which is applied to every route where:
         options - a string with the default strategy name or an object with a specified strategy or strategies using the same format as the route auth handler options.
         The default does not apply when the route config specifies auth as false, or has an authentication strategy configured. Otherwise, the route authentication config is applied to the defaults. Note that the default only applies at time of route configuration, not at runtime. Calling default() after adding a route will have no impact on routes added prior.
         The default auth strategy configuration can be accessed via connection.auth.settings.default.
         var server = new Hapi.Server();
         server.connection({ port: 80 });
         server.auth.scheme('custom', scheme);
         server.auth.strategy('default', 'custom');
         server.auth.default('default');
         server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
        return reply(request.auth.credentials.user);
        }
        });*/
        default(options: string): void;
        default(options: { strategy: string }): void;
        default(options: { strategies: string[] }): void;
        /** server.auth.scheme(name, scheme)
         Registers an authentication scheme where:
         name - the scheme name.
         scheme - the method implementing the scheme with signature function(server, options) where:
         server - a reference to the server object the scheme is added to.
         options - optional scheme settings used to instantiate a strategy.*/
        scheme(name: string,
            /** When the scheme authenticate() method implementation calls reply() with an error condition, the specifics of the error affect whether additional authentication strategies will be attempted if configured for the route. If the err returned by the reply() method includes a message, no additional strategies will be attempted. If the err does not include a message but does include a scheme name (e.g. Boom.unauthorized(null, 'Custom')), additional strategies will be attempted in order of preference.
             n the scheme payload() method returns an error with a message, it means payload validation failed due to bad payload. If the error has no message but includes a scheme name (e.g. Boom.unauthorized(null, 'Custom')), authentication may still be successful if the route auth.payload configuration is set to 'optional'.
             server = new Hapi.Server();
             server.connection({ port: 80 });
             scheme = function (server, options) {
         urn {
         authenticate: function (request, reply) {
         req = request.raw.req;
         var authorization = req.headers.authorization;
         if (!authorization) {
         return reply(Boom.unauthorized(null, 'Custom'));
         }
         urn reply(null, { credentials: { user: 'john' } });
         }
         };
         };
             */
            scheme: (server: Server, options: any) => IServerAuthScheme): void;

        /** server.auth.strategy(name, scheme, [mode], [options])
         Registers an authentication strategy where:
         name - the strategy name.
         scheme - the scheme name (must be previously registered using server.auth.scheme()).
         mode - if true, the scheme is automatically assigned as a required strategy to any route without an auth config. Can only be assigned to a single server strategy. Value must be true (which is the same as 'required') or a valid authentication mode ('required', 'optional', 'try'). Defaults to false.
         options - scheme options based on the scheme requirements.
         var server = new Hapi.Server();
         server.connection({ port: 80 });
         server.auth.scheme('custom', scheme);
         server.auth.strategy('default', 'custom');
         server.route({
        method: 'GET',
        path: '/',
        config: {
        auth: 'default',
        handler: function (request, reply) {
        return reply(request.auth.credentials.user);
        }
        }
        });*/
            strategy(name: string, scheme: string, mode?: boolean | string, options?: any): void;
            strategy(name: string, scheme: string, mode?: boolean | string): void;
            strategy(name: string, scheme: string, options?:any): void;

        /** server.auth.test(strategy, request, next)
         Tests a request against an authentication strategy where:
         strategy - the strategy name registered with server.auth.strategy().
         request - the request object.
         next - the callback function with signature function(err, credentials) where:
         err - the error if authentication failed.
         credentials - the authentication credentials object if authentication was successful.
         Note that the test() method does not take into account the route authentication configuration. It also does not perform payload authentication. It is limited to the basic strategy authentication execution. It does not include verifying scope, entity, or other route properties.
         var server = new Hapi.Server();
         server.connection({ port: 80 });
         server.auth.scheme('custom', scheme);
         server.auth.strategy('default', 'custom');
         server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
        request.server.auth.test('default', request, function (err, credentials) {
        if (err) {
        return reply({ status: false });
        }
        return reply({ status: true, user: credentials.name });
        });
        }
        });*/
        test(strategy: string, request: Request, next: (err: any, credentials: any) => void): void;
    };

    /** server.bind(context)
     Sets a global context used as the default bind object when adding a route or an extension where:
     context - the object used to bind this in handler and extension methods.
     When setting context inside a plugin, the context is applied only to methods set up by the plugin. Note that the context applies only to routes and extensions added after it has been set.
     var handler = function (request, reply) {
    return reply(this.message);
    };
     exports.register = function (server, options, next) {
    var bind = {
    message: 'hello'
    };
    server.bind(bind);
    server.route({ method: 'GET', path: '/', handler: handler });
    return next();
    };*/
    bind(context: any): void;


    /** server.cache(options)
     Provisions a cache segment within the server cache facility where:
     options - catbox policy configuration where:
     expiresIn - relative expiration expressed in the number of milliseconds since the item was saved in the cache. Cannot be used together with expiresAt.
     expiresAt - time of day expressed in 24h notation using the 'HH:MM' format, at which point all cache records expire. Uses local time. Cannot be used together with expiresIn.
     generateFunc - a function used to generate a new cache item if one is not found in the cache when calling get(). The method's signature is function(id, next) where: - id - the id string or object provided to the get() method. - next - the method called when the new item is returned with the signature function(err, value, ttl) where: - err - an error condition. - value - the new value generated. - ttl - the cache ttl value in milliseconds. Set to 0 to skip storing in the cache. Defaults to the cache global policy.
     staleIn - number of milliseconds to mark an item stored in cache as stale and attempt to regenerate it when generateFunc is provided. Must be less than expiresIn.
     staleTimeout - number of milliseconds to wait before checking if an item is stale.
     generateTimeout - number of milliseconds to wait before returning a timeout error when the generateFunc function takes too long to return a value. When the value is eventually returned, it is stored in the cache for future requests.
     cache - the cache name configured in 'server.cache`. Defaults to the default cache.
     segment - string segment name, used to isolate cached items within the cache partition. When called within a plugin, defaults to '!name' where 'name' is the plugin name. Required when called outside of a plugin.
     shared - if true, allows multiple cache provisions to share the same segment. Default to false.
     var server = new Hapi.Server();
     server.connection({ port: 80 });
     var cache = server.cache({ segment: 'countries', expiresIn: 60 * 60 * 1000 });
     cache.set('norway', { capital: 'oslo' }, null, function (err) {
    cache.get('norway', function (err, value, cached, log) {
    // value === { capital: 'oslo' };
    });
    });*/
    cache(options: ICatBoxPolicyOptions): void;

    /** server.connection([options])
     Adds an incoming server connection
     Returns a server object with the new connection selected.
     Must be called before any other server method that modifies connections is called for it to apply to the new connection (e.g. server.state()).
     Note that the options object is deeply cloned (with the exception of listener which is shallowly copied) and cannot contain any values that are unsafe to perform deep copy on.
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     var web = server.connection({ port: 8000, host: 'example.com', labels: ['web'] });
     var admin = server.connection({ port: 8001, host: 'example.com', labels: ['admin'] });
     // server.connections.length === 2
     // web.connections.length === 1
     // admin.connections.length === 1 */
    connection(options: IServerConnectionOptions): Server;

    /** server.decorate(type, property, method, [options])
     Extends various framework interfaces with custom methods where:
     type - the interface being decorated. Supported types:
     'reply' - adds methods to the reply interface.
     'server' - adds methods to the Server object.
     property - the object decoration key name.
     method - the extension function.
     options - if the type is 'request', supports the following optional settings:
     'apply' - if true, the method function is invoked using the signature function(request) where request is the current request object and the returned value is assigned as the decoration.
     Note that decorations apply to the entire server and all its connections regardless of current selection.
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.connection({ port: 80 });
     server.decorate('reply', 'success', function () {
    return this.response({ status: 'ok' });
    });
     server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
    return reply.success();
    }
    });*/
    decorate(type: string, property: string, method: Function, options?: { apply: boolean }): void;

    /** server.dependency(dependencies, [after])
     Used within a plugin to declares a required dependency on other plugins where:
     dependencies - a single string or array of plugin name strings which must be registered in order for this plugin to operate. Plugins listed must be registered before the server is started. Does not provide version dependency which should be implemented using npm peer dependencies.
     after - an optional function called after all the specified dependencies have been registered and before the server starts. The function is only called if the server is started. If a circular dependency is detected, an exception is thrown (e.g. two plugins each has an after function to be called after the other). The function signature is function(server, next) where:
     server - the server the dependency() method was called on.
     next - the callback function the method must call to return control over to the application and complete the registration process. The function signature is function(err) where:
     err - internal error condition, which is returned back via the server.start() callback.
     exports.register = function (server, options, next) {
    server.dependency('yar', after);
    return next();
    };
     var after = function (server, next) {
    // Additional plugin registration logic
    return next();
    };*/
    dependency(dependencies: string | string[], after?: (server: Server, next: (err: any) => void) => void): void;


    /** server.expose(key, value)
     Used within a plugin to expose a property via server.plugins[name] where:
     key - the key assigned (server.plugins[name][key]).
     value - the value assigned.
     exports.register = function (server, options, next) {
    server.expose('util', function () { console.log('something'); });
    return next();
    };*/
    expose(key: string, value: any): void;

    /** server.expose(obj)
     Merges a deep copy of an object into to the existing content of server.plugins[name] where:
     obj - the object merged into the exposed properties container.
     exports.register = function (server, options, next) {
    server.expose({ util: function () { console.log('something'); } });
    return next();
    };*/
    expose(obj: any): void;

    /** server.ext(event, method, [options])
     Registers an extension function in one of the available extension points where:
     event - the event name.
     method - a function or an array of functions to be executed at a specified point during request processing. The required extension function signature is function(request, reply) where:
     request - the request object. NOTE: Access the Response via request.response
     reply - the reply interface which is used to return control back to the framework. To continue normal execution of the request lifecycle, reply.continue() must be called. To abort processing and return a response to the client, call reply(value) where value is an error or any other valid response.
     this - the object provided via options.bind or the current active context set with server.bind().
     options - an optional object with the following:
     before - a string or array of strings of plugin names this method must execute before (on the same event). Otherwise, extension methods are executed in the order added.
     after - a string or array of strings of plugin names this method must execute after (on the same event). Otherwise, extension methods are executed in the order added.
     bind - a context object passed back to the provided method (via this) when called.
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.connection({ port: 80 });
     server.ext('onRequest', function (request, reply) {
    // Change all requests to '/test'
    request.setUrl('/test');
    return reply.continue();
    });
     var handler = function (request, reply) {
    return reply({ status: 'ok' });
    };
     server.route({ method: 'GET', path: '/test', handler: handler });
     server.start();
     // All requests will get routed to '/test'*/
    ext(event: RequestExtPoints, method: (request: Request, reply: IReply, bind?: any) => void, options?: { before: string | string[]; after: string | string[]; bind?: any }): void;
    ext<T>(event: RequestExtPoints, method: (request: Request, reply: IStrictReply<T>, bind?: any) => void, options?: { before: string | string[]; after: string | string[]; bind?: any }): void;
    ext(event: ServerExtPoints, method: (server: Server, next: (err?: any) => void, bind?: any) => void, options?: { before: string | string[]; after: string | string[]; bind?: any }): void;

    /** server.handler(name, method)
     Registers a new handler type to be used in routes where:
     name - string name for the handler being registered. Cannot override the built-in handler types (directory, file, proxy, and view) or any previously registered type.
     method - the function used to generate the route handler using the signature function(route, options) where:
     route - the route public interface object.
     options - the configuration object provided in the handler config.
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.connection({ host: 'localhost', port: 8000 });
     // Defines new handler for routes on this server
     server.handler('test', function (route, options) {
    return function (request, reply) {
    return reply('new handler: ' + options.msg);
    }
    });
     server.route({
    method: 'GET',
    path: '/',
    handler: { test: { msg: 'test' } }
    });
     server.start();
     The method function can have a defaults object or function property. If the property is set to an object, that object is used as the default route config for routes using this handler. If the property is set to a function, the function uses the signature function(method) and returns the route default configuration.
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.connection({ host: 'localhost', port: 8000 });
     var handler = function (route, options) {
    return function (request, reply) {
    return reply('new handler: ' + options.msg);
    }
    };
     // Change the default payload processing for this handler
     handler.defaults = {
    payload: {
    output: 'stream',
    parse: false
    }
    };
     server.handler('test', handler);*/
    handler<THandlerConfig>(name: string, method: (route: IRoutePublicInterface, options: THandlerConfig) => IRouteHandler): void;

    /** server.initialize([callback])
     Initializes the server (starts the caches, finalizes plugin registration) but does not start listening
     on the connection ports, where:
     - `callback` - the callback method when server initialization is completed or failed with the signature
     `function(err)` where:
     - `err` - any initialization error condition.

     If no `callback` is provided, a `Promise` object is returned.

     Note that if the method fails and the callback includes an error, the server is considered to be in
     an undefined state and should be shut down. In most cases it would be impossible to fully recover as
     the various plugins, caches, and other event listeners will get confused by repeated attempts to
     start the server or make assumptions about the healthy state of the environment. It is recommended
     to assert that no error has been returned after calling `initialize()` to abort the process when the
     server fails to start properly. If you must try to resume after an error, call `server.stop()`
     first to reset the server state.
     */
    initialize(callback?: (error: any) => void): Promise<void>;

    /** When the server contains exactly one connection, injects a request into the sole connection simulating an incoming HTTP request without making an actual socket connection.
     Injection is useful for testing purposes as well as for invoking routing logic internally without the overhead or limitations of the network stack.
     Utilizes the [shot module | https://github.com/hapijs/shot ] for performing injections, with some additional options and response properties
     * When the server contains more than one connection, each server.connections array member provides its own connection.inject().
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.connection({ port: 80 });
     var handler = function (request, reply) {
    return reply('Success!');
    };
     server.route({ method: 'GET', path: '/', handler: handler });
     server.inject('/', function (res) {
    console.log(res.result);
    });
     */
    inject: IServerInject;

    /** server.log(tags, [data, [timestamp]])
     Logs server events that cannot be associated with a specific request. When called the server emits a 'log' event which can be used by other listeners or plugins to record the information or output to the console. The arguments are:
     tags - a string or an array of strings (e.g. ['error', 'database', 'read']) used to identify the event. Tags are used instead of log levels and provide a much more expressive mechanism for describing and filtering events. Any logs generated by the server internally include the 'hapi' tag along with event-specific information.
     data - an optional message string or object with the application data being logged.
     timestamp - an optional timestamp expressed in milliseconds. Defaults to Date.now() (now).
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.connection({ port: 80 });
     server.on('log', function (event, tags) {
    if (tags.error) {
    console.log(event);
    }
    });
     server.log(['test', 'error'], 'Test event');*/
    log(tags: string | string[], data?: string | any, timestamp?: number): void;

    /**server.lookup(id)
     When the server contains exactly one connection, looks up a route configuration where:
     id - the route identifier as set in the route options.
     returns the route public interface object if found, otherwise null.
     var server = new Hapi.Server();
     server.connection();
     server.route({
    method: 'GET',
    path: '/',
    config: {
    handler: function (request, reply) { return reply(); },
    id: 'root'
    }
    });
     var route = server.lookup('root');
     When the server contains more than one connection, each server.connections array member provides its own connection.lookup() method.*/
    lookup(id: string): IRoutePublicInterface;

    /** server.match(method, path, [host])
     When the server contains exactly one connection, looks up a route configuration where:
     method - the HTTP method (e.g. 'GET', 'POST').
     path - the requested path (must begin with '/').
     host - optional hostname (to match against routes with vhost).
     returns the route public interface object if found, otherwise null.
     var server = new Hapi.Server();
     server.connection();
     server.route({
    method: 'GET',
    path: '/',
    config: {
    handler: function (request, reply) { return reply(); },
    id: 'root'
    }
    });
     var route = server.match('get', '/');
     When the server contains more than one connection, each server.connections array member provides its own connection.match() method.*/
    match(method: string, path: string, host?: string): IRoutePublicInterface;


    /** server.method(name, method, [options])
     Registers a server method. Server methods are functions registered with the server and used throughout the application as a common utility. Their advantage is in the ability to configure them to use the built-in cache and share across multiple request handlers without having to create a common module.
     Methods are registered via server.method(name, method, [options])
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.connection({ port: 80 });
     // Simple arguments
     var add = function (a, b, next) {
    return next(null, a + b);
    };
     server.method('sum', add, { cache: { expiresIn: 2000 } });
     server.methods.sum(4, 5, function (err, result) {
    console.log(result);
    });
     // Object argument
     var addArray = function (array, next) {
    var sum = 0;
    array.forEach(function (item) {
    sum += item;
    });
    return next(null, sum);
    };
     server.method('sumObj', addArray, {
    cache: { expiresIn: 2000 },
    generateKey: function (array) {
    return array.join(',');
    }
    });
     server.methods.sumObj([5, 6], function (err, result) {
    console.log(result);
    });
     // Synchronous method with cache
     var addSync = function (a, b) {
    return a + b;
    };
     server.method('sumSync', addSync, { cache: { expiresIn: 2000 }, callback: false });
     server.methods.sumSync(4, 5, function (err, result) {
    console.log(result);
    }); */
    method(/** a unique method name used to invoke the method via server.methods[name]. When configured with caching enabled, server.methods[name].cache.drop(arg1, arg2, ..., argn, callback) can be used to clear the cache for a given key. Supports using nested names such as utils.users.get which will automatically create the missing path under server.methods and can be accessed for the previous example via server.methods.utils.users.get.*/
        name: string,
        method: IServerMethod,
        options?: IServerMethodOptions): void;


    /**server.method(methods)
     Registers a server method function as described in server.method() using a configuration object where:
     methods - an object or an array of objects where each one contains:
     name - the method name.
     method - the method function.
     options - optional settings.
     var add = function (a, b, next) {
    next(null, a + b);
    };
     server.method({
    name: 'sum',
    method: add,
    options: {
    cache: {
    expiresIn: 2000
    }
    }
    });*/
    method(methods: {
        name: string; method: IServerMethod; options?: IServerMethodOptions
    } | Array<{
        name: string; method: IServerMethod; options?: IServerMethodOptions
    }>): void;

    /**server.path(relativeTo)
     Sets the path prefix used to locate static resources (files and view templates) when relative paths are used where:
     relativeTo - the path prefix added to any relative file path starting with '.'.
     Note that setting a path within a plugin only applies to resources accessed by plugin methods. If no path is set, the connection files.relativeTo configuration is used. The path only applies to routes added after it has been set.
     exports.register = function (server, options, next) {
    server.path(__dirname + '../static');
    server.route({ path: '/file', method: 'GET', handler: { file: './test.html' } });
    next();
    };*/
    path(relativeTo: string): void;


    /**
     * server.register(plugins, [options], callback)
     * Registers a plugin where:
     * plugins - an object or array of objects where each one is either:
     * a plugin registration function.
     * an object with the following:
     * register - the plugin registration function.
     * options - optional options passed to the registration function when called.
     * options - optional registration options (different from the options passed to the registration function):
     * select - a string or array of string labels used to pre-select connections for plugin registration.
     * routes - modifiers applied to each route added by the plugin:
     * prefix - string added as prefix to any route path (must begin with '/'). If a plugin registers a child plugin the prefix is passed on to the child or is added in front of the child-specific prefix.
     * vhost - virtual host string (or array of strings) applied to every route. The outer-most vhost overrides the any nested configuration.
     * callback - the callback function with signature function(err) where:
     * err - an error returned from the registration function. Note that exceptions thrown by the registration function are not handled by the framework.
     *
     * If no callback is provided, a Promise object is returned.
     */
    register(plugins: any | any[], options: {
        select: string | string[];
        routes: {
            prefix: string; vhost?: string | string[]
        };
    }, callback: (err: any) => void): void;
    register(plugins: any | any[], options: {
        select: string | string[];
        routes: {
            prefix: string; vhost?: string | string[]
        };
    }): Promise<any>;

    register(plugins: any | any[], callback: (err: any) => void): void;
    register(plugins: any | any[]): Promise<any>;

    /**server.render(template, context, [options], callback)
     Utilizes the server views manager to render a template where:
     template - the template filename and path, relative to the views manager templates path (path or relativeTo).
     context - optional object used by the template to render context-specific result. Defaults to no context ({}).
     options - optional object used to override the views manager configuration.
     callback - the callback function with signature function (err, rendered, config) where:
     err - the rendering error if any.
     rendered - the result view string.
     config - the configuration used to render the template.
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.connection({ port: 80 });
     server.views({
    engines: { html: require('handlebars') },
    path: __dirname + '/templates'
    });
     var context = {
    title: 'Views Example',
    message: 'Hello, World'
    };
     server.render('hello', context, function (err, rendered, config) {
    console.log(rendered);
    });*/
    render(template: string, context: any, options: any, callback: (err: any, rendered: any, config: any) => void): void;

    /** server.route(options)
     Adds a connection route where:
     options - a route configuration object or an array of configuration objects.
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.connection({ port: 80 });
     server.route({ method: 'GET', path: '/', handler: function (request, reply) { return reply('ok'); } });
     server.route([
     { method: 'GET', path: '/1', handler: function (request, reply) { return reply('ok'); } },
     { method: 'GET', path: '/2', handler: function (request, reply) { return reply('ok'); } }
     ]);*/
    route(options: IRouteConfiguration[]): void;
    route(options: IRouteConfiguration): void;

    /**server.select(labels)
     Selects a subset of the server's connections where:
     labels - a single string or array of strings of labels used as a logical OR statement to select all the connections with matching labels in their configuration.
     Returns a server object with connections set to the requested subset. Selecting again on a selection operates as a logic AND statement between the individual selections.
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.connection({ port: 80, labels: ['a'] });
     server.connection({ port: 8080, labels: ['b'] });
     server.connection({ port: 8081, labels: ['c'] });
     server.connection({ port: 8082, labels: ['c','d'] });
     var a = server.select('a');          // The server with port 80
     var ab = server.select(['a','b']);   // A list of servers containing the server with port 80 and the server with port 8080
     var c = server.select('c');          // A list of servers containing the server with port 8081 and the server with port 8082 */
    select(labels: string | string[]): Server | Server[];

    /** server.start([callback])
     Starts the server connections by listening for incoming requests on the configured port of each listener (unless the connection was configured with autoListen set to false), where:
     callback - optional callback when server startup is completed or failed with the signature function(err) where:
     err - any startup error condition.
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.connection({ port: 80 });
     server.start(function (err) {
    console.log('Server started at: ' + server.info.uri);
    });*/
    // TODO check error can be of type string
    start(callback?: (err: any) => void): Promise<void>;

    /** server.state(name, [options])
     HTTP state management uses client cookies to persist a state across multiple requests. Registers a cookie definitions
     State defaults can be modified via the server connections.routes.state configuration option.
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.connection({ port: 80 });
     // Set cookie definition
     server.state('session', {
    ttl: 24 * 60 * 60 * 1000,     // One day
    isSecure: true,
    path: '/',
    encoding: 'base64json'
    });
     // Set state in route handler
     var handler = function (request, reply) {
    var session = request.state.session;
    if (!session) {
    session = { user: 'joe' };
    }
    session.last = Date.now();
    return reply('Success').state('session', session);
    };
     Registered cookies are automatically parsed when received. Parsing rules depends on the route state.parse configuration. If an incoming registered cookie fails parsing, it is not included in request.state, regardless of the state.failAction setting. When state.failAction is set to 'log' and an invalid cookie value is received, the server will emit a 'request-internal' event. To capture these errors subscribe to the 'request-internal' events and filter on 'error' and 'state' tags:
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.connection({ port: 80 });
     server.on('request-internal', function (request, event, tags) {
    if (tags.error && tags.state) {
    console.error(event);
    }
    });    */
    state(name: string, options?: ICookieSettings): void;

    /** server.stop([options], [callback])
     Stops the server's connections by refusing to accept any new connections or requests (existing connections will continue until closed or timeout), where:
     options - optional object with:
     timeout - overrides the timeout in millisecond before forcefully terminating a connection. Defaults to 5000 (5 seconds).
     callback - optional callback method with signature function() which is called once all the connections have ended and it is safe to exit the process.
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.connection({ port: 80 });
     server.stop({ timeout: 60 * 1000 }, function () {
    console.log('Server stopped');
    });*/
    stop(options?: { timeout: number }, callback?: () => void): Promise<void>;

    /**server.table([host])
     Returns a copy of the routing table where:
     host - optional host to filter routes matching a specific virtual host. Defaults to all virtual hosts.
     The return value is an array where each item is an object containing:
     info - the connection.info the connection the table was generated for.
     labels - the connection labels.
     table - an array of routes where each route contains:
     settings - the route config with defaults applied.
     method - the HTTP method in lower case.
     path - the route path.
     Note that if the server has not been started and multiple connections use port 0, the table items will override each other and will produce an incomplete result.
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.connection({ port: 80, host: 'example.com' });
     server.route({ method: 'GET', path: '/example', handler: function (request, reply) { return reply(); } });
     var table = server.table();
     When calling connection.table() directly on each connection, the return value is the same as the array table item value of an individual connection:
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.connection({ port: 80, host: 'example.com' });
     server.route({ method: 'GET', path: '/example', handler: function (request, reply) { return reply(); } });
     var table = server.connections[0].table();
     //[
     //    {
    //        method: 'get',
    //        path: '/example',
    //        settings: { ... }
    //    }
     //]
     */
    table(host?: any): IConnectionTable;

    /**server.views(options)
     Initializes the server views manager
     var Hapi = require('hapi');
     var server = new Hapi.Server();
     server.views({
    engines: {
    html: require('handlebars'),
    jade: require('jade')
    },
    path: '/static/templates'
    });
     When server.views() is called within a plugin, the views manager is only available to plugins methods.*/
    views(options: IServerViewsConfiguration): void;
}
