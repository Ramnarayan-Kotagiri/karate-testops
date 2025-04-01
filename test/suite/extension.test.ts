import * as assert from 'assert';
import * as vscode from 'vscode';
import { EXTENSION_ID, CMD_ADD_ENV } from '../../src/constants'; // Adjust path as necessary

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be present and activate', async () => {
        const extension = vscode.extensions.getExtension(EXTENSION_ID); // Use the actual ID from package.json / constants
        assert.ok(extension, 'Extension not found');

        await extension.activate();
        assert.ok(extension.isActive, 'Extension failed to activate');
	});

    test('Should register add environment command', async () => {
        // Get the list of all available commands
        const commands = await vscode.commands.getCommands(true); // true includes internal commands

        // Check if our command is in the list
        assert.ok(commands.includes(CMD_ADD_ENV), `Command ${CMD_ADD_ENV} not registered`);
    });

    // Add more tests here:
    // - Test if the view is created
    // - Test command execution (might need mocking or a test workspace)
    // - Test configuration saving/loading (might need access to ExtensionContext mock)

});