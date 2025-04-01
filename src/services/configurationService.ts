import * as vscode from 'vscode';
import { EnvironmentConfig, AllEnvironmentsConfig } from '../types';
import { CONFIG_KEY_ENVIRONMENTS } from '../constants';

/**
 * Manages loading, saving, and accessing environment configurations
 * stored in the workspace state.
 */
export class ConfigurationService {
    private context: vscode.ExtensionContext;
    private outputChannel: vscode.OutputChannel;

    constructor(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
        this.context = context;
        this.outputChannel = outputChannel;
        this.outputChannel.appendLine('ConfigurationService initialized.');
    }

    /**
     * Retrieves all environment configurations and the active environment name.
     * @returns The configuration object or a default empty state.
     */
    public getAllConfig(): AllEnvironmentsConfig {
        try {
            const config = this.context.workspaceState.get<AllEnvironmentsConfig>(
                CONFIG_KEY_ENVIRONMENTS,
                { environments: [], activeEnvironmentName: null } // Default value
            );
             // Ensure environments array exists
             if (!config.environments) {
                config.environments = [];
            }
            return config;
        } catch (error: any) {
            this.outputChannel.appendLine(`Error getting all config: ${error.message}`);
            vscode.window.showErrorMessage(`Failed to load environments: ${error.message}`);
            return { environments: [], activeEnvironmentName: null };
        }
    }

    /**
     * Saves the entire environment configuration object.
     * @param config The configuration object to save.
     */
    private async saveAllConfig(config: AllEnvironmentsConfig): Promise<void> {
        try {
            // Ensure environments is always an array before saving
             config.environments = config.environments || [];
            await this.context.workspaceState.update(CONFIG_KEY_ENVIRONMENTS, config);
            this.outputChannel.appendLine(`Saved ${config.environments.length} environments. Active: ${config.activeEnvironmentName ?? 'None'}`);
        } catch (error: any) {
             this.outputChannel.appendLine(`Error saving all config: ${error.message}`);
            vscode.window.showErrorMessage(`Failed to save environments: ${error.message}`);
        }
    }

    /**
     * Gets all defined environments.
     * @returns An array of environment configurations.
     */
    public getEnvironments(): EnvironmentConfig[] {
        return this.getAllConfig().environments;
    }

     /**
     * Gets the name of the currently active environment.
     * @returns The name or null if no environment is active.
     */
     public getActiveEnvironmentName(): string | null {
        return this.getAllConfig().activeEnvironmentName ?? null;
    }


    /**
     * Gets the configuration for the currently active environment.
     * @returns The active environment's config or null if none is active.
     */
    public getActiveEnvironment(): EnvironmentConfig | null {
        const config = this.getAllConfig();
        if (!config.activeEnvironmentName) {
            return null;
        }
        return config.environments.find(env => env.name === config.activeEnvironmentName) ?? null;
    }

    /**
     * Adds a new environment configuration.
     * @param name The unique name for the new environment.
     * @returns True if added successfully, false otherwise (e.g., name conflict).
     */
    public async addEnvironment(name: string): Promise<boolean> {
        const config = this.getAllConfig();
        if (config.environments.some(env => env.name.toLowerCase() === name.toLowerCase())) {
            vscode.window.showErrorMessage(`Environment '${name}' already exists.`);
            return false;
        }

        config.environments.push({ name, cliArgs: '' }); // Add with empty args initially
        config.environments.sort((a, b) => a.name.localeCompare(b.name)); // Keep sorted
        await this.saveAllConfig(config);
        this.outputChannel.appendLine(`Added environment: ${name}`);
        return true;
    }

    /**
     * Updates an existing environment's configuration.
     * @param oldName The current name of the environment to update.
     * @param newConfig The new configuration data (name and args).
     * @returns True if updated successfully, false otherwise (e.g., not found, new name conflict).
     */
    public async updateEnvironment(oldName: string, newConfig: EnvironmentConfig): Promise<boolean> {
        const config = this.getAllConfig();
        const index = config.environments.findIndex(env => env.name.toLowerCase() === oldName.toLowerCase());

        if (index === -1) {
            vscode.window.showErrorMessage(`Environment '${oldName}' not found.`);
            return false;
        }

        // Check if the new name conflicts with another existing environment
        if (oldName.toLowerCase() !== newConfig.name.toLowerCase() &&
            config.environments.some((env, i) => i !== index && env.name.toLowerCase() === newConfig.name.toLowerCase())) {
             vscode.window.showErrorMessage(`Another environment named '${newConfig.name}' already exists.`);
            return false;
        }

        config.environments[index] = newConfig;

         // If the renamed environment was active, update the active name
         if (config.activeEnvironmentName === oldName) {
            config.activeEnvironmentName = newConfig.name;
        }

        config.environments.sort((a, b) => a.name.localeCompare(b.name)); // Keep sorted
        await this.saveAllConfig(config);
        this.outputChannel.appendLine(`Updated environment: ${oldName} -> ${newConfig.name}`);
        return true;
    }

    /**
     * Deletes an environment configuration.
     * @param name The name of the environment to delete.
     * @returns True if deleted successfully, false otherwise (e.g., not found).
     */
    public async deleteEnvironment(name: string): Promise<boolean> {
        const config = this.getAllConfig();
        const initialLength = config.environments.length;
        config.environments = config.environments.filter(env => env.name.toLowerCase() !== name.toLowerCase());

        if (config.environments.length === initialLength) {
             vscode.window.showWarningMessage(`Environment '${name}' not found.`);
            return false; // Not found
        }

        // If the deleted environment was active, unset the active environment
        if (config.activeEnvironmentName === name) {
            config.activeEnvironmentName = null;
        }

        await this.saveAllConfig(config);
        this.outputChannel.appendLine(`Deleted environment: ${name}`);
        return true;
    }

    /**
     * Sets the specified environment as the active one.
     * @param name The name of the environment to set as active.
     * @returns True if set successfully, false otherwise (e.g., environment not found).
     */
    public async setActiveEnvironment(name: string | null): Promise<boolean> {
        const config = this.getAllConfig();

        if (name !== null && !config.environments.some(env => env.name === name)) {
            vscode.window.showErrorMessage(`Environment '${name}' not found.`);
             this.outputChannel.appendLine(`Attempted to set non-existent environment active: ${name}`);
            return false;
        }

        config.activeEnvironmentName = name;
        await this.saveAllConfig(config);
         this.outputChannel.appendLine(`Set active environment to: ${name ?? 'None'}`);
        return true;
    }
}