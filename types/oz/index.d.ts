
import http = require("http");
import stream = require("stream");
import * as Hawk from "hawk";
import Iron = require("iron");
// TODO check and change this as pretty sure this is not how it should be used but it works
import OzClient = require("oz/lib/client");

/**
 * An object describing an application
 * [see doc](https://github.com/hueniverse/oz#app-object)
 */
export interface App extends Hawk.Credentials {
    /** an array with the default application scope. */
    scope?: string[];
    /** if true, the application is allowed to delegate a ticket to another application. Defaults to false. */
    delegate?: boolean;
}


// TODO where does this come from / defined / used
export interface AppTicket extends OzClient.BaseTicket {
    exp: number;
    app: string;
}

// export interface Ticket extends OzClient.BaseTicket {
//     /**
//      * custom server data
//      * [see docs](https://github.com/hueniverse/oz#ticket)
//      */
//     ext?: Ext;
// }

/**
 * [see docs](https://github.com/hueniverse/oz#ticket)
 */
export interface Ext {
    /** also made available to the application when the ticket is sent back. */
    public: string;
    /** available only within the encoded ticket. */
    private: string;
}

// TODO make this DRY
export interface Grant extends OzClient.Grant {}
export interface UserTicket extends OzClient.UserTicket {}

interface ticket {
    rsvp(app: App, grant: Grant, encryptionPassword: string, options: RsvpOptions, callback: (err: Error | null, rsvp: Rsvp) => void): void;
}

export type Rsvp = string;

export interface RsvpOptions {
    ttl?: number;
    /**
     * If not given will use Iron.defaults
     * [see code](https://github.com/hueniverse/oz/blob/v4.0.5/lib/ticket.js#L301)
     * For default [see code](https://github.com/hueniverse/iron/blob/v4.0.4/lib/index.js#L18-L36)
     */
    iron?: Iron.Options;
}

interface EndpointFunction {
    /** Copied directly from the how the [scarecrow hapi server invokes the Oz endpoint functions](https://github.com/hapijs/scarecrow/blob/v3.0.4/lib/index.js#L65) */
    (request: http.IncomingMessage, payload: stream.Readable | Buffer | any, options: EndPointOptions, callback: (err: Error | null, result?: string | AppTicket) => void): void;
}

/**
 * Obtained by looking at:
 * [default options passed by Scarecrow](https://github.com/hapijs/scarecrow/blob/v3.0.4/lib/index.js#L20-L26)
 * the [example options used in scarecrow the tests](https://github.com/hapijs/scarecrow/blob/v3.0.4/test/index.js#L54-L71)
 * and by [the implementations of the app, rsvp and reissue Oz endpoint functions](https://github.com/hueniverse/oz/blob/v4.0.5/lib/endpoints.js#L33).
 */
export interface EndPointOptions {
    /** [see code](https://github.com/hueniverse/oz/blob/v4.0.5/lib/endpoints.js#L35) */
    hawk: null | Hawk.ServerAuthenticateOptions;
    /** guessed.  TODO check and test this */
    ticket: null | OzClient.BaseTicket;
    encryptionPassword: string;
    loadAppFunc(application_id: string, callback: LoadAppCallback): void;
    loadGrantFunc(grant_id: string, callback: LoadGrantCallback): void;
}

interface LoadAppCallback {
    (err: Error): void;
    (err: null, app: App): void;
}

interface LoadGrantCallback {
    (err: Error): void;
    (err: null, grant: Grant, ext?: Ext): void;
}

export type EndPointPaths = OzClient.EndPointPaths;

type EndpointFunctions = {
    [P in keyof OzClient.EndPointPaths]?: EndpointFunction;
    // [index: string]: EndpointFunction | undefined;
}

interface Server {
    /**
     * [Based on Scarecrows hapijs implementation](https://github.com/hapijs/scarecrow/blob/v3.0.4/lib/index.js#L82)
     */
    authenticate(req: http.IncomingMessage, encryptionPassword: string, options: {hawk: null | Hawk.ServerAuthenticateOptions}, callback: (err: Error | null, credentials?: Hawk.Credentials, artifacts?: Hawk.Artifacts) => void): void;
}

export var endpoints: EndpointFunctions;
export var server: Server;
export var hawk: Hawk.API;
export var ticket: ticket;
export var client: OzClient;
