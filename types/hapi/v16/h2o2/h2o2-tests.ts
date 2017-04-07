import http = require("http");
import * as Boom from 'boom';
import * as hapi from 'hapi';
import * as Wreck from 'wreck';
import * as h2o2 from 'h2o2';

// const handler = function (request: hapi.Request, reply: hapi.IReply) {
//     return reply.proxy({ host: 'example.com', port: 80, protocol: 'http' });
// };

const server = new hapi.Server({});

var proxyOptions: h2o2.IProxyHandlerOptions = {
    host: '10.33.33.1',
    port: '443',
    protocol: 'https'
};
var routeConfig: hapi.IRouteConfiguration = {
    method: 'GET',
    path: '/',
    handler: {
        proxy: proxyOptions
    }
};
server.route({
    method: 'GET',
    path: '/',
    handler: {
        proxy: proxyOptions
    }
});

server.route({
    method: 'GET',
    path: '/',
    handler: {
        proxy: {
            uri: 'https://some.upstream.service.com/that/has?what=you&want=todo'
        }
    }
});

server.route({
    method: 'GET',
    path: '/',
    handler: {
        proxy: {
            mapUri: function (request: hapi.Request, callback: (err: null | Boom.BoomError, value: string) => void) {

                console.log('doing some aditional stuff before redirecting');
                callback(null, 'https://some.upstream.service.com/');
            },
            onResponse: function (err: null | Boom.BoomError, res: http.IncomingMessage, request: hapi.Request, reply: hapi.IReply, settings: h2o2.IProxyHandlerOptions, ttl: number) {

                console.log('receiving the response from the upstream.');
                Wreck.read(res, { json: true }, function (err: null | Boom.BoomError, payload: any) {

                    console.log('some payload manipulation if you want to.')
                    reply(payload).headers = res.headers;
                });
            }
        }
    }
});
