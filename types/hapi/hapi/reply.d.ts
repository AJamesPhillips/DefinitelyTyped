
/// <reference types="node" />

import stream = require("stream");
import {BoomError} from 'boom';
// TODO remove this.  h2o2 should extend IReplyMethods
import {IProxyHandlerOptions} from 'h2o2';

import {Response, IHeaderOptions, ResponseRedirect} from './response';

/** Concludes the handler activity by setting a response and returning control over to the framework where:
 erran optional error response.
    result an optional response payload.
    Since an request can only have one response regardless if it is an error or success, the reply() method can only result in a single response value. This means that passing both an err and result will only use the err. There is no requirement for either err or result to be (or not) an Error object. The framework will simply use the first argument if present, otherwise the second. The method supports two arguments to be compatible with the common callback pattern of error first.
    FLOW CONTROL:
    When calling reply(), the framework waits until process.nextTick() to continue processing the request and transmit the response. This enables making changes to the returned response object before the response is sent. This means the framework will resume as soon as the handler method exits. To suspend this behavior, the returned response object supports the following methods: hold(), send() */
export interface IReply extends IReplyMethods {
    <T>(err: Error,
        result?: string | number | boolean | Buffer | stream.Stream | Promise<T> | T,
        /** Note that when used to return both an error and credentials in the authentication methods, reply() must be called with three arguments function(err, null, data) where data is the additional authentication information. */
        credentialData?: any): BoomError;
    /** Note that if result is a Stream with a statusCode property, that status code will be used as the default response code.  */
    <T>(result: string | number | boolean | Buffer | stream.Stream | Promise<T> | T): Response;
}

/** Concludes the handler activity by setting a response and returning control over to the framework where:
 erran optional error response.
    result an optional response payload.
    Since an request can only have one response regardless if it is an error or success, the reply() method can only result in a single response value. This means that passing both an err and result will only use the err. There is no requirement for either err or result to be (or not) an Error object. The framework will simply use the first argument if present, otherwise the second. The method supports two arguments to be compatible with the common callback pattern of error first.
    FLOW CONTROL:
    When calling reply(), the framework waits until process.nextTick() to continue processing the request and transmit the response. This enables making changes to the returned response object before the response is sent. This means the framework will resume as soon as the handler method exits. To suspend this behavior, the returned response object supports the following methods: hold(), send() */
export interface IStrictReply<T> extends IReplyMethods {
    (err: Error,
        result?: Promise<T> | T,
        /** Note that when used to return both an error and credentials in the authentication methods, reply() must be called with three arguments function(err, null, data) where data is the additional authentication information. */
        credentialData?: any): BoomError;
    /** Note that if result is a Stream with a statusCode property, that status code will be used as the default response code.  */
    (result: Promise<T> | T): Response;
}

interface IReplyMethods {
    /** Returns control back to the framework without setting a response. If called in the handler, the response defaults to an empty payload with status code 200.
     * The data argument is only used for passing back authentication data and is ignored elsewhere. */
    continue(credentialData?: any): void;

    /** Transmits a file from the file system. The 'Content-Type' header defaults to the matching mime type based on filename extension.  The response flow control rules do not apply. */
    file(/**  the file path. */
        path: string,
        /** optional settings:  */
        options?: {
            /** - an optional filename to specify if sending a 'Content-Disposition' header, defaults to the basename of path*/
            filename?: string;
            /** specifies whether to include the 'Content-Disposition' header with the response. Available values:
             false - header is not included. This is the default value.
             'attachment'
             'inline'*/
            mode?: boolean | string;
            /**  if true, looks for the same filename with the '.gz' suffix for a pre-compressed version of the file to serve if the request supports content encoding. Defaults to false.  */
            lookupCompressed: boolean;
        }): void;
    /** Concludes the handler activity by returning control over to the router with a templatized view response.
     the response flow control rules apply. */
    view(/** the template filename and path, relative to the templates path configured via the server views manager. */
        template: string,
        /** optional object used by the template to render context-specific result. Defaults to no context {}. */
        context?: {},
        /** optional object used to override the server's views manager configuration for this response. Cannot override isCached, partialsPath, or helpersPath which are only loaded at initialization.  */
        options?: any): Response;
    /** Sets a header on the response */
    header(name: string, value: string, options?: IHeaderOptions): Response;

    /** Concludes the handler activity by returning control over to the router and informing the router that a response has already been sent back directly via request.raw.res and that no further response action is needed
     The response flow control rules do not apply. */
    close(options?: {
        /**  if false, the router will not call request.raw.res.end()) to ensure the response was ended. Defaults to true.  */
        end?: boolean;
    }): void;
    /** Proxies the request to an upstream endpoint.
     the response flow control rules do not apply. */

    proxy(/** an object including the same keys and restrictions defined by the route proxy handler options. */
        options: IProxyHandlerOptions): void;
    /** Redirects the client to the specified uri. Same as calling reply().redirect(uri).
     he response flow control rules apply. */
    redirect(uri: string): ResponseRedirect;

    /** Replies with the specified response */
    response(result: any): Response;

    /** Sets a cookie on the response */
    state(name: string, value: any, options?: any): void;

    /** Clears a cookie on the response */
    unstate(name: string, options?: any): void;
}
