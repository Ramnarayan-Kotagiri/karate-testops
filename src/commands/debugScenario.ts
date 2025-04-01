import * as vscode from 'vscode';
import { ConfigurationService } from '../services/configurationService';
import { CommandBuilderService } from '../services/commandBuilderService';
import { FeatureParserService } from '../services/featureParserService';
import { EXTENSION_NAME } from '../constants';

/**
 * Command handler for debugging a specific scenario under the cursor.
 */
export async function debugScenarioCommand(
    // context: vscode.ExtensionContext,
    configService: ConfigurationService,
    commandBuilder: CommandBuilderService,
    featureParser: FeatureParserService,
    outputChannel: vscode.OutputChannel
): Promise<void> {
    outputChannel.appendLine('Command: debugScenario triggered.');

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        outputChannel.appendLine('Debug Scenario called with no active editor.');
        vscode.window.showInformationMessage('Please open a Karate feature file (.feature) and place the cursor within the scenario to debug.');
        return;
    }

    const document = editor.document;
    if (!featureParser.isFeatureFile(document)) {
        outputChannel.appendLine('Debug Scenario called on a non-feature file.');
        vscode.window.showWarningMessage('Debugging only works on Karate feature files (.feature).');
        return;
    }

     // Check if Java Debugger extension is installed
     const javaDebugExtension = vscode.extensions.getExtension('vscjava.vscode-java-debug');
     if (!javaDebugExtension) {
         outputChannel.appendLine('Java Debugger extension not found.');
         vscode.window.showErrorMessage(
            'The "Debugger for Java" extension is required for debugging. Please install it from the Marketplace.',
            'Install Java Debugger'
        ).then(action => {
            if (action === 'Install Java Debugger') {
                vscode.commands.executeCommand('workbench.extensions.installExtension', 'vscjava.vscode-java-debug');
            }
        });
         return;
     }
      if (!javaDebugExtension.isActive) {
          outputChannel.appendLine('Java Debugger extension found but not active. Attempting to activate.');
          // Attempt to activate it - VS Code might do this automatically when starting a 'java' debug session anyway
         await javaDebugExtension.activate();
         outputChannel.appendLine(`Java Debugger active status: ${javaDebugExtension.isActive}`);
         // Don't block if activation is slow/fails, let startDebugging try
      }


    const position = editor.selection.active;
    const scenarioInfo = featureParser.getScenarioNameAndLine(document, position.line);

    if (!scenarioInfo) {
        outputChannel.appendLine(`No scenario found at or above line ${position.line + 1}.`);
        vscode.window.showWarningMessage('Could not find a "Scenario:" or "Scenario Outline:" definition at or above the cursor line to debug.');
        return;
    }
    outputChannel.appendLine(`Identified scenario "${scenarioInfo.name}" at line ${scenarioInfo.line} for debugging.`);


    const activeEnv = configService.getActiveEnvironment();
    if (!activeEnv) {
         outputChannel.appendLine('No active environment set for debugging.');
        vscode.window.showWarningMessage('No active environment set. Debugging requires an active environment configuration.', 'Set Environment')
            .then(selection => {
                if (selection === 'Set Environment') {
                    vscode.commands.executeCommand('workbench.view.extension.karateTestOpsContainer');
                }
            });
        return;
    }
     outputChannel.appendLine(`Using active environment for debug: ${activeEnv.name}`);

    const workspaceFolder = commandBuilder.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) {
       // Error message shown by getWorkspaceFolder
       return;
   }

    const debugArgs = commandBuilder.prepareDebugArgs(document.uri.fsPath, activeEnv, scenarioInfo.line, workspaceFolder);

    if (!debugArgs) {
        outputChannel.appendLine('Failed to prepare debug arguments.');
        vscode.window.showErrorMessage('Could not construct the arguments required for debugging.');
        return;
    }

    // Construct the dynamic debug configuration for vscode.debug.startDebugging
    // This relies HEAVILY on the vscjava.vscode-java-debug extension interpreting it.
    // We assume a Maven project structure recognized by the Java extension.
    // For Gradle or standalone JARs, this config would need significant changes.
    const debugConfiguration: vscode.DebugConfiguration = {
        type: 'java', // Must match the Java Debugger extension type
        name: `Debug Karate: ${scenarioInfo.name}`, // Dynamic name shown in Debug view
        request: 'launch', // Ask the Java debugger to launch the process
        // mainClass: '', // Often not needed if Java ext recognizes Maven/Gradle project
        // projectName: workspaceFolder.name, // Java ext usually infers this
        cwd: workspaceFolder.uri.fsPath, // Run from the workspace root
        vmArgs: [debugArgs.vmArgs], // Pass the JDWP agent string
        args: `-D karate.options=${debugArgs.karateOptions}`, // Pass Karate options via system property - Java ext should pick this up for mvn/gradle test task
        // --- Specific Maven/Gradle options (might be needed if 'args' isn't enough) ---
        // maven: { // Example structure if targeting maven directly
        //     command: 'test',
        //     args: `-Dkarate.options=${debugArgs.karateOptions}`
        // },
        // gradle: { // Example structure if targeting gradle directly
        //     tasks: ['test'],
        //     args: [`-Dkarate.options=${debugArgs.karateOptions}`]
        // },
        // --- Stop on entry? ---
        stopOnEntry: false, // Don't stop immediately, wait for breakpoints
        // --- Console ---
        console: 'integratedTerminal', // Show output in the VS Code Debug Console
        port: debugArgs.debugPort, // Inform debugger which port to connect to (though vmArgs already has it)
    };

     outputChannel.appendLine(`Starting debug session with config: ${JSON.stringify(debugConfiguration)}`);

    try {
        const success = await vscode.debug.startDebugging(workspaceFolder, debugConfiguration);
        if (success) {
            outputChannel.appendLine('Debug session started successfully.');
            // Optionally show the debug console: vscode.commands.executeCommand('workbench.debug.action.focusRepl');
        } else {
             outputChannel.appendLine('vscode.debug.startDebugging returned false. Session might not have started.');
            // Check for common issues (port conflict, java extension problems)
            vscode.window.showErrorMessage(`Failed to start debug session. Check the Debug Console and ${EXTENSION_NAME} logs for details. Ensure port ${debugArgs.debugPort} is free.`, 'Show Logs').then(action => {
                if (action === 'Show Logs') {
                     outputChannel.show();
                }
            });
        }
    } catch (error: any) {
        outputChannel.appendLine(`Error starting debug session: ${error.message}`);
        vscode.window.showErrorMessage(`Error starting debug session: ${error.message}. See logs for more details.`, 'Show Logs').then(action => {
             if (action === 'Show Logs') {
                 outputChannel.show();
            }
        });
    }
}