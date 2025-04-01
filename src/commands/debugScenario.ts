// src/commands/debugScenario.ts

import * as vscode from 'vscode';
// import * as path from 'path'; // Ensure path is imported
import { ConfigurationService } from '../services/configurationService';
import { CommandBuilderService } from '../services/commandBuilderService';
import { FeatureParserService } from '../services/featureParserService';
import { EXTENSION_NAME } from '../constants'; // Assuming DEFAULT_DEBUG_PORT is used inside commandBuilder

// Helper function - check if needed or move to utils
// async function fileExists(uri: vscode.Uri): Promise<boolean> {
//     try {
//         await vscode.workspace.fs.stat(uri);
//         return true;
//     } catch {
//         return false;
//     }
// }

/**
 * Command handler for debugging a specific scenario under the cursor.
 */
export async function debugScenarioCommand(
    // context: vscode.ExtensionContext, // context might not be needed directly here unless adding to subscriptions
    configService: ConfigurationService,
    commandBuilder: CommandBuilderService,
    featureParser: FeatureParserService,
    outputChannel: vscode.OutputChannel): Promise<void> {
    outputChannel.appendLine('Command: debugScenario triggered.');

    // 1. Get Active Editor and Document
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        outputChannel.appendLine('Debug Scenario aborted: No active editor.');
        vscode.window.showInformationMessage('Please open a Karate feature file (.feature) and place the cursor within the scenario to debug.');
        return;
    }
    const document = editor.document;

    // 2. Check if it's a Feature File
    if (!featureParser.isFeatureFile(document)) {
        outputChannel.appendLine('Debug Scenario aborted: Active file is not a .feature file.');
        vscode.window.showWarningMessage('Debugging only works on Karate feature files (.feature).');
        return;
    }

    // 3. Check if Java Debugger Extension is Installed/Active
    const javaDebugExtension = vscode.extensions.getExtension('vscjava.vscode-java-debug');
    if (!javaDebugExtension) {
        outputChannel.appendLine('Debug Scenario aborted: Java Debugger extension not found.');
        vscode.window.showErrorMessage(
           'The "Debugger for Java" extension is required for debugging. Please install it.',
           'Install Extension'
       ).then(action => {
           if (action === 'Install Extension') {
               vscode.commands.executeCommand('workbench.extensions.installExtension', 'vscjava.vscode-java-debug');
           }
       });
        return;
    }
    // Attempt to activate if not already active (VS Code might do this anyway)
     if (!javaDebugExtension.isActive) {
         outputChannel.appendLine('Java Debugger extension found but not active. Attempting to activate...');
         try {
            await javaDebugExtension.activate();
            outputChannel.appendLine(`Java Debugger active status after activation attempt: ${javaDebugExtension.isActive}`);
         } catch (activationError: any) {
            outputChannel.appendLine(`Warning: Error activating Java Debugger: ${activationError.message}. Debugging might still work.`);
         }
     }

    // 4. Find Scenario Line Number
    const position = editor.selection.active;
    const scenarioInfo = featureParser.getScenarioNameAndLine(document, position.line); // Use the correct function
    if (!scenarioInfo) {
        outputChannel.appendLine(`Debug Scenario aborted: No scenario found at or above line ${position.line + 1}.`);
        vscode.window.showWarningMessage('Could not find a "Scenario:" or "Scenario Outline:" definition at or above the cursor line to debug.');
        return;
    }
    outputChannel.appendLine(`Identified scenario "${scenarioInfo.name}" at line ${scenarioInfo.line} for debugging.`);

    // 5. Get Active Environment
    const activeEnv = configService.getActiveEnvironment();
    if (!activeEnv) {
        outputChannel.appendLine('Debug Scenario aborted: No active environment set.');
       vscode.window.showWarningMessage('No active environment set. Debugging requires an active environment configuration.', 'Set Environment')
           .then(selection => {
               if (selection === 'Set Environment') {
                   // Focus the extension's view container
                   vscode.commands.executeCommand('workbench.view.extension.karateTestOpsContainer'); // Adjust if your view container ID is different
               }
           });
        return;
    }
    outputChannel.appendLine(`Using active environment for debug: ${activeEnv.name}`);

    // 6. Get Workspace Folder
    const workspaceFolder = commandBuilder.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) {
        // Error message already shown by getWorkspaceFolder
       return;
   }

    // 7. Build the Debug Configuration using the Service
    // Pass the correct arguments, including the scenario line number
    const debugConfiguration = commandBuilder.buildDebugConfig(
        document.uri.fsPath,
        scenarioInfo.line, // Pass the line number
        activeEnv,
        workspaceFolder
    );

    if (!debugConfiguration) {
        outputChannel.appendLine('Debug Scenario aborted: Failed to build debug configuration.');
        vscode.window.showErrorMessage('Could not construct the debug configuration required for this scenario.');
        return;
    }

    // Optional: Add projectName if the "main class" error persists
    // debugConfiguration.projectName = path.basename(workspaceFolder.uri.fsPath);
    // outputChannel.appendLine(`Added projectName: ${debugConfiguration.projectName}`);


    outputChannel.appendLine(`Attempting to start debug session with config: ${JSON.stringify(debugConfiguration)}`);

    // 8. Start Debugging
    try {
        const success = await vscode.debug.startDebugging(workspaceFolder, debugConfiguration);

        if (success) {
            outputChannel.appendLine('Debug session initiated successfully. Check the Debug Console for output.');
            // Optionally focus the debug console
            // vscode.commands.executeCommand('workbench.debug.action.focusRepl');
        } else {
             // This often indicates an issue with the configuration BEFORE the process even launches properly
             outputChannel.appendLine('Error: vscode.debug.startDebugging returned false. Session failed to start.');
             vscode.window.showErrorMessage(
                 `Failed to start debug session. Check configuration & prerequisites. See Debug Console and ${EXTENSION_NAME} logs for details.`,
                 'Show Logs'
            ).then(action => {
                if (action === 'Show Logs') { outputChannel.show(true); } // Preserve focus
            });
        }
    } catch (error: any) {
        // This usually catches errors during the launch process itself
        outputChannel.appendLine(`Error caught during vscode.debug.startDebugging: ${error.message}`);
        vscode.window.showErrorMessage(
            `Error starting debug session: ${error.message}. Check Debug Console and logs.`,
            'Show Logs'
        ).then(action => {
             if (action === 'Show Logs') { outputChannel.show(true); } // Preserve focus
        });
    }
}