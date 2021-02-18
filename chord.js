const { promisify } = require('util');
const fs = require('fs');
const exec = promisify(require('child_process').exec);

const TMP_PATH = '/tmp/kowsen-chord-keys';
const LOCK_PATH = `${TMP_PATH}/lock`;

const PERIOD = 1000;
const MAX = -1;

const CHROME_HEIGHT_OFFSET = 27;

const times = process.argv.slice(2).map((time, index) => ({time: parseInt(time), index}));
const order = times.sort((a, b) => b.time - a.time).filter(({time}) => time < PERIOD).map(({index}) => index);

async function bash(command) {
	return (await exec(command)).stdout;
}

async function getActiveWorkspace() {
	return (await bash(`wmctrl -d | grep '*' | cut -d ' ' -f1`)).trim();
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

async function getWindowOrder() {
	const windows = await getWindows();
	const registered = await getRegistered(windows);
	return order.map(index => registered[index]).filter(val => !!val);
}

async function getMonitors() {
	return (await bash('xrandr')).indexOf(4480) === -1 ? 1 : 2;
}

async function positionWindow(window, x, y, width, height) {
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

	await setOpacity(window, 100);
	await bash(`wmctrl -i -r ${window} -b remove,above`);
	if (width !== MAX || height !== MAX) {
		await bash(`wmctrl -i -r ${window} -b remove,maximized_vert,maximized_horz`);
	}
	await bash(`wmctrl -i -r ${window} ${eStr}`);
	await bash(`wmctrl -i -r ${window} ${bStr}`);
}

async function setOpacity(window, opacity) {
	await bash(`xprop -id ${window} -f _NET_WM_WINDOW_OPACITY 32c -set _NET_WM_WINDOW_OPACITY "$(printf 0x%x $((0xffffffff * ${opacity} / 100)))"`);
}

async function placeWindow1(window, index, count) {
	const COLUMN_WIDTH = 955;
	const ROW_HEIGHT = 495;
	const BOTTOM_OFFSET = 556;
	const RIGHT_OFFSET = 965;
	const FULL_WIDTH = 1920;
	const FULL_HEIGHT = 1024;

	if (count === 1) {
		await positionWindow(window.handle, 0, 0, -1, -1);
	} else if (count === 2) {
		if (index === 0) {
			await positionWindow(window.handle, 0, 0, COLUMN_WIDTH, FULL_HEIGHT + window.heightOffset);
		} else if (index === 1) {
			await positionWindow(window.handle, RIGHT_OFFSET, 0, COLUMN_WIDTH, FULL_HEIGHT + window.heightOffset);
		}
	} else if (count === 3) {
		if (index === 0) {
			await positionWindow(window.handle, 0, 0, COLUMN_WIDTH, FULL_HEIGHT + window.heightOffset);
		} else if (index === 1) {
			await positionWindow(window.handle, RIGHT_OFFSET, 0, COLUMN_WIDTH, ROW_HEIGHT + window.heightOffset);
		} else if (index === 2) {
			await positionWindow(window.handle, RIGHT_OFFSET, BOTTOM_OFFSET, COLUMN_WIDTH, ROW_HEIGHT + window.heightOffset);
		}
	} else if (count === 4) {
		if (index === 0) {
			await positionWindow(window.handle, 0, 0, COLUMN_WIDTH, ROW_HEIGHT + window.heightOffset);
		} else if (index === 1) {
			await positionWindow(window.handle, 0, BOTTOM_OFFSET, COLUMN_WIDTH, ROW_HEIGHT + window.heightOffset);
		} else if (index === 2) {
			await positionWindow(window.handle, RIGHT_OFFSET, 0, COLUMN_WIDTH, ROW_HEIGHT + window.heightOffset);
		} else if (index === 3) {
			await positionWindow(window.handle, RIGHT_OFFSET, BOTTOM_OFFSET, COLUMN_WIDTH, ROW_HEIGHT + window.heightOffset);
		}
	}
}

async function placeWindow2(window, index, count) {
	const DISPLAY1_WIDTH = 2560;
	const DISPLAY1_HEIGHT = 1384;
	const DISPLAY1_COLUMN_WIDTH = 1275;
	const DISPLAY1_RIGHT_OFFSET = 1285;

	const DISPLAY2_WIDTH = 1920;
	const DISPLAY2_HEIGHT = 1052;
	const DISPLAY2_BASE_X = 2560;
	const DISPLAY2_BASE_Y = 385;
	const DISPLAY2_COLUMN_WIDTH = 955;
	const DISPLAY2_RIGHT_OFFSET = DISPLAY2_BASE_X + 965;

	if (count === 1) {
		await positionWindow(window.handle, 0, 0, -1, -1);
	} else if (count === 2) {
		if (index === 0) {
			await positionWindow(window.handle, 0, 0, -1, -1);
		} else if (index === 1) {
			await positionWindow(window.handle, DISPLAY2_BASE_X, DISPLAY2_BASE_Y, -1, -1);
		}
	} else if (count === 3) {
		if (index === 0) {
			await positionWindow(window.handle, 0, 0, DISPLAY1_COLUMN_WIDTH, DISPLAY1_HEIGHT + window.heightOffset);
		} else if (index === 1) {
			await positionWindow(window.handle, DISPLAY1_RIGHT_OFFSET, 0, DISPLAY1_COLUMN_WIDTH, DISPLAY1_HEIGHT + window.heightOffset);
		} else if (index === 2) {
			await positionWindow(window.handle, DISPLAY2_BASE_X, DISPLAY2_BASE_Y, -1, -1);
		}
	} else if (count === 4) {
		if (index === 0) {
			await positionWindow(window.handle, 0, 0, DISPLAY1_COLUMN_WIDTH, DISPLAY1_HEIGHT + window.heightOffset);
		} else if (index === 1) {
			await positionWindow(window.handle, DISPLAY1_RIGHT_OFFSET, 0, DISPLAY1_COLUMN_WIDTH, DISPLAY1_HEIGHT + window.heightOffset);
		} else if (index === 2) {
			await positionWindow(window.handle, DISPLAY2_BASE_X, DISPLAY2_BASE_Y, DISPLAY2_COLUMN_WIDTH, DISPLAY2_HEIGHT + window.heightOffset);
		} else if (index === 3) {
			await positionWindow(window.handle, DISPLAY2_RIGHT_OFFSET, DISPLAY2_BASE_Y, DISPLAY2_COLUMN_WIDTH, DISPLAY2_HEIGHT + window.heightOffset);
		}
	}
}

async function placeWindow(window, index, count, numDisplays) {
	if (numDisplays === 1) {
		await placeWindow1(window, index, count);
	} else if (numDisplays === 2) {
		await placeWindow2(window, index, count);
	}
}

async function sleep(amount) {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, amount);
	});
}

async function getLock() {
	while (fs.existsSync(LOCK_PATH)) {
		await sleep(5);
	}
	fs.closeSync(fs.openSync(LOCK_PATH, 'w'));
}

async function releaseLock() {
	fs.unlinkSync(LOCK_PATH);
}

async function run() {
	await getLock();
	const numDisplays = await getMonitors();
	console.log(numDisplays);
	const windows = await getWindowOrder();
	for (let i = 0; i < windows.length; i++) {
		await placeWindow(windows[i], i, windows.length, numDisplays);
	}
	await releaseLock();
}

run();

// 
