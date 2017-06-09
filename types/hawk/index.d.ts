
/// <reference types="node" />

import * as Url from 'url';

export type HTTP_METHODS_PARTIAL_lowercase = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options';
export type HTTP_METHODS_PARTIAL = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | HTTP_METHODS_PARTIAL_lowercase;
export type HTTP_METHODS = 'HEAD' | 'head' | HTTP_METHODS_PARTIAL;

export interface API {
    utils: {
        now(): number;
    }
}

export interface Credentials {
    /** the ticket identifier used for making authenticated Hawk requests. */
    id: string;
    /** a shared secret used to authenticate. */
    key: string;
    /** the HMAC algorithm used to authenticate (e.g. HMAC-SHA256). */
    algorithm: string;
}

export interface Client {
    /**
     * [see code](https://github.com/hueniverse/hawk/blob/v6.0.1/lib/client.js#L19-L46)
     * @param uri  'http://example.com/resource?a=b' or object from Url.parse()
     * @param method  HTTP verb (e.g. 'GET', 'POST')
     * @param options
     */
    header(uri: string | Url.Url, method: HTTP_METHODS_PARTIAL, options: HeaderOptions): AuthorizationHeader;

    /**
     * [see code](https://github.com/hueniverse/hawk/blob/v6.0.1/lib/client.js#L140-L149)
     */
    // authenticate(res, credentials, artifacts, options, callback): boolean;
}

/**
 * To [aid typing the Oz.client.header](https://github.com/hueniverse/oz/blob/a829664fdfef94c481beefc4750f4934e89ad1cd/lib/client.js#L25-L32)
 * the Hawk HeaderOptions have been split into parts.
 * In Oz, the options here `OzPartialHeaderOptions` are merged with the
 * `Client.PartialTicket` object (which comes from the options.credentials
 * object given to Oz.client.Connection).
 * The resulting object (called `settings` in the Oz client code, though note
 * this is NOT the `this.settings` in the Connection constructor) has the same
 * interface as the `Hawk.HeaderOptions` interface.
 *
 * [see hawk code](https://github.com/hueniverse/hawk/blob/v6.0.1/lib/client.js#L19-L46)
 */
export interface OzPartialHeaderOptions {
    /**
     * These will be all copied over in the [Oz.client.header code](https://github.com/hueniverse/oz/blob/a829664fdfef94c481beefc4750f4934e89ad1cd/lib/client.js#L25-L32)
     * so no point in including
     */
    // credentials: Hawk.Credentials
    // app?: string;
    // dlg?: string;
    /** 'application-specific'  Application specific data sent via the ext attribute */
    ext?: string;
    /** Date.now() / 1000,  A pre-calculated timestamp in seconds */
    timestamp?: number;
    /** '2334f34f'  A pre-generated nonce */
    nonce?: string;
    /** 400,  Time offset to sync with server time (ignored if timestamp provided) */
    localtimeOffsetMsec?: number;
    /** '{"some":"payload"  UTF-8 encoded string for body hash generation (ignored if hash provided) */
    payload?: string;
    /** 'application/json'  Payload content-type (ignored if hash provided) */
    contentType?: string;
    /** 'U4MKKSmiVxk37JCCrAVIjV=  Pre-calculated payload hash */
    hash?: string;
}

/**
 * [see code](https://github.com/hueniverse/hawk/blob/v6.0.1/lib/client.js#L19-L46)
 */
export interface HeaderOptions extends OzPartialHeaderOptions {
    /** Required credentials */
    credentials: Credentials;
    /** '24s23423f34dx'  Oz application id */
    app?: string;
    /** '234sz34tww3sd'  Oz delegated-by application id */
    dlg?: string;
}

/**
 * [see code](https://github.com/hueniverse/hawk/blob/v6.0.1/lib/client.js#L19-L46)
 */
export interface AuthorizationHeader {
    field: string;
    /**
     * [see code](https://github.com/hueniverse/hawk/blob/v6.0.1/lib/client.js#L92)
     */
    artifacts: Artifacts;
    err?: string;
}

/**
 * [see code](https://github.com/hueniverse/hawk/blob/v6.0.1/lib/client.js#L92-L103)
 */
export interface Artifacts {
    /** options.timestamp || Utils.nowSecs(options.localtimeOffsetMsec) */
    ts: number;
    /** options.nonce || Cryptiles.randomString(6) */
    nonce: string;
    /** method */
    method: HTTP_METHODS_PARTIAL
    /** uri.pathname + (uri.search || '') */
    resource: string;
    /** uri.hostname */
    host: string;
    /**
     * uri.port || (uri.protocol === 'http:' ? 80 : 443)
     * TODO: Can uri.port ever be a string?
     */
    port: number;
    /** options.hash */
    hash: string;
    /** options.ext */
    ext?: string;
    /** options.app */
    app?: string;
    /** options.dlg */
    dlg?: string;
}

export var client: Client;

/* + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +
 +                                                                           +
 +                                                                           +
 +                                                                           +
 +                                  Server                                   +
 +                                                                           +
 +                                                                           +
 +                                                                           +
 + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + */

/**
 * [see code comment](https://github.com/hueniverse/hawk/blob/v6.0.1/lib/server.js#L56-L82)
 */
export interface ServerAuthenticateOptions {
    /**
     * optional header field name, used to override the default 'Host' header when used
     * behind a cache of a proxy. Apache2 changes the value of the 'Host' header while preserving
     * the original (which is what the module must verify) in the 'x-forwarded-host' header field.
     * Only used when passed a node Http.ServerRequest object.
     */
    hostHeaderName: TODO;
    /**
     * optional nonce validation function. The function signature is function(key, nonce, ts, callback)
     * where 'callback' must be called using the signature function(err).
     */
    nonceFunc: TODO;
    /**
     * optional number of seconds of permitted clock skew for incoming timestamps. Defaults to 60 seconds.
     * Provides a +/- skew which means actual allowed window is double the number of seconds.
     */
    timestampSkewSec: TODO;
    /**
     * optional local clock time offset express in a number of milliseconds (positive or negative).
     * Defaults to 0.
     */
    localtimeOffsetMsec: TODO;
    /**
     * optional payload for validation. The client calculates the hash value and includes it via the 'hash'
     * header attribute. The server always ensures the value provided has been included in the request
     * MAC. When this option is provided, it validates the hash value itself. Validation is done by calculating
     * a hash value over the entire payload (assuming it has already be normalized to the same format and
     * encoding used by the client to calculate the hash on request). If the payload is not available at the time
     * of authentication, the authenticatePayload() method can be used by passing it the credentials and
     * attributes.hash returned in the authenticate callback.
     */
    payload: TODO;
    /** optional host name override. Only used when passed a node request object. */
    host: TODO;
    /** optional port override. Only used when passed a node request object. */
    port: TODO;
}

type TODO = any;
