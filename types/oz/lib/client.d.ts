
import * as Hawk from "hawk";

/**
 * Utilities used for making authenticated Oz requests.
 * [see docs](https://github.com/hueniverse/oz#ozclient)
 */
interface Client {
    /**
     * A convenience utility to generate the application Hawk request authorization header for making authenticated Oz requests
     * [see docs](https://github.com/hueniverse/oz#ozclientheaderuri-method-ticket-options)
     * @param uri  the request URI.
     * @param method  the request HTTP method.
     * @param ticket  the authorization ticket.
     * @param options  additional Hawk Hawk.client.header() options.
     */
    header(uri: string, method: string, ticket: Client.PartialAppCredentials, options?: Hawk.OzPartialHeaderOptions): Hawk.AuthorizationHeader;
    /**
     * Creates an oz client connection manager for easier access to protected resources. The client manages the ticket lifecycle and will automatically refresh the ticken when expired.
     * [see docs](https://github.com/hueniverse/oz#new-ozclientconnectionoptions)
     */
    Connection: {
        new(options: Client.ConnectionOptionsNoAppFunction): Client.ConnectionNoAppFunction;
        new(options: Client.ConnectionOptionsWithAppFunction): Client.ConnectionWithAppFunction;
    };
}

declare namespace Client {
    export interface EndPointPaths {
        /** the application credentials endpoint path. Defaults to '/oz/app'. */
        app?: string;
        /** the rsvp endpoint path. Defaults to '/oz/rsvp'. */
        rsvp?: string;
        /** the ticket reissue endpoint path. Defaults to '/oz/reissue'. */
        reissue?: string;
    }

    /**
     * An object describing a user grant
     * [see docs](https://github.com/hueniverse/oz#grant-object)
     */
    export interface Grant {
        /** the grant identifier. */
        id: string;
        /** the application identifier. */
        app: string;
        /** the user identifier. */
        user: string;
        /** grant expiration time in milliseconds since 1/1/1970. */
        exp: number;
        /** an array with the scope granted by the user to the application. */
        scope?: string[];
    }

    /**
     * An object describing a ticket and its public properties
     * [see docs](https://github.com/hueniverse/oz#ticket-response)
     * See scarecrow code for example of [data structure](https://github.com/hapijs/scarecrow/blob/3b3c4ad/test/index.js#L32-L36)
     * and [use with Oz](https://github.com/hapijs/scarecrow/blob/3b3c4ad/test/index.js#L107)
     */
    interface BaseTicket extends Hawk.Credentials {
        /** ticket expiration time in milliseconds since 1/1/1970. */
        exp?: number;
        /** the application id the ticket was issued to. */
        app?: string;
        /** the user id if the ticket represents access to user resources. If no user id is included, the ticket allows the application access to the application own resources only. */
        user?: string;
        /** the ticket scope. Defaults to [] if no scope is specified. */
        scope: string[];
        /** if user is set, includes the grant identifier referencing the authorization granted by the user to the application. Can be a unique identifier or string encoding the grant information as long as the server is able to parse the information later. */
        grant?: string | Grant;
        /** if false, the ticket cannot be delegated regardless of the application permissions. Defaults to true which means use the application permissions to delegate. */
        delegate?: boolean;
        /** if the ticket is the result of access delegation, the application id of the delegating application. */
        dlg?: string;
    }

    export interface UserTicket extends BaseTicket {
        /**
         * custom server public data attached to the ticket.
         * When a ticket is generated and sent to the application by the server, the response includes all of the above properties with the exception of ext which is included but only with the content of ext.public if present.
         * [see docs](https://github.com/hueniverse/oz#ticket)
         */
        ext?: string;
    }

    /**
     * Note this can just be the `App` interface.
     * [see code](https://github.com/hueniverse/oz/blob/a829664fdfef94c481beefc4750f4934e89ad1cd/lib/client.js#L25-L32)
     */
    export interface PartialAppCredentials {
        /** the ticket identifier used for making authenticated Hawk requests. */
        id: string;
        /** the HMAC algorithm used to authenticate (e.g. HMAC-SHA256). */
        algorithm: string;
        /** Same as UserTicket: the application id the ticket was issued to. */
        app?: string;
        /** Same as UserTicket: if the ticket is the result of access delegation, the application id of the delegating application. */
        dlg?: string;
    }

    /**
     * [see docs](https://github.com/hueniverse/oz#new-ozclientconnectionoptions)
     */
    export interface ConnectionOptionsNoAppFunction {
        /** an object containing the server protocol endpoints */
        endpoints?: EndPointPaths & {rsvp?: undefined};
        /** required, the server full root uri without path (e.g. 'https://example.com'). */
        uri: string;
    }
    export interface ConnectionOptionsWithAppFunction extends ConnectionOptionsNoAppFunction {
        /**
         * required, the application hawk credentials.
         * [see code](https://github.com/hueniverse/oz/blob/a829664fdfef94c481beefc4750f4934e89ad1cd/lib/client.js#L159)
         * [see code](https://github.com/hueniverse/oz/blob/a829664fdfef94c481beefc4750f4934e89ad1cd/lib/client.js#L25)
         * [see hawk code](https://github.com/hueniverse/hawk/blob/54be9e2/lib/client.js#L26-L30)
         */
        credentials: Client.PartialAppCredentials;
    }

    export interface ConnectionNoAppFunction {
        /**
         * Requests a protected resource
         * [see docs](https://github.com/hueniverse/oz#connectionrequestpath-ticket-options-callback)
         * @param path  the resource path (e.g. '/resource').
         * @param ticket  the application or user ticket. If the ticket is expired, it will automatically attempt to refresh it.
         * @param options  optional configuration object
         * @param callback  the callback method using the signature function(err, result, code, ticket)
         */
        request(path: string, ticket: UserTicket, options: ConnectionRequestOptions, callback: ConnectionRequestCallback): void;
        /**
         * Reissues (refresh) a ticket
         * [see docs](https://github.com/hueniverse/oz#connectionreissueticket-callback)
         * @param ticket  the ticket being reissued.
         * @param callback  the callback method using the signature function(err, reissued) where:
         *      * err  an error condition.
         *      * reissued  the reissued ticket.
         */
        reissue(ticket: UserTicket, callback: (err: Error | null, reissued?: UserTicket) => void): void;
    }
    export interface ConnectionWithAppFunction extends ConnectionNoAppFunction {
        /**
         * Requests a protected resource using a shared application ticket.
         * Once an application ticket is obtained internally using the provided hawk credentials in the constructor, it will be reused by called to connection.app(). If it expires, it will automatically refresh and stored for future usage.
         * [see docs](https://github.com/hueniverse/oz#connectionapppath-options-callback)
         * @param path  the resource path (e.g. '/resource').
         * @param options  optional configuration object
         * @param callback  the callback method using the signature function(err, result, code, ticket)
         */
        app(path: string, callback: ConnectionRequestCallback): void;
        app(path: string, options: ConnectionRequestOptions, callback: ConnectionRequestCallback): void;
    }

    /**
     * optional configuration object
     * [see docs](https://github.com/hueniverse/oz#connectionrequestpath-ticket-options-callback)
     * [see docs](https://github.com/hueniverse/oz#connectionapppath-options-callback)
     */
    export interface ConnectionRequestOptions {
        /** the HTTP method (e.g. 'GET'). Defaults to 'GET'. */
        method?: Hawk.HTTP_METHODS_PARTIAL;
        /** the request payload object or string. Defaults to no payload. */
        payload?: Object | string;
    }

    /**
     * [see docs](https://github.com/hueniverse/oz#connectionrequestpath-ticket-options-callback)
     * [see docs](https://github.com/hueniverse/oz#connectionapppath-options-callback)
     */
    export interface ConnectionRequestCallback {
        /**
         * @param err  an error condition.
         * @param result  the requested resource (parsed to object if JSON).
         * @param code  the HTTP response code.
         * @param ticket  the ticket used to make the request (may be different from the ticket provided when the ticket was expired and refreshed).
         */
        (err: Error | null, result: any, code: number, ticket: UserTicket): void;
    }
}

declare var Client: Client;

export = Client;
