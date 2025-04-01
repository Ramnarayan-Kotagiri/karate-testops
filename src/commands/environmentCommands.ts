import * as vscode from 'vscode';
import { ConfigurationService } from '../services/configurationService';
import { EnvironmentViewProvider, EnvironmentTreeItem } from '../providers/environmentViewProvider';
import { EnvironmentConfig } from '../types';

/**
 * Contains command handlers related to managing environments.
 */
export class EnvironmentCommands {
    constructor(
        // private context: vscode.ExtensionContext,
        private configService: ConfigurationService,
        private environmentViewProvider: EnvironmentViewProvider,
        private outputChannel: vscode.OutputChannel
    ) { }

    /** Command: Add Environment */
    public async addEnvironment(): Promise<void> {
        this.outputChannel.appendLine('Command: addEnvironment triggered.');
        const name = await vscode.window.showInputBox({
            prompt: 'Enter a unique name for the new environment (e.g., DEV, QA)',
            placeHolder: 'Environment Name',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Environment name cannot be empty.';
                }
                if (this.configService.getEnvironments().some(env => env.name.toLowerCase() === value.trim().toLowerCase())) {
                    return `Environment '${value.trim()}' already exists.`;
                }
                return null; // Input is valid
            },
        });

        if (name) {
            const trimmedName = name.trim();
            const success = await this.configService.addEnvironment(trimmedName);
            if (success) {
                vscode.window.showInformationMessage(`Environment '${trimmedName}' added.`);
                 // Prompt to edit args immediately after adding
                const editAction = await vscode.window.showInformationMessage(
                    `Environment '${trimmedName}' added. Do you want to set its CLI arguments now?`,
                    'Yes', 'No'
                );
                if (editAction === 'Yes') {
                     // Find the newly added item to pass to edit command
                     const newItem = this.configService.getEnvironments().find(e => e.name === trimmedName);
                     if (newItem) {
                        // Need to wrap in a tree item for the command handler expectation
                        await this.editEnvironment(new EnvironmentTreeItem(newItem, false));
                     }
                } else {
                    this.environmentViewProvider.refresh(); // Refresh even if not editing args
                }
            }
            // Error message handled by configService
        } else {
             this.outputChannel.appendLine('Add environment cancelled by user.');
        }
    }

    /** Command: Edit Environment */
    public async editEnvironment(item: EnvironmentTreeItem | undefined): Promise<void> {
        this.outputChannel.appendLine('Command: editEnvironment triggered.');
        if (!item) {
            // Should be triggered from context menu, so item should exist
            this.outputChannel.appendLine('Edit Environment called without a target item.');
            vscode.window.showErrorMessage('Cannot edit: No environment selected.');
            return;
        }

        const oldConfig = item.config;

         // 1. Prompt for potentially new name
        const newName = await vscode.window.showInputBox({
            prompt: `Enter the new name for '${oldConfig.name}' (or leave unchanged)`,
            value: oldConfig.name,
            validateInput: (value) => {
                 if (!value || value.trim().length === 0) {
                    return 'Environment name cannot be empty.';
                }
                const trimmedValue = value.trim();
                 // Check for conflict only if the name has changed
                if (trimmedValue.toLowerCase() !== oldConfig.name.toLowerCase() &&
                    this.configService.getEnvironments().some(env => env.name.toLowerCase() === trimmedValue.toLowerCase())) {
                    return `Another environment named '${trimmedValue}' already exists.`;
                }
                return null;
            }
        });

         if (!newName) {
            this.outputChannel.appendLine('Edit environment name cancelled.');
            return; // User cancelled name edit
        }
        const trimmedNewName = newName.trim();


        // 2. Prompt for CLI arguments
        const cliArgs = await vscode.window.showInputBox({
            prompt: `Enter CLI arguments for environment '${trimmedNewName}'`,
            placeHolder: 'e.g., karate.env=dev -Dmyprop=val --tags @smoke',
            value: oldConfig.cliArgs || '', // Pre-fill with existing args
        });

        if (cliArgs === undefined) { // Check for undefined (Escape key) vs empty string
            this.outputChannel.appendLine('Edit environment args cancelled.');
            return; // User cancelled args edit
        }

        const newConfig: EnvironmentConfig = {
            name: trimmedNewName,
            cliArgs: cliArgs.trim(),
        };

        const success = await this.configService.updateEnvironment(oldConfig.name, newConfig);
        if (success) {
            vscode.window.showInformationMessage(`Environment '${newConfig.name}' updated.`);
            this.environmentViewProvider.refresh();
        }
        // Error message handled by configService
    }

    /** Command: Delete Environment */
    public async deleteEnvironment(item: EnvironmentTreeItem | undefined): Promise<void> {
         this.outputChannel.appendLine('Command: deleteEnvironment triggered.');
        if (!item) {
             this.outputChannel.appendLine('Delete Environment called without a target item.');
            vscode.window.showErrorMessage('Cannot delete: No environment selected.');
            return;
        }

        const confirm = await vscode.window.showWarningMessage(
            `Are you sure you want to delete the environment '${item.config.name}'?`,
            { modal: true }, // Make it blocking
            'Delete'
        );

        if (confirm === 'Delete') {
            const success = await this.configService.deleteEnvironment(item.config.name);
            if (success) {
                vscode.window.showInformationMessage(`Environment '${item.config.name}' deleted.`);
                this.environmentViewProvider.refresh();
            }
            // Warning message handled by configService if not found
        } else {
             this.outputChannel.appendLine('Delete environment cancelled by user.');
        }
    }

    /** Command: Set Active Environment */
    public async setActiveEnvironment(item: EnvironmentTreeItem | undefined): Promise<void> {
        this.outputChannel.appendLine('Command: setActiveEnvironment triggered.');
        if (!item) {
             this.outputChannel.appendLine('Set Active Environment called without a target item.');
            vscode.window.showErrorMessage('Cannot set active: No environment selected.');
            return;
        }

        const success = await this.configService.setActiveEnvironment(item.config.name);
        if (success) {
            // No user message needed, the view update provides feedback
            this.environmentViewProvider.refresh();
        }
         // Error message handled by configService
    }

    /** Command: Unset Active Environment (called when active item is clicked) */
    public async unsetActiveEnvironment(item: EnvironmentTreeItem | undefined): Promise<void> {
        this.outputChannel.appendLine('Command: unsetActiveEnvironment triggered.');
         if (!item || !item.isActive) {
             this.outputChannel.appendLine('Unset Active Environment called on a non-active or missing item.');
             // Don't show error, just ensure state is consistent
            // return;
        }

        const success = await this.configService.setActiveEnvironment(null); // Set active to null
        if (success) {
            this.environmentViewProvider.refresh();
        }
         // Error message handled by configService (though unlikely here)
    }


    /** Command: Refresh Environments */
    public refreshEnvironments(): void {
        this.outputChannel.appendLine('Command: refreshEnvironments triggered.');
        this.environmentViewProvider.refresh();
    }
}