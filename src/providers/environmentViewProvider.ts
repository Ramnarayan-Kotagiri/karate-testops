import * as vscode from 'vscode';
import { ConfigurationService } from '../services/configurationService';
import { EnvironmentConfig } from '../types';
import { CONTEXT_ENVIRONMENT_ITEM } from '../constants';

/**
 * Tree item representing a single environment in the sidebar view.
 */
export class EnvironmentTreeItem extends vscode.TreeItem {
    constructor(
        public readonly config: EnvironmentConfig,
        public readonly isActive: boolean,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
    ) {
        super(config.name, collapsibleState);
        this.tooltip = `Args: ${config.cliArgs || '<Not Set>'}`;
        this.description = isActive ? 'Active' : ''; // Show 'Active' label next to the name
        this.contextValue = `${CONTEXT_ENVIRONMENT_ITEM}${isActive ? 'Active' : ''}`; // e.g., karateTestOpsEnvironment or karateTestOpsEnvironmentActive
        // Optionally, use icons to indicate active state
        this.iconPath = isActive
            ? new vscode.ThemeIcon('check') // Use a built-in 'check' icon for active
            : new vscode.ThemeIcon('gear'); // Use a 'gear' icon for inactive
    }
}

/**
 * Provides the data for the Environments tree view in the sidebar.
 */
export class EnvironmentViewProvider implements vscode.TreeDataProvider<EnvironmentTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<EnvironmentTreeItem | undefined | null | void> = new vscode.EventEmitter<EnvironmentTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<EnvironmentTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(
        // private context: vscode.ExtensionContext,
        private configurationService: ConfigurationService,
        private outputChannel: vscode.OutputChannel
    ) {
         this.outputChannel.appendLine('EnvironmentViewProvider initialized.');
    }

    /**
     * Refreshes the entire tree view.
     */
    refresh(): void {
        this.outputChannel.appendLine('Refreshing environments view.');
        this._onDidChangeTreeData.fire();
    }

    /**
     * Gets the tree item representation for a given element.
     * @param element The environment tree item.
     * @returns The tree item itself.
     */
    getTreeItem(element: EnvironmentTreeItem): vscode.TreeItem {
        return element;
    }

    /**
     * Gets the children of a given element or the root elements if no element is provided.
     * @param element The parent element (unused in this flat list).
     * @returns A list of environment tree items.
     */
    getChildren(element?: EnvironmentTreeItem): Thenable<EnvironmentTreeItem[]> {
        if (element) {
            // Environments are always top-level in our view
            return Promise.resolve([]);
        } else {
            // Get root elements (all environments)
            const environments = this.configurationService.getEnvironments();
            const activeEnvName = this.configurationService.getActiveEnvironmentName();
            this.outputChannel.appendLine(`Loading ${environments.length} environments for view. Active: ${activeEnvName ?? 'None'}`);

            const treeItems = environments.map(env =>
                new EnvironmentTreeItem(env, env.name === activeEnvName)
            );
            return Promise.resolve(treeItems);
        }
    }
}