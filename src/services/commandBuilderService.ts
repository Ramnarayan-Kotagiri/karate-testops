import * as vscode from 'vscode';
import * as path from 'path';
import { EnvironmentConfig } from '../types';
import { DEFAULT_DEBUG_PORT } from '../constants';

/**
 * Builds the actual command strings to execute Karate tests.
 * Currently assumes a Maven project structure.
 */
export class CommandBuilderService {
    private outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
        this.outputChannel.appendLine('CommandBuilderService initialized.');
    }

    /**
     * Builds the command to run a feature or scenario.
     * @param featurePath Absolute path to the .feature file.
     * @param activeEnv The active environment configuration. Can be null.
     * @param scenarioLine Optional line number for a specific scenario.
     * @param workspaceFolder The workspace folder containing the project.
     * @returns The command string to execute in the terminal.
     */
    public buildRunCommand(
        featurePath: string,
        activeEnv: EnvironmentConfig | null,
        scenarioLine: number | undefined,
        workspaceFolder: vscode.WorkspaceFolder
    ): string | null {
        // TODO: Detect build tool (Maven/Gradle/Standalone)
        const buildTool = 'mvn'; // Hardcoded assumption for now
        const baseCommand = buildTool === 'mvn' ? 'mvn test' : 'gradle test'; // Adapt for Gradle later

        // Make feature path relative to workspace root for cleaner commands
        const relativeFeaturePath = path.relative(workspaceFolder.uri.fsPath, featurePath).replace(/\\/g, '/'); // Use forward slashes

        let karateOptions = `"${relativeFeaturePath}${scenarioLine ? ':' + scenarioLine : ''}"`;

        if (activeEnv?.cliArgs) {
            karateOptions += ` ${activeEnv.cliArgs.trim()}`;
        }

        // Ensure quotes handle potential spaces in paths or args within karate.options
        const command = `${baseCommand} -D karate.options=${karateOptions}`;

        this.outputChannel.appendLine(`Built RUN command: ${command}`);
        return command;
    }

    /**
     * Prepares arguments needed for a VS Code Java debug session.
     * It does NOT build the full Java command, but provides the necessary
     * pieces for the dynamic debug configuration.
     * @param featurePath Absolute path to the .feature file.
     * @param activeEnv The active environment configuration. Can be null.
     * @param scenarioLine Line number for the specific scenario.
     * @param workspaceFolder The workspace folder containing the project.
     * @returns An object containing vmArgs and karateOptions for debugging, or null on error.
     */
    public prepareDebugArgs(
        featurePath: string,
        activeEnv: EnvironmentConfig | null,
        scenarioLine: number,
        workspaceFolder: vscode.WorkspaceFolder
    ): { vmArgs: string; karateOptions: string; debugPort: number; } | null {

        const debugPort = DEFAULT_DEBUG_PORT; // Could make this configurable later

        const relativeFeaturePath = path.relative(workspaceFolder.uri.fsPath, featurePath).replace(/\\/g, '/'); // Use forward slashes

        // Combine feature path, line number, and environment args for karate.options
        let karateOptions = `"${relativeFeaturePath}:${scenarioLine}"`;
        if (activeEnv?.cliArgs) {
            karateOptions += ` ${activeEnv.cliArgs.trim()}`;
        }

        // Standard JDWP arguments
        // Using '*' for address might be needed in some containerized environments,
        // localhost or 127.0.0.1 are often safer defaults if not needed.
        const vmArgs = `-agentlib:jdwp=transport=dt_socket,server=y,suspend=y,address=*:${debugPort}`;

        this.outputChannel.appendLine(`Prepared DEBUG args: vmArgs='${vmArgs}', karate.options='${karateOptions}', port=${debugPort}`);

        return { vmArgs, karateOptions, debugPort };
    }

     /**
     * Gets the root workspace folder, prioritizing the folder containing the feature file.
     * @param resourceUri URI of the file triggering the command (e.g., a .feature file).
     * @returns The workspace folder or null if none found.
     */
     public getWorkspaceFolder(resourceUri?: vscode.Uri): vscode.WorkspaceFolder | null {
        if (resourceUri) {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(resourceUri);
            if (workspaceFolder) {
                return workspaceFolder;
            }
        }
        // Fallback to the first workspace folder if the resource isn't in one or no resource provided
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            return vscode.workspace.workspaceFolders[0];
        }
        vscode.window.showErrorMessage('No workspace folder found. Please open a Karate project folder.');
        this.outputChannel.appendLine('Error: No workspace folder found.');
        return null;
    }
}