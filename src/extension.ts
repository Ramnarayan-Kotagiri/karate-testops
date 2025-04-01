import * as vscode from 'vscode';
import { ConfigurationService } from './services/configurationService';
import { FeatureParserService } from './services/featureParserService';
import { CommandBuilderService } from './services/commandBuilderService';
import { EnvironmentViewProvider } from './providers/environmentViewProvider';
import { EnvironmentCommands } from './commands/environmentCommands';
import { runFeatureCommand } from './commands/runFeature';
import { runScenarioCommand } from './commands/runScenario';
import { debugScenarioCommand } from './commands/debugScenario';
import * as Constants from './constants';

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {

    // Create output channel for logging
    outputChannel = vscode.window.createOutputChannel(Constants.OUTPUT_CHANNEL_NAME);
    outputChannel.appendLine(`Activating ${Constants.EXTENSION_NAME} extension...`);
    console.log(`Activating ${Constants.EXTENSION_NAME}...`); // Also log to console for dev

    // --- Initialize Services ---
    const configService = new ConfigurationService(context, outputChannel);
    const featureParserService = new FeatureParserService(outputChannel);
    const commandBuilderService = new CommandBuilderService(outputChannel);

    // --- Initialize Environment View ---
    const environmentViewProvider = new EnvironmentViewProvider(configService, outputChannel);
    const envTreeView = vscode.window.createTreeView(Constants.VIEW_ENVIRONMENTS, {
        treeDataProvider: environmentViewProvider,
        showCollapseAll: false, // Flat list doesn't need collapse
        canSelectMany: false
    });
    context.subscriptions.push(envTreeView);

    // --- Initialize Command Handlers ---
    const envCommands = new EnvironmentCommands(configService, environmentViewProvider, outputChannel);

    // --- Register Commands (ensure IDs match package.json) ---
    context.subscriptions.push(
        vscode.commands.registerCommand(Constants.CMD_REFRESH_ENVS, () => envCommands.refreshEnvironments()),
        vscode.commands.registerCommand(Constants.CMD_ADD_ENV, () => envCommands.addEnvironment()),
        // Edit/Delete/Set/Unset commands expect a TreeItem argument from the view context menu
        vscode.commands.registerCommand(Constants.CMD_EDIT_ENV, (item) => envCommands.editEnvironment(item)),
        vscode.commands.registerCommand(Constants.CMD_DELETE_ENV, (item) => envCommands.deleteEnvironment(item)),
        vscode.commands.registerCommand(Constants.CMD_SET_ACTIVE_ENV, (item) => envCommands.setActiveEnvironment(item)),
        vscode.commands.registerCommand(Constants.CMD_UNSET_ACTIVE_ENV, (item) => envCommands.unsetActiveEnvironment(item)),

        // Feature/Scenario commands
        vscode.commands.registerCommand(Constants.CMD_RUN_FEATURE, (uri) => runFeatureCommand(configService, commandBuilderService, featureParserService, outputChannel, uri)),
        vscode.commands.registerCommand(Constants.CMD_RUN_SCENARIO, () => runScenarioCommand(configService, commandBuilderService, featureParserService, outputChannel)),
        vscode.commands.registerCommand(Constants.CMD_DEBUG_SCENARIO, () => debugScenarioCommand(configService, commandBuilderService, featureParserService, outputChannel))
    );

     // Refresh view on activation and when configuration changes (e.g., manually editing workspace state)
     // Note: Direct workspaceState changes aren't easily watched, rely on commands/refresh button.
     environmentViewProvider.refresh();


    outputChannel.appendLine(`${Constants.EXTENSION_NAME} activation complete.`);
}

// This method is called when your extension is deactivated
export function deactivate() {
    if (outputChannel) {
        outputChannel.appendLine(`Deactivating ${Constants.EXTENSION_NAME}...`);
        outputChannel.dispose();
    }
    console.log(`${Constants.EXTENSION_NAME} deactivated.`);
}