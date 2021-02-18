const { promisify } = require('util');
const fs = require('fs');
const exec = promisify(require('child_process').exec);

const TMP_PATH = '/tmp/kowsen-chord-keys';

const CHROME_HEIGHT_OFFSET = 27;
const MAX = -1;
const GHOST_OPACITY = 90;

const keyCode = parseInt(process.argv[2]) - 1;

async function bash(command) {
	return (await exec(command)).stdout;
}

async function getActiveWorkspace() {
	return (await bash(`wmctrl -d | grep '*' | cut -d ' ' -f1`)).trim();
}

async function isGhost(window) {
	return !!((await bash(`xprop -id ${window} | grep '_NET_WM_STATE_ABOVE' | cat`)).trim());
}

async function isHidden(window) {
	return !!((await bash(`xprop -id ${window} | grep '_NET_WM_STATE_HIDDEN' | cat`)).trim());
}

async function isTransparent(window) {
	return (await bash(`xprop -id ${window} | grep '_NET_WM_WINDOW_OPACITY'`)).indexOf('4294967295') === -1;
}

async function getWindows() {
	const windowList = (await bash('wmctrl -l')).split('\n');
	const activeWorkspace = await getActiveWorkspace();
	const workspaceWindows = windowList
		.map(window => window.split(/\s+/))
		.filter(splitWindow => splitWindow[1] === activeWorkspace)
		.map(splitWindow => {
			return {
				handle: splitWindow[0],
				heightOffset: splitWindow.join(' ').indexOf('Google Chrome') === -1 ? 0 : CHROME_HEIGHT_OFFSET,
			};
		});
	return workspaceWindows;
}

async function getRegistered(windows) {
	const workspace = await getActiveWorkspace();
	windows = [...windows];
	const handles = [null, null, null, null];
	const toResolve = [];
	for (let i = 0; i < 4; i++) {
		const keyCode = i + 1;
		const path = `${TMP_PATH}/${keyCode}-${workspace}-save`;
		if (fs.existsSync(path)) {
			const savedId = parseInt(fs.readFileSync(path, 'utf8'));
			const windowIndex = windows.findIndex(window => parseInt(window.handle) === savedId);
			if (windowIndex !== -1) {
				handles[i] = {...windows[windowIndex], handle: savedId.toString()};
				windows = windows.filter(window => parseInt(window.handle) !== savedId);
				continue;
			}
		}
		toResolve.push(i);
	}
	for (let i = 0; i < toResolve.length; i++) {
		handles[toResolve[i]] = windows[i];
	}
	return handles;
}

async function getMonitors() {
	return (await bash('xrandr')).indexOf(4480) === -1 ? 1 : 2;
}

async function positionWindow(window, x, y, width, height) {
	if (!await isGhost(window)) {
		let bStr = '';
		if (width === MAX || height === MAX) {
			bStr += '-b add';
		}
		if (height === MAX) {
			bStr += ',maximized_vert';
		}
		if (width === MAX) {
			bStr += ',maximized_horz';
		}

		const eStr = `-e 0,${x},${y},${width},${height}`;

		await bash(`wmctrl -i -r ${window} -b add,above`);
		if (width !== MAX || height !== MAX) {
			await bash(`wmctrl -i -r ${window} -b remove,maximized_vert,maximized_horz`);
		}
		await bash(`wmctrl -i -r ${window} ${eStr}`);
		await bash(`wmctrl -i -r ${window} ${bStr}`);
		await setOpacity(window, GHOST_OPACITY);
	} else {
		if (await isHidden(window)) {
			await showWindow(window);
		} else {
			await hideWindow(window);
		}
		// await bash(`wmctrl -i -r ${window} -b toggle,hidden`);
		// await setOpacity(window, await isTransparent(window) ? 100 : GHOST_OPACITY);
	}
}

async function hideWindow(window) {
	await bash(`xdotool windowminimize ${window}`);
	// await bash(`xprop -id ${window} -f _NET_WM_STATE 32a -remove _NET_WM_STATE _NET_WM_STATE_SHOWN`);
	// await bash(`xprop -id ${window} -f _NET_WM_STATE 32a -set _NET_WM_STATE _NET_WM_STATE_HIDDEN`);
}

async function showWindow(window) {
	await bash(`wmctrl -ia ${window}`);
	// await bash(`xprop -id ${window} -f _NET_WM_STATE 32a -remove _NET_WM_STATE _NET_WM_STATE_HIDDEN`);
	// await bash(`xprop -id ${window} -f _NET_WM_STATE 32a -set _NET_WM_STATE _NET_WM_STATE_SHOWN`);
}

async function setOpacity(window, opacity) {
	await bash(`xprop -id ${window} -f _NET_WM_WINDOW_OPACITY 32c -set _NET_WM_WINDOW_OPACITY "$(printf 0x%x $((0xffffffff * ${opacity} / 100)))"`);
}

async function placeWindow1(window) {
	const GHOST_X = 1140;
	const GHOST_Y = 400;
	const GHOST_WIDTH = 700;
	const GHOST_HEIGHT = 400;

	positionWindow(window.handle, GHOST_X, GHOST_Y, GHOST_WIDTH, GHOST_HEIGHT + window.heightOffset);

}

async function placeWindow2(window) {

}

async function placeWindow(window, numDisplays) {
	if (numDisplays === 1) {
		await placeWindow1(window);
	} else if (numDisplays === 2) {
		await placeWindow2(window);
	}
}

async function sleep(amount) {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, amount);
	});
}

async function run() {
	const numDisplays = await getMonitors();
	const windows = await getWindows();
	const registered = await getRegistered(windows);

	if (registered[keyCode]) {
		await placeWindow(registered[keyCode], numDisplays);
	}
}

run();

// 
