'use strict';

import * as Hapi from 'hapi';

var authConfig: Hapi.IRouteAuthConfiguration = false;
var authConfig: Hapi.IRouteAuthConfiguration = 'some_strategy';
var authConfig: Hapi.IRouteAuthConfiguration = {
  mode: <'required' | 'optional' | 'try'> 'required',
  strategies: ['strat1', 'strat2'],
  strategy: 'should not be given when strategies given',
  payload: <false | 'required' | 'optional'> false,
  access: <Hapi.IRouteAuthAccessConfiguation | Hapi.IRouteAuthAccessConfiguation[]> {}
};

var authAccessConfig: Hapi.IRouteAuthAccessConfiguation = {
  scope: <false | string | string[]> false,
  entity: <'any' | 'user' | 'app'> 'any',
}
