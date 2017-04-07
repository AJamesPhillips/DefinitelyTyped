'use strict';

import * as Hapi from 'hapi';

var handler: Hapi.IRouteHandler = function(request: Hapi.Request, reply: Hapi.IReply) {
  reply('success');
}
var strictHandler: Hapi.IRouteHandler = function(request: Hapi.Request, reply: Hapi.IStrictReply<number>) {
  reply(123);
}
