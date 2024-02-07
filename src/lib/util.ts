import type { CallSite } from 'callsite';

import _ from 'lodash';
import debugFactory from 'debug';

const GG_ENABLED = true;

const timestampColumnNumberRegex = /(\?t=\d+)?(:\d+):\d+\)?$/;
const swapPathFunctionNameRegex = /([ \][_.\S]+) \((.*)/;
const swapPathFunctionNameRegexSafari = /([^@]+)@(.*)/;
const lineNumberRegex = /:\d+ ?/;

function callSiteCommonPathPrefixMatches(callSite: CallSite | string) {
	return (
		String(callSite).match(/[@(](?<prefix>.*?\/)lib\//i) ||
		String(callSite).match(/[@(](?<prefix>.*\/)chunks\//i)
	);
}

// callSite formats on different environments:
const callSites = [
	// local dev
	/* node   */ 'getStack (S:/p/bangtastic/src/lib/util.ts:21:17)',
	/* chrome */ 'getStack (http://192.168.0.5:5173/src/lib/util.ts?t=1707273649942:18:17)',
	/* safari */ 'getStack@http://192.168.0.5:5173/src/lib/util.ts:18:26',

	// vercel (production)
	/* node   */ 'getStack (file:///var/task/.svelte-kit/output/server/chunks/util.js:18:17)',
	/* chrome */ 'y (https://bangtastic.vercel.app/_app/immutable/chunks/util.pMXJCmiz.js:1:6712)',
	/* safari */ 'y@https://bangtastic.vercel.app/_app/immutable/chunks/util.pMXJCmiz.js:1:6721'
];

console.table(
	_.zipObject(
		callSites,
		callSites.map((callSite: string) => callSiteCommonPathPrefixMatches(callSite))
	)
);

const callSiteCommonPathPrefix =
	callSiteCommonPathPrefixMatches(getStack()[0])?.groups?.prefix || '';

// Show some info about gg
const storage =
	typeof localStorage !== 'undefined' ? localStorage : { getItem: () => '', setItem: () => null };
console.log({
	GG_ENABLED,
	'localStorage.debug': storage.getItem('debug'),
	callSiteCommonPathPrefix,
	callSite: getStack()[0].toString()
});

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
		.replace(callSiteCommonPathPrefix, '')
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
