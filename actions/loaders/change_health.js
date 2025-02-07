export default (actionData) => {
	let sequence = [];

	if (!isNaN(actionData.health) && actionData.health !== 20) {
		sequence.push(['click', { slot: 10 }]);
		sequence.push(['anvil', { text: actionData.health }]);
	}

	if (actionData.mode && actionData.mode !== "set") {
		sequence.push(['click', { slot: 11 }]);
		if (actionData.mode === 'increment') sequence.push(['click', { slot: 10 }]);
		if (actionData.mode === 'decrement') sequence.push(['click', { slot: 11 }]);
	}

	return ['Change Health', sequence];
}