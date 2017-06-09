import * as Hapi from "hapi";
import * as Oz from "oz";

declare namespace Scarecrow {
    interface OzHapiStrategyOptions {
        oz: Oz.EndPointOptions;
        urls?: Oz.EndPointPaths;
    }
}

declare var Scarecrow: Hapi.PluginFunction<{}>;

export = Scarecrow;
