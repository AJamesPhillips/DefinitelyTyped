'use strict';

import * as Hapi from 'hapi';

var authConfig: Hapi.IRouteAdditionalConfigurationOptions = {
  app: {}
};

// Handler in config
const user: Hapi.IRouteAdditionalConfigurationOptions = {
    cache: { expiresIn: 5000 },
    handler: function (request: Hapi.Request, reply: Hapi.IReply) {

        return reply({ name: 'John' });
    }
};
