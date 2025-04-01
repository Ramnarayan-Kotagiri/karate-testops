import * as vscode from 'vscode';
import { KARATE_LANG_ID, GHERKIN_LANG_ID} from '../constants';

/**
 * Provides utility functions for parsing information from .feature files.
 */
export class FeatureParserService {

private outputChannel: vscode.OutputChannel;

constructor(outputChannel: vscode.OutputChannel) {
 this.outputChannel = outputChannel;
 this.outputChannel.appendLine('FeatureParserService initialized.');
 }


/**
     * Checks if the document is a Karate/Gherkin feature file.
     * @param document The text document.
     * @returns True if it's a feature file, false otherwise.
     */
 public isFeatureFile(document: vscode.TextDocument | undefined): boolean {
return !!document && (document.languageId === KARATE_LANG_ID || document.languageId === GHERKIN_LANG_ID);
 }

/**
     * Finds the nearest Scenario or Scenario Outline definition above a given line.
     * @param document The text document.
     * @param lineNumber The line number to start searching upwards from (0-based).
     * @returns An object containing the scenario name and its starting line number, or null if not found.
     */
 public getScenarioNameAndLine(document: vscode.TextDocument, lineNumber: number): { name: string; line: number } | null {
        this.outputChannel.appendLine(`Searching for scenario starting from line ${lineNumber + 1} in ${document.uri.fsPath}`);
        const scenarioRegex = /^\s*(@\S+\s*)*\s*(Scenario(?: Outline)?):\s*(.*)$/i; // Case-insensitive match

        for (let i = lineNumber; i >= 0; i--) {
            const lineText = document.lineAt(i).text;
            const match = lineText.match(scenarioRegex);
            if (match) {
                const scenarioName = match[3]?.trim() || `Unnamed Scenario (Line ${i + 1})`; // Capture group 3 is the name
                const scenarioLine = i + 1; // Convert 0-based index to 1-based line number
                this.outputChannel.appendLine(`Found scenario: "${scenarioName}" at line ${scenarioLine}`);
                return { name: scenarioName, line: scenarioLine };
            }
        }

        this.outputChannel.appendLine(`No scenario definition found above line ${lineNumber + 1}`);
        return null;
    }
}