import * as vscode from 'vscode';
import { ConfigurationService } from '../services/configurationService';
import { CommandBuilderService } from '../services/commandBuilderService';
import { FeatureParserService } from '../services/featureParserService';
import { EXTENSION_NAME } from '../constants';

// Reuse the terminal logic from runFeature
let terminalInstance: vscode.Terminal | undefined;
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
 * Command handler for running a specific scenario under the cursor.
 */
export async function runScenarioCommand(
    // context: vscode.ExtensionContext,
    configService: ConfigurationService,
    commandBuilder: CommandBuilderService,
    featureParser: FeatureParserService,
    outputChannel: vscode.OutputChannel
): Promise<void> {
    outputChannel.appendLine('Command: runScenario triggered.');

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        outputChannel.appendLine('Run Scenario called with no active editor.');
        vscode.window.showInformationMessage('Please open a Karate feature file (.feature) and place the cursor within a scenario.');
        return;
    }

    const document = editor.document;
    if (!featureParser.isFeatureFile(document)) {
         outputChannel.appendLine('Run Scenario called on a non-feature file.');
        vscode.window.showWarningMessage('This command only works on Karate feature files (.feature).');
        return;
    }

    const position = editor.selection.active;
    const scenarioInfo = featureParser.getScenarioNameAndLine(document, position.line);

    if (!scenarioInfo) {
        outputChannel.appendLine(`No scenario found at or above line ${position.line + 1}.`);
        vscode.window.showWarningMessage('Could not find a "Scenario:" or "Scenario Outline:" definition at or above the cursor line.');
        return;
    }
     outputChannel.appendLine(`Identified scenario "${scenarioInfo.name}" at line ${scenarioInfo.line}.`);


    const activeEnv = configService.getActiveEnvironment();
    if (!activeEnv) {
        outputChannel.appendLine('No active environment set.');
        vscode.window.showWarningMessage('No active environment set. Please set one in the Karate TestOps view.', 'Set Environment')
            .then(selection => {
                if (selection === 'Set Environment') {
                    vscode.commands.executeCommand('workbench.view.extension.karateTestOpsContainer');
                }
            });
        return;
    }
    outputChannel.appendLine(`Using active environment: ${activeEnv.name}`);


    const workspaceFolder = commandBuilder.getWorkspaceFolder(document.uri);
     if (!workspaceFolder) {
        // Error message shown by getWorkspaceFolder
        return;
    }


    const command = commandBuilder.buildRunCommand(document.uri.fsPath, activeEnv, scenarioInfo.line, workspaceFolder);

    if (command) {
        const terminal = getKarateTerminal(outputChannel);
        terminal.show();
        terminal.sendText(command, true);
         outputChannel.appendLine(`Executing command in terminal: ${command}`);
    } else {
        outputChannel.appendLine('Failed to build run command for scenario.');
        vscode.window.showErrorMessage('Could not construct the command to run the scenario.');
    }
}