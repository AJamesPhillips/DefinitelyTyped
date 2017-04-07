
import Events = require('events');

import {IDictionary} from './misc';

export interface IHeaderOptions {
    append?: boolean;
    separator?: string;
    override?: boolean;
    duplicate?: boolean;
}

/** Response events

 The response object supports the following events:

 'peek' - emitted for each chunk of data written back to the client connection. The event method signature is function(chunk, encoding).
 'finish' - emitted when the response finished writing but before the client response connection is ended. The event method signature is function ().
 var Crypto = require('crypto');
 var Hapi = require('hapi');
 var server = new Hapi.Server();
 server.connection({ port: 80 });

 server.ext('onPreResponse', function (request, reply) {

var response = request.response;
if (response.isBoom) {
return reply();
}

var hash = Crypto.createHash('sha1');
response.on('peek', function (chunk) {

hash.update(chunk);
});

response.once('finish', function () {

console.log(hash.digest('hex'));
});

return reply.continue();
});*/
export class Response extends Events.EventEmitter {
    isBoom: boolean;
    /** the HTTP response status code. Defaults to 200 (except for errors).*/
    statusCode: number;
    /** an object containing the response headers where each key is a header field name. Note that this is an incomplete list of headers to be included with the response. Additional headers will be added once the response is prepare for transmission.*/
    headers: IDictionary<string>;
    /** the value provided using the reply interface.*/
    source: any;
    /** a string indicating the type of source with available values:
     'plain' - a plain response such as string, number, null, or simple object (e.g. not a Stream, Buffer, or view).
     'buffer' - a Buffer.
     'view' - a view generated with reply.view().
     'file' - a file generated with reply.file() of via the directory handler.
     'stream' - a Stream.
     'promise' - a Promise object. */
    variety: string;
    /** application-specific state. Provides a safe place to store application data without potential conflicts with the framework. Should not be used by plugins which should use plugins[name].*/
    app: any;
    /** plugin-specific state. Provides a place to store and pass request-level plugin data. The plugins is an object where each key is a plugin name and the value is the state. */
    plugins: any;
    /** settings - response handling flags:
     charset - the 'Content-Type' HTTP header 'charset' property. Defaults to 'utf-8'.
     encoding - the string encoding scheme used to serial data into the HTTP payload when source is a string or marshals into a string. Defaults to 'utf8'.
     passThrough - if true and source is a Stream, copies the statusCode and headers of the stream to the outbound response. Defaults to true.
     stringify - options used for source value requiring stringification. Defaults to no replacer and no space padding.
     ttl - if set, overrides the route cache expiration milliseconds value set in the route config. Defaults to no override.
     varyEtag - if true, a suffix will be automatically added to the 'ETag' header at transmission time (separated by a '-' character) when the HTTP 'Vary' header is present.*/
    settings: {
        charset: string;
        encoding: string;
        passThrough: boolean;
        stringify: any;
        ttl: number;
        varyEtag: boolean;
    }

    /** sets the HTTP 'Content-Length' header (to avoid chunked transfer encoding) where:
     length - the header value. Must match the actual payload size.*/
    bytes(length: number): Response;

    /** sets the 'Content-Type' HTTP header 'charset' property where: charset - the charset property value.*/
    charset(charset: string): Response;

    /** sets the HTTP status code where:
     statusCode - the HTTP status code.*/
    code(statusCode: number): Response;

    /** sets the HTTP status code to Created (201) and the HTTP 'Location' header where: uri - an absolute or relative URI used as the 'Location' header value.*/
    created(uri: string): Response;

    /** encoding(encoding) - sets the string encoding scheme used to serial data into the HTTP payload where: encoding - the encoding property value (see node Buffer encoding).*/
    encoding(encoding: string): Response;

    /** etag(tag, options) - sets the representation entity tag where:
     tag - the entity tag string without the double-quote.
     options - optional settings where:
     weak - if true, the tag will be prefixed with the 'W/' weak signifier. Weak tags will fail to match identical tags for the purpose of determining 304 response status. Defaults to false.
     vary - if true and content encoding is set or applied to the response (e.g 'gzip' or 'deflate'), the encoding name will be automatically added to the tag at transmission time (separated by a '-' character). Ignored when weak is true. Defaults to true.*/
    etag(tag: string, options: {
        weak: boolean; vary: boolean;
    }): Response;

    /**header(name, value, options) - sets an HTTP header where:
     name - the header name.
     value - the header value.
     options - optional settings where:
     append - if true, the value is appended to any existing header value using separator. Defaults to false.
     separator - string used as separator when appending to an exiting value. Defaults to ','.
     override - if false, the header value is not set if an existing value present. Defaults to true.*/
    header(name: string, value: string, options?: IHeaderOptions): Response;

    /** hold() - puts the response on hold until response.send() is called. Available only after reply() is called and until response.hold() is invoked once. */
    hold(): Response;

    /** location(uri) - sets the HTTP 'Location' header where:
     uri - an absolute or relative URI used as the 'Location' header value.*/
    location(uri: string): Response;

    /** redirect(uri) - sets an HTTP redirection response (302) and decorates the response with additional methods listed below, where:
     uri - an absolute or relative URI used to redirect the client to another resource. */
    redirect(uri: string): Response;

    /** replacer(method) - sets the JSON.stringify() replacer argument where:
     method - the replacer function or array. Defaults to none.*/
    replacer(method: Function | Array<Function>): Response;

    /** spaces(count) - sets the JSON.stringify() space argument where:
     count - the number of spaces to indent nested object keys. Defaults to no indentation. */
    spaces(count: number): Response;

    /**state(name, value, [options]) - sets an HTTP cookie where:
     name - the cookie name.
     value - the cookie value. If no encoding is defined, must be a string.
     options - optional configuration. If the state was previously registered with the server using server.state(), the specified keys in options override those same keys in the server definition (but not others).*/
    state(name: string, value: string, options?: any): Response;

    /** send() - resume the response which will be transmitted in the next tick. Available only after response.hold() is called and until response.send() is invoked once. */
    send(): void;

    /** sets a string suffix when the response is process via JSON.stringify().*/
    suffix(suffix: string): void;

    /** overrides the default route cache expiration rule for this response instance where:
     msec - the time-to-live value in milliseconds.*/
    ttl(msec: number): void;

    /** type(mimeType) - sets the HTTP 'Content-Type' header where:
     mimeType - is the mime type. Should only be used to override the built-in default for each response type. */
    type(mimeType: string): Response;

    /** clears the HTTP cookie by setting an expired value where:
     name - the cookie name.
     options - optional configuration for expiring cookie. If the state was previously registered with the server using server.state(), the specified keys in options override those same keys in the server definition (but not others).*/
    unstate(name: string, options?: { [key: string]: string }): Response;

    /** adds the provided header to the list of inputs affected the response generation via the HTTP 'Vary' header where:
     header - the HTTP request header name.*/
    vary(header: string): void;
}

/** When using the redirect() method, the response object provides these additional methods */
export class ResponseRedirect extends Response {
    /** sets the status code to 302 or 307 (based on the rewritable() setting) where:
     isTemporary - if false, sets status to permanent. Defaults to true.*/
    temporary(isTemporary: boolean): void;

    /** sets the status code to 301 or 308 (based on the rewritable() setting) where:
     isPermanent - if true, sets status to temporary. Defaults to false. */
    permanent(isPermanent: boolean): void;

    /** sets the status code to 301/302 for rewritable (allows changing the request method from 'POST' to 'GET') or 307/308 for non-rewritable (does not allow changing the request method from 'POST' to 'GET'). Exact code based on the temporary() or permanent() setting. Arguments:
     isRewritable - if false, sets to non-rewritable. Defaults to true.
     Permanent    Temporary
     Rewritable    301    302(1)
     Non-rewritable    308(2)    307
     Notes: 1. Default value. 2. Proposed code, not supported by all clients. */
    rewritable(isRewritable: boolean): void;
}
