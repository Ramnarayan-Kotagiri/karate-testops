// src/services/commandBuilderService.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { EnvironmentConfig } from '../types'; // Assuming types are defined in ../types
import { DEFAULT_DEBUG_PORT } from '../constants'; // Assuming constants are defined in ../constants

/**
 * Parses a string of CLI arguments (expected to be space-separated pairs like
 * 'key=value', '-Dkey=value' (no space after -D in input), '@tag', '--option [value]')
 * and converts them into a list of correctly formatted Java system properties
 * with a SPACE after -D, like "-D key=value".
 *
 * It expects user input for -D arguments to NOT have a space after -D initially.
 * Note: Complex shell quoting within the input string might not be fully supported.
 */
function parseAndFormatCliArgsWithSpace(cliArgsString: string | undefined, outputChannel: vscode.OutputChannel): string[] {
    const properties: string[] = [];
    if (!cliArgsString) return properties;

    // Regex to split by space, respecting simple single or double quotes
    const args = cliArgsString.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
    const usedIndices = new Set<number>(); // Keep track of consumed args (for values like --threads N)

    for (let i = 0; i < args.length; i++) {
        if (usedIndices.has(i)) {
            continue; // Skip if already consumed as a value for a previous argument
        }

        const arg = args[i];
        let cleanArg = arg; // Argument content without surrounding quotes
        let propertyKey = '';
        let propertyValue = '';

        // Remove outer quotes for processing the argument's structure
        if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
            cleanArg = arg.substring(1, arg.length - 1);
        }

        // --- Determine Key and Value based on input format ---

        // Case 1: Input is "-Dkey=value" (NO space after -D in input)
        if (cleanArg.startsWith('-D')) {
            const assignmentIndex = cleanArg.indexOf('=');
            if (assignmentIndex > 2) { // Check for format -Dkey=value
                 propertyKey = cleanArg.substring(2, assignmentIndex); // Key starts after "-D"
                 propertyValue = cleanArg.substring(assignmentIndex + 1);
            } else if (assignmentIndex === -1 && cleanArg.length > 2) { // Handle boolean flags like -Dflag
                 propertyKey = cleanArg.substring(2);
                 propertyValue = 'true'; // Assume true if no =value
            } else {
                 // Malformed -D argument (e.g., "-D=", "-D")
                 outputChannel.appendLine(`[Arg Parser] Warning: Skipping malformed -D argument '${arg}'. Input format should be -Dkey=value or -Dkey.`);
                 continue; // Skip to next arg
            }
        }
        // Case 2: Input is "key=value"
        else if (cleanArg.includes('=') && !cleanArg.startsWith('-')) {
             const assignmentIndex = cleanArg.indexOf('=');
             if (assignmentIndex > 0) { // Ensure there is a key before '='
                propertyKey = cleanArg.substring(0, assignmentIndex);
                propertyValue = cleanArg.substring(assignmentIndex + 1);
             } else {
                 outputChannel.appendLine(`[Arg Parser] Warning: Skipping malformed key=value argument '${arg}'.`);
                 continue; // Skip to next arg
             }
        }
         // Case 3: Input is "@tag" (Attempt to convert to karate.tags)
         else if (cleanArg.startsWith('@')) {
             propertyKey = 'karate.tags';
             propertyValue = cleanArg; // Value is the tag itself e.g., @smoke
             outputChannel.appendLine(`[Arg Parser] Info: Interpreted '${arg}' as tag, formatting as -D karate.tags=${propertyValue}`);
         }
         // Case 4: Input is "--option [value]" (Attempt to convert)
         else if (cleanArg.startsWith('--')) {
              propertyKey = cleanArg.substring(2); // Key is the part after --
              propertyValue = 'true'; // Default for boolean flags

              // Look ahead for a value if it doesn't contain '='
              if (!cleanArg.includes('=')) {
                 if (i + 1 < args.length && !args[i+1].startsWith('-') && !args[i+1].startsWith('@')) {
                     // Check if next arg looks like a value (doesn't start with - or @)
                     const nextArg = args[i+1];
                     // Use the next argument as value (remove quotes if necessary for the value itself)
                     propertyValue = ((nextArg.startsWith('"') && nextArg.endsWith('"')) || (nextArg.startsWith("'") && nextArg.endsWith("'")))
                                          ? nextArg.substring(1, nextArg.length - 1) : nextArg;
                     usedIndices.add(i + 1); // Mark next arg as consumed
                 }
              } else {
                  // Handle case --option=value
                  const assignmentIndex = cleanArg.indexOf('=');
                   if (assignmentIndex > 2) {
                      propertyKey = cleanArg.substring(2, assignmentIndex);
                      propertyValue = cleanArg.substring(assignmentIndex + 1);
                   } else {
                      outputChannel.appendLine(`[Arg Parser] Warning: Skipping malformed --option=value argument '${arg}'.`);
                      continue;
                   }
              }
              outputChannel.appendLine(`[Arg Parser] Info: Interpreted '${arg}' as option, formatting as -D ${propertyKey}=${propertyValue}`);
         }
        // Ignore other formats
        else {
            outputChannel.appendLine(`[Arg Parser] Warning: Skipping argument '${arg}' as it doesn't match expected formats (-Dkey=value, key=value, @tag, --option [value]).`);
            continue; // Skip to next arg
        }

        // --- Format the output property as "-D key=value" ---
        if (propertyKey) {
            // Escape potential double quotes within the value before adding? Usually not needed for system props unless value itself requires quotes.
            // For simplicity, we add the value as parsed. If it needs quotes, user should include them in input: key="value with space".
            properties.push(`-D ${propertyKey}=${propertyValue}`);
        }
    }

    // Filter out the karate.options property itself, as it's handled separately
    // Important: Match the key name *after* the "-D " prefix
    const filteredProperties = properties.filter(prop => !prop.startsWith('-D karate.options='));
    outputChannel.appendLine(`[Arg Parser] Parsed/Formatted Env Args (with space, excluding karate.options): ${filteredProperties.join(' ')}`);
    return filteredProperties;
}


export class CommandBuilderService {
    private outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
        this.outputChannel.appendLine('CommandBuilderService initialized.');
    }

    /**
     * Builds the command to run a feature or scenario using -D karate.options
     * and formatting other args as -D key=value (with space).
     */
    public buildRunCommand(
        featurePath: string, // Absolute path from VS Code
        activeEnv: EnvironmentConfig | null,
        scenarioLine: number | undefined,
        // workspaceFolder: vscode.WorkspaceFolder
    ): string | null {
        // TODO: Detect build tool dynamically
        // const buildTool = 'mvn'; // Assuming Maven
        const baseCommand = 'mvn test';

        // Use Absolute Path, ensure forward slashes
        const absoluteKaratePath = featurePath.replace(/\\/g, '/');

        // 1. Create the "-D karate.options" property with ONLY path[:line]
        const targetPath = `${absoluteKaratePath}${scenarioLine ? ':' + scenarioLine : ''}`;
        // Escape internal double quotes in the target path itself (unlikely but possible)
        const escapedTargetPath = targetPath.replace(/"/g, '\\"');
        // Add the required space after -D
        const karateOptionsProperty = `-D karate.options="${escapedTargetPath}"`;

        // 2. Parse and Format OTHER arguments from cliArgs into separate "-D key=value" properties
        const otherSystemProperties = parseAndFormatCliArgsWithSpace(activeEnv?.cliArgs, this.outputChannel);

        // 3. Combine base command, karate options property, and other properties
        const commandParts = [
            baseCommand,
            karateOptionsProperty, // Add the specific target
            ...otherSystemProperties // Add all other formatted -D properties
        ];
        const command = commandParts.join(' '); // Join with spaces

        this.outputChannel.appendLine(`Built RUN command: ${command}`);
        return command;
    }

    /**
     * Builds the DebugConfiguration using -D karate.options and formatting
     * other args as -D key=value (with space) in vmArgs.
     */
    public buildDebugConfig(
        featurePath: string, // Absolute path from VS Code
        scenarioLine: number, // Required line number
        environment: EnvironmentConfig | null,
        workspaceFolder: vscode.WorkspaceFolder
    ): vscode.DebugConfiguration | null {

        if (!featurePath || !scenarioLine || !environment || !workspaceFolder) {
             this.outputChannel.appendLine('Error building debug config: Missing required parameters.');
             vscode.window.showErrorMessage("Cannot create debug configuration: Missing required parameters.");
            return null;
        }

        const debugPort = DEFAULT_DEBUG_PORT;
        const suspend = 'y';

        // Use Absolute Path, ensure forward slashes
        const absoluteKaratePath = featurePath.replace(/\\/g, '/');

        // 1. Create the "-D karate.options" property with ONLY path:line
        const targetPath = `${absoluteKaratePath}:${scenarioLine}`;
        const escapedTargetPath = targetPath.replace(/"/g, '\\"');
        // Add the required space after -D
        const karateOptionsProperty = `-D karate.options="${escapedTargetPath}"`;

        // 2. Parse and Format OTHER arguments from cliArgs into separate "-D key=value" properties
        const otherSystemProperties = parseAndFormatCliArgsWithSpace(environment.cliArgs, this.outputChannel);

        // 3. JDWP agent arg (standard format -Dkey=value)
        const baseVmArgs = [
            `-agentlib:jdwp=transport=dt_socket,server=y,suspend=${suspend},address=*:${debugPort}`
        ];

        // 4. Combine all VM arguments for the debug launch
        const finalVmArgs = baseVmArgs
            .concat([karateOptionsProperty]) // Add the specific target option (with space)
            .concat(otherSystemProperties); // Add all other formatted -D properties (with space)

        this.outputChannel.appendLine(`[Debug Build] Final VM Args: ${finalVmArgs.join(' ')}`);

        // 5. Assemble Debug Configuration
        const debugConfig: vscode.DebugConfiguration = {
            type: 'java',
            name: `Debug Karate: ${path.basename(featurePath)}:${scenarioLine}`,
            request: 'launch',
            cwd: workspaceFolder.uri.fsPath, // Run from workspace root (where pom.xml assumed)
            console: "integratedTerminal",
            stopOnEntry: false,
            vmArgs: finalVmArgs, // Pass combined list with "-D key=value" format
            args: [], // Program arguments are empty
            // Add if needed for "main class not found" issues:
            // projectName: path.basename(workspaceFolder.uri.fsPath)
        };

        this.outputChannel.appendLine(`[Debug Build] Built Debug Configuration: ${JSON.stringify(debugConfig, null, 2)}`);
        return debugConfig;
    }


    // getWorkspaceFolder (keep as is)
    public getWorkspaceFolder(resourceUri?: vscode.Uri): vscode.WorkspaceFolder | null {
       if (resourceUri) {
           const workspaceFolder = vscode.workspace.getWorkspaceFolder(resourceUri);
           if (workspaceFolder) { return workspaceFolder; }
       }
       if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
           return vscode.workspace.workspaceFolders[0];
       }
       vscode.window.showErrorMessage('No workspace folder found. Please open a Karate project folder.');
       this.outputChannel.appendLine('Error: No workspace folder found.');
       return null;
    }
}