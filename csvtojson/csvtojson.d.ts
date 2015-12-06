// Type definitions for csvtojson 0.4.5
// Project: https://www.npmjs.com/package/csvtojson
// Definitions by: Alexander James Phillips <https://github.com/AJamesPhillips>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/// <reference path="../node/node.d.ts" />

interface unknown {}

interface converterOptions {
	constructResult?: boolean;
	delimiter?: string;
	quote?: string;
	trim?: boolean;
	checkType?: boolean;
	toArrayString?: boolean;
	ignoreEmpty?: boolean;
	workerNum?: number;
	fork?: boolean;
	noheader?: boolean;
	headers?: string[];
	flatKeys?: boolean;
	maxRowLength?: number;
	checkColumn?: boolean;
	eol?: string;
}

interface resultObject {
	csvRows: any[];
}

interface parserResult {
	head: string;
	item: string;
	itemIndex: number;
	rawRow: any[];
	resultRow: {[index: string]: any};
	rowIndex: number;
	resultObject: resultObject;
}

interface parserMgr {
	addParser(parserName: string, parserRegExp: RegExp, callback: (params: parserResult) => void): void;
}

interface onEventCallback {
	// On `end_parsed`
	(jsonArray: parserResult[]): void;
	// On `record_parsed`
	(rawRow: any[], resultRow: {[index: string]: any}, rowIndex: number): void;
}

declare module "csvtojson" {
  import {Writable} from 'stream';
  import {EventEmitter} from 'events';

  export class Converter extends Writable {
    constructor(options: converterOptions);
    on(eventType: string, callback: onEventCallback): EventEmitter;
    fromString(csvString: string, callback: (err: unknown, result: unknown) => unknown): unknown;
    parserMgr: parserMgr;
    writeable: boolean;
  }
}
