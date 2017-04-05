/** cache functionality via the "CatBox" module. */
export interface ICatBoxCacheOptions {
    /**  a prototype function or catbox engine object.  */
    engine: any;
    /**   an identifier used later when provisioning or configuring caching for server methods or plugins. Each cache name must be unique. A single item may omit the name option which defines the default cache. If every cache includes a name, a default memory cache is provisions as well.  */
    name?: string;
    /**   if true, allows multiple cache users to share the same segment (e.g. multiple methods using the same cache storage container). Default to false.  */
    shared?: boolean;
}

/** policy configuration for the "CatBox" module and server method options. */
export interface ICatBoxCachePolicyOptions {
    /** the cache name configured in server.cache. Defaults to the default cache. */
    cache?: string;
    /** string segment name, used to isolate cached items within the cache partition. When called within a plugin, defaults to '!name' where 'name' is the plugin name. When called within a server method, defaults to '#name' where 'name' is the server method name. Required when called outside of a plugin. */
    segment?: string;
    /** if true, allows multiple cache provisions to share the same segment. Default to false. */
    shared?: boolean;
    /** relative expiration expressed in the number of milliseconds since the item was saved in the cache. Cannot be used together with expiresAt. */
    expiresIn?: number;
    /** time of day expressed in 24h notation using the 'HH:MM' format, at which point all cache records expire. Uses local time. Cannot be used together with expiresIn. */
    expiresAt?: number;
    /** a function used to generate a new cache item if one is not found in the cache when calling get(). The method's signature is function(id, next) where: - id - the id string or object provided to the get() method. - next - the method called when the new item is returned with the signature function(err, value, ttl) where: - err - an error condition. - value - the new value generated. - ttl - the cache ttl value in milliseconds. Set to 0 to skip storing in the cache. Defaults to the cache global policy. */
    generateFunc?: Function;
    /** number of milliseconds to mark an item stored in cache as stale and attempt to regenerate it when generateFunc is provided. Must be less than expiresIn. */
    staleIn?: number;
    /** number of milliseconds to wait before checking if an item is stale. */
    staleTimeout?: number;
    /** number of milliseconds to wait before returning a timeout error when the generateFunc function takes too long to return a value. When the value is eventually returned, it is stored in the cache for future requests. Required if generateFunc is present. Set to false to disable timeouts which may cause all get() requests to get stuck forever. */
    generateTimeout?: number;
    /** if true, an error or timeout in the generateFunc causes the stale value to be evicted from the cache. Defaults to true */
    dropOnError?: boolean;
    /** if false, an upstream cache read error will stop the cache.get() method from calling the generate function and will instead pass back the cache error. Defaults to true. */
    generateOnReadError?: boolean;
    /** if false, an upstream cache write error when calling cache.get() will be passed back with the generated value when calling. Defaults to true. */
    generateIgnoreWriteError?: boolean;
    /** number of milliseconds while generateFunc call is in progress for a given id, before a subsequent generateFunc call is allowed. Defaults to 0 (no blocking of concurrent generateFunc calls beyond staleTimeout). */
    pendingGenerateTimeout?: number;
}
