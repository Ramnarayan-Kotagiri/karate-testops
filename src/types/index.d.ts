/**
 * Represents a single command-line argument.
 * We might just store them as a single string per environment for simplicity initially.
 */
// export interface CliArgument {
//   key: string;
//   value: string;
// }

/**
 * Configuration for a single test environment.
 */
export interface EnvironmentConfig {
    /** Unique name for the environment (e.g., DEV, QA) */
    name: string;
    /** String containing all CLI arguments for this environment */
    cliArgs?: string; // Allow it to be optional initially
  }
  
  /**
   * Structure stored in workspaceState for all environments.
   */
  export interface AllEnvironmentsConfig {
      environments: EnvironmentConfig[];
      activeEnvironmentName?: string | null; // Store the name of the active env
  }