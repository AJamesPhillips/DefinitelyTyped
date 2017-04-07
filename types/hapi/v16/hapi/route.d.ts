
/// <reference types="node" />

import {IDictionary} from './misc';
import {IReply, IStrictReply} from './reply';
import {Request, IRequestHandler} from './request';
import {Server, IServerRealm} from './server';


/** The route handler function uses the signature function(request, reply) (NOTE: do not use a fat arrow style function for route handlers as they do not allow context binding and will cause problems when used in conjunction with server.bind) where:
 * request - is the incoming request object (this is not the node.js request object).
 * reply - the reply interface the handler must call to set a response and return control back to the framework.
*/
export interface IRouteHandler {
    (request: Request, reply: IReply): void;
    <T>(request: Request, reply: IStrictReply<T>): void;
}

/*
 * Although the hapi documentation allows for the union of this type with
 * `{[index: string]: {[index: string]: any}}`, this should be provided
 * extending the hapi module definition.  See h2o2 for example:
 *      declare module 'hapi' {
 *        interface IRouteConfiguration {
 *          proxy?: ...
 */
type RouteHandler = string | IRouteHandler // | {[index: string]: {[index: string]: any}};

type HTTP_METHODS_PARTIAL = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

/** Route configuration
 * @see {@link https://hapijs.com/api#route-configuration}
 * The route configuration object */
// TODO check that the following refers to IRouteAdditionalConfigurationOptions "Note that the options object is deeply cloned (with the exception of bind which is shallowly copied) and cannot contain any values that are unsafe to perform deep copy on."
export interface IRouteConfiguration {
    /** the absolute path used to match incoming requests (must begin with '/'). Incoming requests are compared to the configured paths based on the connection router configuration option. The path can include named parameters enclosed in {} which will be matched against literal values in the request as described in Path parameters. */
    path: string;
    /** the HTTP method. Typically one of 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', or 'OPTIONS'. Any HTTP method is allowed, except for 'HEAD'. Use '*' to match against any HTTP method (only when an exact match was not found, and any match with a specific method will be given a higher priority over a wildcard match). Can be assigned an array of methods which has the same result as adding the same route with different methods manually. */
    method: HTTP_METHODS_PARTIAL | '*' | (HTTP_METHODS_PARTIAL | '*')[];
    /** an optional domain string or an array of domain strings for limiting the route to only requests with a matching host header field. Matching is done against the hostname part of the header only (excluding the port). Defaults to all hosts. */
    vhost?: string;
    /** the function called to generate the response after successful authentication and validation. The handler function is described in Route handler. If set to a string, the value is parsed the same way a prerequisite server method string shortcut is processed. Alternatively, handler can be assigned an object with a single key using the name of a registered handler type and value with the options passed to the registered handler. */
    handler?: RouteHandler;
    /** additional route options. The config value can be an object or a function that returns an object using the signature function(server) where server is the server the route is being added to and this is bound to the current realm's bind option. */
    config?: IRouteAdditionalConfigurationOptions | ((server: Server) => IRouteAdditionalConfigurationOptions);
}

/** Each route can be customize to change the default behavior of the request lifecycle using the following options:  */
export interface IRouteAdditionalConfigurationOptions {
    /** application specific configuration.Should not be used by plugins which should use plugins[name] instead. */
    app?: any;
    /** authentication configuration.Value can be: false to disable authentication if a default strategy is set.
     a string with the name of an authentication strategy registered with server.auth.strategy().
     an object  */
    auth?: false | string | IRouteAuthConfiguration
    /** an object passed back to the provided handler (via this) when called. */
    bind?: any;
    /** if the route method is 'GET', the route can be configured to include caching directives in the response using the following options */
    cache?: RouteCacheOptions
    /** the Cross- Origin Resource Sharing protocol allows browsers to make cross- origin API calls.CORS is required by web applications running inside a browser which are loaded from a different domain than the API server.CORS headers are disabled by default. To enable, set cors to true, or to an object with the following options: */
    cors?: {
        /** a strings array of allowed origin servers ('Access-Control-Allow-Origin').The array can contain any combination of fully qualified origins along with origin strings containing a wildcard '' character, or a single `''origin string. Defaults to any origin['*']`. */
        origin?: Array<string>;
        /** if true, matches the value of the incoming 'Origin' header to the list of origin values ('*' matches anything) and if a match is found, uses that as the value of the 'Access-Control-Allow-Origin' response header.When false, the origin config is returned as- is.Defaults to true.  */
        matchOrigin?: boolean;
        /** if false, prevents the connection from returning the full list of non- wildcard origin values if the incoming origin header does not match any of the values.Has no impact if matchOrigin is set to false.Defaults to true. */
        isOriginExposed?: boolean;
        /** number of seconds the browser should cache the CORS response ('Access-Control-Max-Age').The greater the value, the longer it will take before the browser checks for changes in policy.Defaults to 86400 (one day). */
        maxAge?: number;
        /** a strings array of allowed headers ('Access-Control-Allow-Headers').Defaults to ['Authorization', 'Content-Type', 'If-None-Match']. */
        headers?: string[];
        /** a strings array of additional headers to headers.Use this to keep the default headers in place. */
        additionalHeaders?: string[];
        /** a strings array of allowed HTTP methods ('Access-Control-Allow-Methods').Defaults to ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS']. */
        methods?: string[];
        /** a strings array of additional methods to methods.Use this to keep the default methods in place. */
        additionalMethods?: string[];
        /** a strings array of exposed headers ('Access-Control-Expose-Headers').Defaults to ['WWW-Authenticate', 'Server-Authorization']. */
        exposedHeaders?: string[];
        /** a strings array of additional headers to exposedHeaders.Use this to keep the default headers in place. */
        additionalExposedHeaders?: string[];
        /** if true, allows user credentials to be sent ('Access-Control-Allow-Credentials').Defaults to false. */
        credentials?: boolean;
        /** if false, preserves existing CORS headers set manually before the response is sent.Defaults to true. */
        override?: boolean;
    };
    /**  defines the behavior for serving static resources using the built-in route handlers for files and directories: */
    files?: {/** determines the folder relative paths are resolved against when using the file and directory handlers. */
        relativeTo: string;
    };

    /** an alternative location for the route handler option. */
    handler?: RouteHandler;
    /** an optional unique identifier used to look up the route using server.lookup(). */
    id?: number;
    /** optional arguments passed to JSON.stringify() when converting an object or error response to a string payload.Supports the following: */
    json?: {
        /** the replacer function or array.Defaults to no action. */
        replacer?: Function | string[];
        /** number of spaces to indent nested object keys.Defaults to no indentation. */
        space?: number | string;
        /** string suffix added after conversion to JSON string.Defaults to no suffix. */
        suffix?: string;
    };
    /** enables JSONP support by setting the value to the query parameter name containing the function name used to wrap the response payload.For example, if the value is 'callback', a request comes in with 'callback=me', and the JSON response is '{ "a":"b" }', the payload will be 'me({ "a":"b" });'.Does not work with stream responses. */
    jsonp?: string;
    /** determines how the request payload is processed: */
    payload?: {
        /** the type of payload representation requested. The value must be one of:
         'data'the incoming payload is read fully into memory.If parse is true, the payload is parsed (JSON, formdecoded, multipart) based on the 'Content- Type' header.If parse is false, the raw Buffer is returned.This is the default value except when a proxy handler is used.
         'stream'the incoming payload is made available via a Stream.Readable interface.If the payload is 'multipart/form-data' and parse is true, fields values are presented as text while files are provided as streams.File streams from a 'multipart/form-data' upload will also have a property hapi containing filename and headers properties.
         'file'the incoming payload in written to temporary file in the directory specified by the server's payload.uploads settings. If the payload is 'multipart/ formdata' and parse is true, fields values are presented as text while files are saved. Note that it is the sole responsibility of the application to clean up the files generated by the framework. This can be done by keeping track of which files are used (e.g. using the request.app object), and listening to the server 'response' event to perform any needed cleaup. */
        output: 'data' | 'stream' | 'file';
        /** can be true, false, or gunzip; determines if the incoming payload is processed or presented raw. true and gunzip includes gunzipping when the appropriate 'Content-Encoding' is specified on the received request. If parsing is enabled and the 'Content-Type' is known (for the whole payload as well as parts), the payload is converted into an object when possible. If the format is unknown, a Bad Request (400) error response is sent. Defaults to true, except when a proxy handler is used. The supported mime types are:
         'application/json'
         'application/x-www-form-urlencoded'
         'application/octet-stream'
         'text/ *'
         'multipart/form-data' */
        parse?: 'gunzip' | boolean;
        /** a string or an array of strings with the allowed mime types for the endpoint.Defaults to any of the supported mime types listed above.Note that allowing other mime types not listed will not enable them to be parsed, and that if parsing mode is 'parse', the request will result in an error response. */
        allow?: string | string[];
        /** a mime type string overriding the 'Content-Type' header value received.Defaults to no override. */
        override?: string;
        /** limits the size of incoming payloads to the specified byte count.Allowing very large payloads may cause the server to run out of memory.Defaults to 1048576 (1MB).  */
        maxBytes?: number;
        /** payload reception timeout in milliseconds.Sets the maximum time allowed for the client to transmit the request payload (body) before giving up and responding with a Request Timeout (408) error response.Set to false to disable.Defaults to 10000 (10 seconds). */
        timeout?: number;
        /** the directory used for writing file uploads.Defaults to os.tmpDir(). */
        uploads?: string;
        /** determines how to handle payload parsing errors. Allowed values are:
         'error'return a Bad Request (400) error response. This is the default value.
         'log'report the error but continue processing the request.
         'ignore'take no action and continue processing the request. */
        failAction?: string;
    };
    /** pluginspecific configuration.plugins is an object where each key is a plugin name and the value is the plugin configuration.  */
    plugins?: IDictionary<any>;
    /** an array with [route prerequisites] methods which are executed in serial or in parallel before the handler is called.  */
    pre?: any[];
    /** validation rules for the outgoing response payload (response body).Can only validate object response: */
    response?: {
        /** the default HTTP status code when the payload is empty. Value can be 200 or 204.
         Note that a 200 status code is converted to a 204 only at the time or response transmission
         (the response status code will remain 200 throughout the request lifecycle unless manually set). Defaults to 200. */
        emptyStatusCode?: number;
        /**  the default response object validation rules (for all non-error responses) expressed as one of:
         true - any payload allowed (no validation performed). This is the default.
         false - no payload allowed.
         a Joi validation object.
         a validation function using the signature function(value, options, next) where:
         value - the object containing the response object.
         options - the server validation options.
         next(err) - the callback function called when validation is completed.  */
        schema?: boolean | any;
        /** HTTP status- codespecific validation rules.The status key is set to an object where each key is a 3 digit HTTP status code and the value has the same definition as schema.If a response status code is not present in the status object, the schema definition is used, expect for errors which are not validated by default.  */
        status?: { [statusCode: number]: boolean | any };
        /** the percent of responses validated (0100).Set to 0 to disable all validation.Defaults to 100 (all responses). */
        sample?: number;
        /** defines what to do when a response fails validation.Options are:
         errorreturn an Internal Server Error (500) error response.This is the default value.
         loglog the error but send the response.  */
        failAction?: string;
        /** if true, applies the validation rule changes to the response.Defaults to false. */
        modify?: boolean;
        /** options to pass to Joi.Useful to set global options such as stripUnknown or abortEarly (the complete list is available here: https://github.com/hapijs/joi#validatevalue-schema-options-callback ).Defaults to no options.  */
        options?: any;
    };
    /** sets common security headers (disabled by default).To enable set security to true or to an object with the following options */
    security?: boolean | {
        /** controls the 'Strict-Transport-Security' header.If set to true the header will be set to max- age=15768000, if specified as a number the maxAge parameter will be set to that number.Defaults to true.You may also specify an object with the following fields: */
        hsts?: boolean | number | {
            /** the max- age portion of the header, as a number.Default is 15768000. */
            maxAge?: number;
            /** a boolean specifying whether to add the includeSubdomains flag to the header. */
            includeSubdomains?: boolean;
            /** a boolean specifying whether to add the 'preload' flag (used to submit domains inclusion in Chrome's HTTP Strict Transport Security (HSTS) preload list) to the header. */
            preload?: boolean;
        };
        /** controls the 'X-Frame-Options' header.When set to true the header will be set to DENY, you may also specify a string value of 'deny' or 'sameorigin'.To use the 'allow-from' rule, you must set this to an object with the following fields: */
        xframe?: {
            /** either 'deny', 'sameorigin', or 'allow-from' */
            rule: string;
            /** when rule is 'allow-from' this is used to form the rest of the header, otherwise this field is ignored.If rule is 'allow-from' but source is unset, the rule will be automatically changed to 'sameorigin'. */
            source: string;
        };
        /** boolean that controls the 'X-XSS-PROTECTION' header for IE.Defaults to true which sets the header to equal '1; mode=block'.NOTE: This setting can create a security vulnerability in versions of IE below 8, as well as unpatched versions of IE8.See here and here for more information.If you actively support old versions of IE, it may be wise to explicitly set this flag to false. */
        xss?: boolean;
        /** boolean controlling the 'X-Download-Options' header for IE, preventing downloads from executing in your context.Defaults to true setting the header to 'noopen'. */
        noOpen?: boolean;
        /** boolean controlling the 'X-Content-Type-Options' header.Defaults to true setting the header to its only and default option, 'nosniff'. */
        noSniff?: boolean;
    };
    /** HTTP state management (cookies) allows the server to store information on the client which is sent back to the server with every request (as defined in RFC 6265).state supports the following options: */
    state?: {
        /** determines if incoming 'Cookie' headers are parsed and stored in the request.state object.Defaults to true. */
        parse: boolean;
        /** determines how to handle cookie parsing errors.Allowed values are:
         'error'return a Bad Request (400) error response.This is the default value.
         'log'report the error but continue processing the request.
         'ignore'take no action. */
        failAction: string;
    };
    /** request input validation rules for various request components.When using a Joi validation object, the values of the other inputs (i.e.headers, query, params, payload, and auth) are made available under the validation context (accessible in rules as Joi.ref('$query.key')).Note that validation is performed in order(i.e.headers, params, query, payload) and if type casting is used (converting a string to number), the value of inputs not yet validated will reflect the raw, unvalidated and unmodified values.The validate object supports: */
    validate?: {
        /** validation rules for incoming request headers.Values allowed:
         * trueany headers allowed (no validation performed).This is the default.
         falseno headers allowed (this will cause all valid HTTP requests to fail).
         a Joi validation object.
         a validation function using the signature function(value, options, next) where:
         valuethe object containing the request headers.
         optionsthe server validation options.
         next(err, value)the callback function called when validation is completed.
         */
        headers?: boolean | IJoi | IValidationFunction;


        /** validation rules for incoming request path parameters, after matching the path against the route and extracting any parameters then stored in request.params.Values allowed:
         trueany path parameters allowed (no validation performed).This is the default.
         falseno path variables allowed.
         a Joi validation object.
         a validation function using the signature function(value, options, next) where:
         valuethe object containing the path parameters.
         optionsthe server validation options.
         next(err, value)the callback function called when validation is completed. */
        params?: boolean | IJoi | IValidationFunction;
        /** validation rules for an incoming request URI query component (the key- value part of the URI between '?' and '#').The query is parsed into its individual key- value pairs (using the qs module) and stored in request.query prior to validation.Values allowed:
         trueany query parameters allowed (no validation performed).This is the default.
         falseno query parameters allowed.
         a Joi validation object.
         a validation function using the signature function(value, options, next) where:
         valuethe object containing the query parameters.
         optionsthe server validation options.
         next(err, value)the callback function called when validation is completed. */
        query?: boolean | IJoi | IValidationFunction;
        /** validation rules for an incoming request payload (request body).Values allowed:
         trueany payload allowed (no validation performed).This is the default.
         falseno payload allowed.
         a Joi validation object.
         a validation function using the signature function(value, options, next) where:
         valuethe object containing the payload object.
         optionsthe server validation options.
         next(err, value)the callback function called when validation is completed.  */
        payload?: boolean | IJoi | IValidationFunction;
        /** an optional object with error fields copied into every validation error response. */
        errorFields?: any;
        /** determines how to handle invalid requests.Allowed values are:
         'error'return a Bad Request (400) error response.This is the default value.
         'log'log the error but continue processing the request.
         'ignore'take no action.
         OR a custom error handler function with the signature 'function(request, reply, source, error)` where:
         requestthe request object.
         replythe continuation reply interface.
         sourcethe source of the invalid field (e.g. 'path', 'query', 'payload').
         errorthe error object prepared for the client response (including the validation function error under error.data). */
        failAction?: string | IRouteFailFunction;
        /** options to pass to Joi.Useful to set global options such as stripUnknown or abortEarly (the complete list is available here: https://github.com/hapijs/joi#validatevalue-schema-options-callback ).Defaults to no options. */
        options?: any;
    };
    /** define timeouts for processing durations: */
    timeout?: {
        /** response timeout in milliseconds.Sets the maximum time allowed for the server to respond to an incoming client request before giving up and responding with a Service Unavailable (503) error response.Disabled by default (false). */
        server: boolean | number;
        /** by default, node sockets automatically timeout after 2 minutes.Use this option to override this behavior.Defaults to undefined which leaves the node default unchanged.Set to false to disable socket timeouts. */
        socket: boolean | number;
    };

    /** ONLY WHEN ADDING NEW ROUTES (not when setting defaults).
     *route description used for generating documentation (string).
     */
    description?: string;
    /** ONLY WHEN ADDING NEW ROUTES (not when setting defaults).
     *route notes used for generating documentation (string or array of strings).
     */
    notes?: string | string[];
    /** ONLY WHEN ADDING NEW ROUTES (not when setting defaults).
     *route tags used for generating documentation (array of strings).
     */
    tags?: string[];

    /** Enable logging of routes
        */
    log?: boolean;
}

export interface IRouteAuthConfiguration {
    /** the authentication mode.Defaults to 'required' if a server authentication strategy is configured, otherwise defaults to no authentication.Available values:
     'required' - authentication is required.
     'optional' - authentication is optional (must be valid if present).
     'try' - same as 'optional' but allows for invalid authentication. */
    mode?: 'required' | 'optional' | 'try';
    /** a string array of strategy names in order they should be attempted. If only one strategy is used, strategy can be used instead with the single string value. Defaults to the default authentication strategy which is available only when a single strategy is configured.  */
    strategies?: string[];
    strategy?: string;
    /** if set, the payload (in requests other than 'GET' and 'HEAD') is authenticated after it is processed. Requires a strategy with payload authentication support (e.g. Hawk). Cannot be set to a value other than 'required' when the scheme sets the options.payload to true. Available values:
     false - no payload authentication. This is the default value.
     'required' - payload authentication required. This is the default value when the scheme sets options.payload to true.
     'optional' - payload authentication performed only when the client includes payload authentication information (e.g. hash attribute in Hawk). */
    payload?: false | 'required' | 'optional';
    /** specifying the route access rules.  */
    access?: IRouteAuthAccessConfiguation | IRouteAuthAccessConfiguation[];
}

/** specifying the route access rules. Each rule is evaluated against an incoming request and access is granted if at least one rule matches  */
export interface IRouteAuthAccessConfiguation {
    /** the application scope required to access the route. Value can be a scope string or an array of scope strings. The authenticated credentials object scope property must contain at least one of the scopes defined to access the route. If a scope string begins with a + character, that scope is required. If a scope string begins with a ! character, that scope is forbidden. For example, the scope ['!a', '+b', 'c', 'd'] means the incoming request credentials' scope must not include 'a', must include 'b', and must include one of 'c' or 'd'. You may also access properties on the request object (query and params) to populate a dynamic scope by using {} characters around the property name, such as 'user-{params.id}'. Defaults to false (no scope requirements).  */
    scope?: false | string | string[];
    /** the required authenticated entity type. If set, must match the entity value of the authentication credentials. Available values:
     * any - the authentication can be on behalf of a user or application. This is the default value.
     * user - the authentication must be on behalf of a user which is identified by the presence of a user attribute in the credentials object returned by the authentication strategy.
     * app - the authentication must be on behalf of an application which is identified by the lack of presence of a user attribute in the credentials object returned by the authentication strategy.
     */
    entity?: 'any' | 'user' | 'app';
}

/** if the route method is 'GET', the route can be configured to include caching directives in the response. The default Cache-Control: no-cache header can be disabled by setting cache to false. Caching can be customized using an object with the following options: */
// TODO check understanding.  The default is to have 'Cache-Control: no-cache', but you can disabled cache and disabled no-cache by setting RouteCacheOptions to false?
export type RouteCacheOptions = false | IRouteCacheOptions;

export interface IRouteCacheOptions {
    /** determines the privacy flag included in client-side caching using the 'Cache-Control' header. Values are:
    'default' - no privacy flag. This is the default setting.
    'public' - mark the response as suitable for public caching.
    'private' - mark the response as suitable only for private caching. */
    privacy?: 'default' | 'public' | 'private';
    /** relative expiration expressed in the number of milliseconds since the item was saved in the cache. Cannot be used together with expiresAt. */
    expiresIn?: number;
    /** time of day expressed in 24h notation using the 'HH:MM' format, at which point all cache records for the route expire. Cannot be used together with expiresIn. */
    expiresAt?: string;
    /** an array of HTTP response status codes (e.g. 200) which are allowed to include a valid caching directive. Defaults to [200]. */
    statuses?: [number];
    /** a string with the value of the 'Cache-Control' header when caching is disabled. Defaults to 'no-cache'. */
    otherwise?: string;
}

/** Route public interface
 * http://hapijs.com/api#route-public-interface
 * When route information is returned or made available as a property, it is an object with the following: */
export interface IRoutePublicInterface {
    /** the route HTTP method. */
    method: string;
    /** the route path. */
    path: string;
    /** the route vhost option if configured. */
    vhost?: string | string[];
    /** the [active realm] associated with the route.*/
    realm: IServerRealm;
    /** the [route options]  object with all defaults applied. */
    settings: IRouteAdditionalConfigurationOptions;
    /** the route internal normalized string representing the normalized path. */
    fingerprint: string;
    /** route authentication utilities: */
    auth: {
        /** authenticates the passed request argument against the route's authentication access configuration. Returns true if the request would have passed the route's access requirements. Note that the route's authentication mode and strategies are ignored. The only match is made between the request.auth.credentials scope and entity information and the route access configuration. Also, if the route uses dynamic scopes, the scopes are constructed against the request.query and request.params which may or may not match between the route and the request's route. If this method is called using a request that has not been authenticated (yet or at all), it will return false if the route requires any authentication. */
        // TODO check this
        access: (request: Request) => boolean;
    }
}

/** TODO: import joi definition  */
export interface IJoi {

}

/** a validation function using the signature function(value, options, next) */
export interface IValidationFunction {
    (/**  the object containing the path parameters. */
        value: any,
        /** the server validation options. */
        options: any,
        /**  the callback function called when validation is completed.  */
        next: (err: any, value: any) => void): void;
}

/** a custom error handler function with the signature 'function(request, reply, source, error)` */
export interface IRouteFailFunction {
    /** a custom error handler function with the signature 'function(request, reply, source, error)` */
    (/** - the [request object]. */
        request: Request,
        /**  the continuation reply interface. */
        reply: IReply,
        /** the source of the invalid field (e.g. 'path', 'query', 'payload'). */
        source: string,
        /** the error object prepared for the client response (including the validation function error under error.data). */
        error: any): void;
}
