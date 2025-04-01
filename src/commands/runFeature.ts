import * as vscode from 'vscode';
import { ConfigurationService } from '../services/configurationService';
import { CommandBuilderService } from '../services/commandBuilderService';
import { FeatureParserService } from '../services/featureParserService';
import { EXTENSION_NAME } from '../constants';

let terminalInstance: vscode.Terminal | undefined;

/**
 * Creates or retrieves a dedicated terminal for Karate TestOps runs.
 * @param outputChannel For logging.
 * @returns The terminal instance.
 */
function getKarateTerminal(outputChannel: vscode.OutputChannel): vscode.Terminal {
    if (!terminalInstance || terminalInstance.exitStatus !== undefined) {
        outputChannel.appendLine('Creating new Karate TestOps terminal.');
        terminalInstance = vscode.window.createTerminal(EXTENSION_NAME);
    } else {
        outputChannel.appendLine('Reusing existing Karate TestOps terminal.');
    }
    return terminalInstance;
}


/**
 * Command handler for running an entire feature file.
 */
export async function runFeatureCommand(
    // context: vscode.ExtensionContext,
    configService: ConfigurationService,
    commandBuilder: CommandBuilderService,
    featureParser: FeatureParserService,
    outputChannel: vscode.OutputChannel,
    uri: vscode.Uri | undefined // Passed when run from Explorer context menu
): Promise<void> {
     outputChannel.appendLine('Command: runFeature triggered.');

     const editor = vscode.window.activeTextEditor;
     let document: vscode.TextDocument | undefined;
     let featureUri: vscode.Uri | undefined = uri; // Use URI from explorer if available

     if (featureUri) {
        outputChannel.appendLine(`Run Feature triggered via URI: ${featureUri.fsPath}`);
        // Need to potentially open the document if not already open to check language ID
        try {
             document = await vscode.workspace.openTextDocument(featureUri);
        } catch (err: any) {
            outputChannel.appendLine(`Error opening document from URI: ${err.message}`);
            vscode.window.showErrorMessage(`Failed to open document: ${featureUri.fsPath}`);
            return;
        }

     } else if (editor) {
        outputChannel.appendLine(`Run Feature triggered via active editor: ${editor.document.uri.fsPath}`);
        document = editor.document;
        featureUri = document.uri;
     } else {
        outputChannel.appendLine('Run Feature called with no active editor or URI.');
        vscode.window.showInformationMessage('Please open a Karate feature file (.feature) first.');
        return;
     }

    if (!featureUri || !document || !featureParser.isFeatureFile(document)) {
        outputChannel.appendLine('Run Feature called on a non-feature file.');
        vscode.window.showWarningMessage('This command only works on Karate feature files (.feature).');
        return;
    }

    const activeEnv = configService.getActiveEnvironment();
    if (!activeEnv) {
        outputChannel.appendLine('No active environment set.');
        vscode.window.showWarningMessage('No active environment set. Please set one in the Karate TestOps view.', 'Set Environment')
            .then(selection => {
                if (selection === 'Set Environment') {
                    // Focus the extension's view
                    vscode.commands.executeCommand('workbench.view.extension.karateTestOpsContainer'); // Use the view container ID from package.json
                }
            });
        return;
    }
    outputChannel.appendLine(`Using active environment: ${activeEnv.name}`);


    const workspaceFolder = commandBuilder.getWorkspaceFolder(featureUri);
    if (!workspaceFolder) {
        // Error message shown by getWorkspaceFolder
        return;
    }

    const command = commandBuilder.buildRunCommand(featureUri.fsPath, activeEnv, undefined); // Undefined scenarioLine means run whole feature

    if (command) {
        const terminal = getKarateTerminal(outputChannel);
        terminal.show(); // Bring the terminal to front
        // Clear previous output? Optional. terminal.sendText('clear'); might not work on all shells
        terminal.sendText(command, true); // True ensures newline is sent, executing the command
        outputChannel.appendLine(`Executing command in terminal: ${command}`);
    } else {
        outputChannel.appendLine('Failed to build run command.');
        vscode.window.showErrorMessage('Could not construct the command to run the feature.');
    }
}