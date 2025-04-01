/**
 * Centralized constants for the Karate TestOps extension.
 */
export const EXTENSION_ID = 'karate-testops';
export const EXTENSION_NAME = 'Karate TestOps';

// Command IDs (Must match package.json)
export const CMD_REFRESH_ENVS = `${EXTENSION_ID}.refreshEnvironments`;
export const CMD_ADD_ENV = `${EXTENSION_ID}.addEnvironment`;
export const CMD_EDIT_ENV = `${EXTENSION_ID}.editEnvironment`;
export const CMD_DELETE_ENV = `${EXTENSION_ID}.deleteEnvironment`;
export const CMD_SET_ACTIVE_ENV = `${EXTENSION_ID}.setActiveEnvironment`;
export const CMD_UNSET_ACTIVE_ENV = `${EXTENSION_ID}.unsetActiveEnvironment`;
export const CMD_RUN_FEATURE = `${EXTENSION_ID}.runFeature`;
export const CMD_RUN_SCENARIO = `${EXTENSION_ID}.runScenario`;
export const CMD_DEBUG_SCENARIO = `${EXTENSION_ID}.debugScenario`;

// View IDs (Must match package.json)
export const VIEW_ENVIRONMENTS = 'karateTestOpsEnvironments';

// Configuration Keys (for workspaceState)
export const CONFIG_KEY_ENVIRONMENTS = `${EXTENSION_ID}.environments`;
export const CONFIG_KEY_ACTIVE_ENVIRONMENT = `${EXTENSION_ID}.activeEnvironment`;

// Context Keys (Used in package.json 'when' clauses)
// The TreeItem contextValue will be set like: karateTestOpsEnvironment or karateTestOpsEnvironmentActive
export const CONTEXT_ENVIRONMENT_ITEM = 'karateTestOpsEnvironment';

// Other
export const KARATE_LANG_ID = 'karate';
export const GHERKIN_LANG_ID = 'gherkin';
export const FEATURE_LANG_ID = 'feature'; // For .feature files
export const OUTPUT_CHANNEL_NAME = 'Karate TestOps Logs';
export const DEFAULT_DEBUG_PORT = 5005; // Default Java debug port