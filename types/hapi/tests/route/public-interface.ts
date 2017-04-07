'use strict';

import * as Hapi from 'hapi';

var route = <Hapi.IRoutePublicInterface> {};

var a: string = route.method;
var a: string = route.path;
if (typeof(route.vhost) == 'string') {
  var a: string = route.vhost;
} else {
  var b: string[] = route.vhost;
}
var c: Hapi.IServerRealm = route.realm;
var d: Hapi.IRouteAdditionalConfigurationOptions = route.settings;
var a: string = route.fingerprint;
var e: boolean = route.auth.access(<Hapi.Request> {});
