
import Boom = require("boom");

/**
 * [see docs](https://github.com/hueniverse/iron#options)
 */
export interface OptionsBase<CrpOps> {
    /** defines the options used by the encryption process. */
    encryption: CrpOps;
    /** defines the options used by the HMAC integrity verification process. */
    integrity: CrpOps;
}

/**
 * [see docs](https://github.com/hueniverse/iron#options)
 */
export interface SealUnsealOptionsBase<CrpOps> extends OptionsBase<CrpOps> {
    /** sealed object lifetime in milliseconds where 0 means forever. Defaults to 0. */
    ttl: number;
    /** number of seconds of permitted clock skew for incoming expirations. Defaults to 60 seconds. */
    timestampSkewSec: number;
    /** local clock time offset, expressed in number of milliseconds (positive or negative). Defaults to 0. */
    localtimeOffsetMsec: number;
}
export interface SealUnsealOptions extends OptionsBase<CryptoOptions> {}

export interface GenerateKeyOptions extends OptionsBase<CryptoOptionsGenerateKey> {}

/**
 * [see docs](https://github.com/hueniverse/iron#options)
 */
export interface CryptoOptions {
    /** the size of the salt (random buffer used to ensure that two identical objects will generate a different encrypted result. */
    saltBits: number;
    /** the algorithm used ('aes-256-cbc' for encryption and 'sha256' for integrity are the only two supported at this time). */
    algorithm: 'aes-128-ctr' | 'aes-256-cbc' | 'sha256';
    /** the number of iterations used to derive a key from the password. Set to 1 by default. The number of ideal iterations to use is dependent on your application's performance requirements. More iterations means it takes longer to generate the key. */
    iterations: number;
}

export interface CryptoOptionsGenerateKey extends CryptoOptions {
    /** Required by generateKey */
    minPasswordlength: number;
    salt?: string;
    iv?: string;
}

/**
 * All available options
 * [see code](https://github.com/hueniverse/iron/blob/dc84162/lib/index.js#L18-L36)
 *
    exports.defaults = {
        encryption: {
            saltBits: 256,
            algorithm: 'aes-256-cbc',
            iterations: 1,
            minPasswordlength: 32
        },

        integrity: {
            saltBits: 256,
            algorithm: 'sha256',
            iterations: 1,
            minPasswordlength: 32
        },

        ttl: 0,                                             // Milliseconds, 0 means forever
        timestampSkewSec: 60,                               // Seconds of permitted clock skew for incoming expirations
        localtimeOffsetMsec: 0                              // Local clock time offset express in a number of milliseconds (positive or negative)
    };
 */
interface Options extends SealUnsealOptionsBase<CryptoOptionsGenerateKey> {}

export var defaults: Options;

/**
 * [see code](https://github.com/hueniverse/iron/blob/dc84162/lib/index.js#L93-L98)
 * [see code](https://github.com/hueniverse/iron/blob/dc84162/lib/index.js#L154-L162)
 */
export interface Key {
    key: Buffer;
    salt: string;
    iv: string;
}

/**
 * [see code](https://github.com/hueniverse/iron/blob/dc84162/lib/index.js#L67)
 */
export function generateKey(password: string | Buffer, options: GenerateKeyOptions, callback: (err: Boom.BoomError | null, result: Key) => void): void;

/**
 * [see code](https://github.com/hueniverse/iron/blob/dc84162/lib/index.js#L172)
 */
export function encrypt(password: string | Buffer, options: GenerateKeyOptions, data: any, callback: (err: Boom.BoomError | null, enc: Buffer, key: Key) => void): void;

/**
 * [see code](https://github.com/hueniverse/iron/blob/dc84162/lib/index.js#L191)
 */
export function decrypt(password: string | Buffer, options: GenerateKeyOptions, data: string, callback: (err: Boom.BoomError | null, dec: any) => void): void;

/**
 * [see code](https://github.com/hueniverse/iron/blob/dc84162/lib/index.js#L211)
 */
export function hmacWithPassword(password: string | Buffer, options: GenerateKeyOptions, data: any, callback: (err: Boom.BoomError | null, result: {digest: string; salt: string;}) => void): void;

/**
 * [see code](https://github.com/hueniverse/iron/blob/dc84162/lib/index.js#L259)
 */
export function seal(object: any, password: Password, options: SealUnsealOptions, callback: (err: Boom.BoomError | null, sealed: string) => void): void;

/**
 * [see code](https://github.com/hueniverse/iron/blob/dc84162/lib/index.js#L323)
 */
export function unseal(sealed: string, password: Password, options: SealUnsealOptions, callback: (err: Boom.BoomError | null, unsealed: any) => void): void;

/**
 * [see code](https://github.com/hueniverse/iron/blob/dc84162/lib/index.js#L320)
 */
export type Password = string | Buffer | { id: string; } | { id: { encryption: string; integrity: string; } };
