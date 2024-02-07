import type { CallSite } from 'callsite';

import debugFactory from 'debug';

const GG_ENABLED = true;

const timestampColumnNumberRegex = /(\?t=\d+)?(:\d+):\d+\)?$/;
const swapPathFunctionNameRegex = /([ \][_.\S]+) \((.*)/;
const swapPathFunctionNameRegexSafari = /([^@]+)@(.*)/;
const lineNumberRegex = /:\d+ ?/;

const callSiteFileNameCommonPrefix =
	getStack()[0]
		?.toString()
		.match(/[@(](.*?\/)lib\//i)?.[1] || '';

// Show some info about gg
const storage =
	typeof localStorage !== 'undefined' ? localStorage : { getItem: () => '', setItem: () => null };
console.log({
	GG_ENABLED,
	'localStorage.debug': storage.getItem('debug'),
	callSiteFileNameCommonPrefix,
	callSite: getStack()[0].toString()
});

// callSite formats on different environments:

// local dev
// chrome: getStack (http://192.168.0.5:5173/src/lib/util.ts?t=1707273649942:18:17)
// node:   getStack (S:/p/bangtastic/src/lib/util.ts:21:17)
// safari: getStack@http://192.168.0.5:5173/src/lib/util.ts:18:26

function getStack() {
	// Get stack array
	const savedPrepareStackTrace = Error.prepareStackTrace;
	Error.prepareStackTrace = (error, stack) => stack;
	const error = new Error();
	let stack = error.stack as unknown as string | CallSite[] | string[];

	if (typeof stack === 'string') {
		stack = stack.split('\n');
	}

	Error.prepareStackTrace = savedPrepareStackTrace;
	return stack || [];
}

export function gg(...args: [...unknown[]]) {
	if (!GG_ENABLED) {
		return args[0];
	}

	const stack = getStack();

	const caller = getStack()[2].toString() || '';

	const callerClean = caller.replace(timestampColumnNumberRegex, '$2'); // Strip timestamp and/or column number.
	const callerSwapped = callerClean.includes('@')
		? callerClean.replace(swapPathFunctionNameRegexSafari, '$2 $1') // Put path in front of function name.
		: callerClean.replace(swapPathFunctionNameRegex, '$2 $1');
	const callerFinal = callerSwapped
		.replace(callSiteFileNameCommonPrefix, '')
		.replace(lineNumberRegex, '| '); // Remove base path and line number.

	// console.table({ caller, callerClean, callerSwapped, callerFinal })

	const ggLog = debugFactory(callerFinal);
	if (args.length === 0) {
		ggLog(caller);
		return { caller, stack };
	}

	ggLog(...(args as [formatter: unknown, ...args: unknown[]]));
	return args[0];
}
