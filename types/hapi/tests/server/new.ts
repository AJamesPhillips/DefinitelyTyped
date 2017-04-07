'use strict';

import * as Hapi from 'hapi';

new Hapi.Server();
new Hapi.Server({
  app: {some: 'values'},
  cache: require('catbox-redis'),
});

// Specific cache configuration options
new Hapi.Server({
  cache: {
    engine: require('catbox-redis'),
    // name: 'optionally omitted when only a single cache used',
  }
});
new Hapi.Server({
  cache: [{
    engine: require('catbox-redis'),
    name: 'unique 1',
  },
  {
    engine: require('catbox-redis'),
    name: 'unique 2',
    shared: true,
    otherOptions: 'will be passed to the catbox strategy',
  }]
});
new Hapi.Server({
  cache: [{
    engine: require('catbox-redis'),
  },
  // Does not correctly error but will be caught by hapi at runtime
  {
    engine: require('catbox-redis'),
  }]
});

new Hapi.Server({
  connections: {
    app: {},
    compression: false,
    load: {
        maxHeapUsedBytes: 10,
        maxRssBytes: 10,
        maxEventLoopDelay: 10,
    },
    plugins: {
      'some-plugin-name': {options: 'here'}
    },
    router: {
      isCaseSensitive: false,
      stripTrailingSlash: true,
    },
    routes: {}
  }
})
