'use strict';

import * as Hapi from 'hapi';

// different methods
var routeConfig: Hapi.IRouteConfiguration = {
  path: '/signin',
  method: 'PUT',
  vhost: 'site.coms',
};
var routeConfig: Hapi.IRouteConfiguration = {
  path: '/signin',
  method: '*'
};
var routeConfig: Hapi.IRouteConfiguration = {
  path: '/signin',
  method: ['OPTIONS', '*']
};

// different handlers
var routeConfig: Hapi.IRouteConfiguration = {
  path: '/signin',
  method: 'PUT',
  handler: 'some registered handler'
};
var routeConfig: Hapi.IRouteConfiguration = {
  path: '/signin',
  method: 'PUT',
  handler: function (request: Hapi.Request, reply: Hapi.IReply) {
    return reply('ok');
  }
};

const server = new Hapi.Server();
server.route(routeConfig);

// Handler in config
const user: Hapi.IRouteAdditionalConfigurationOptions = {
    cache: { expiresIn: 5000 },
    handler: function (request: Hapi.Request, reply: Hapi.IReply) {

        return reply({ name: 'John' });
    }
};

server.route({method: 'GET', path: '/user', config: user });
