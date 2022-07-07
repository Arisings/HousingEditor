import { request as axios } from "axios";
import { Input, Button } from './GuiBuilder.js';
import Action from '../actions/Action.js';
import { addOperation } from './Queue.js';

const button = new Button(0, 0, 0, 20, 'Paste');

const input = new Input(0, 0, 0, 18);
input.setEnabled(false);
input.setText('Paste Action ID')
input.mcObject.func_146203_f(24) // set max length

register('guiRender', (x, y) => {
	if (!Player.getContainer()) return;
	if (Player.getContainer().getName() !== 'Edit Actions') return;

	const guiTopField = net.minecraft.client.gui.inventory.GuiContainer.class.getDeclaredField('field_147009_r');
	const xSizeField = net.minecraft.client.gui.inventory.GuiContainer.class.getDeclaredField('field_146999_f');
	guiTopField.setAccessible(true);
	xSizeField.setAccessible(true);
	var chestGuiTop = guiTopField.get(Client.currentGui.get())
	var chestWidth = xSizeField.get(Client.currentGui.get())

	const margin = 5;
	const sizeDifference = 10;

	button.setWidth(chestWidth / 2 - sizeDifference);
	button.setX(Renderer.screen.getWidth() / 2 + sizeDifference);
	button.setY(chestGuiTop - button.getHeight() - margin + 1);

	input.setWidth(chestWidth / 2 + sizeDifference - margin);
	input.setX(Renderer.screen.getWidth() / 2 - input.getWidth() + sizeDifference - margin);
	input.setY(chestGuiTop - input.getHeight() - margin);

	button.render(x,y);
	input.render();
})

register('guiKey', (char, keyCode, gui, event) => {
	if (!Player.getContainer()) return;
	if (Player.getContainer().getName() !== 'Edit Actions') return;

	input.mcObject.func_146195_b(true);
	if (input.mcObject.func_146206_l()) {
		input.mcObject.func_146201_a(char, keyCode);
		inputUpdate()
		if (keyCode !== 1) { // keycode for escape key
			cancel(event)
		}
	}
})

function inputUpdate() {
	if (input.getText().match(/^[a-f\d]{24}$/i)) {
		button.setText('Import');
		button.setEnabled(true);
	} else if (input.getText().length === 0) {
		button.setText('Paste');
		button.setEnabled(true);
	} else {
		button.setText('Invalid ID');
		button.setEnabled(false);
	}
}

register('guiMouseClick', (x, y, mouseButton) => {
	if (!Player.getContainer()) return;
	if (Player.getContainer().getName() !== 'Edit Actions') return;

	input.mcObject.func_146192_a(x,y,mouseButton);
	if (x > input.getX() && x < input.getX() + input.getWidth() && y > input.getY() && y < input.getY() + input.getHeight()) {
		if (input.getText() === 'Paste Action ID') {
			input.setText('')
			input.setCursorPosition(0);
		}
		input.setEnabled(true);
	} else {
		input.setEnabled(false);
	}

	if (x > button.getX() && x < button.getX() + button.getWidth() && y > button.getY() && y < button.getY() + button.getHeight()) {
		if (button.getText() === 'Paste') {
			input.setText(java.awt.Toolkit.getDefaultToolkit().getSystemClipboard().getData(java.awt.datatransfer.DataFlavor.stringFlavor))
			World.playSound('random.click', 1, 1)
			inputUpdate();
			return;
		}
		if (input.getText() === 'Invalid ID') {
			ChatLib.chat('&cDouble-check your ID.');
			return;
		};
		if (!button.getEnabled()) {
			World.playSound('mob.villager.no', 1, 1)
			return;
		};

		World.playSound('random.click', 1, 1)
		button.setText('Getting Data...');
		button.setEnabled(false);

		setTimeout(() => {
			button.setText('Paste');
			axios({
				url: 'http://localhost:3000/api/actions/' + input.getText(),
				method: 'GET',
			}).then(response => {
				const json = response.data;
				input.setSelectionEnd(0);
				input.setCursorPosition(0);
				input.setLineScrollOffset(0);
				input.setIsFocused(false);
				input.setText('Paste Action ID');
				loadResponse(json.actionData, json.post?.title, json.author?.name);
			}).catch(error => {
				if (!error.response) return ChatLib.chat('&cError: ' + error);
				const response  = error.response;
				const contentType = response.headers['Content-Type'];
				if (contentType.indexOf('application/json') > -1) {
					const json = response.data;
					ChatLib.chat('&cError: ' + json.message);
				} else {
					ChatLib.chat('&cError: ' + response.statusText);	
				};
				Client.currentGui.close();
			})
		}, 1000);

	}
})

register('guiClosed', (gui) => {
	if (gui.class.getName() !== 'net.minecraft.client.gui.inventory.GuiChest') return;

	const lowerChestField = gui.class.getDeclaredField('field_147015_w');
	lowerChestField.setAccessible(true);
	const lowerChest = lowerChestField.get(gui);

	const inventoryTitleField = net.minecraft.inventory.InventoryBasic.class.getDeclaredField('field_70483_a');
	inventoryTitleField.setAccessible(true);
	const inventoryTitle = inventoryTitleField.get(lowerChest);

	if (inventoryTitle !== 'Edit Actions') return;

	if (button.getText() === 'Error') {
		button.setEnabled(true);
		button.setText('Import');
	}
})

function loadResponse(actionList, actionName, actionAuthor) {
	for (let i = 0; i < actionList.length; i++) {
		let actionType = actionList[i][0];
		let actionData = actionList[i][1];
		let action = new Action(actionType, actionData);
		action.load();
	}
	addOperation(['done', { actionName, actionAuthor }]);
}