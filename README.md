# Karate TestOps

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/your-publisher-name.karate-testops.svg?style=flat-square&label=Marketplace)](https://marketplace.visualstudio.com/items?itemName=your-publisher-name.karate-testops)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/your-publisher-name.karate-testops.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=your-publisher-name.karate-testops)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/your-publisher-name.karate-testops.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=your-publisher-name.karate-testops)

**Enhance your Karate API testing workflow directly within Visual Studio Code!**

Karate TestOps provides seamless integration for managing test environments, running features/scenarios via context menus, and enabling scenario-level debugging without leaving your editor.

<!-- Optional: Add Logo/Screenshot Here -->
<!-- ![Karate TestOps Demo](media/demo.gif) -->

## Features

*   **Environment Management Sidebar:**
    *   Dedicated "Karate TestOps" view in the Activity Bar.
    *   Create, Read, Update, and Delete test environments (e.g., DEV, QA, PROD).
    *   Configure environment-specific Karate CLI arguments (like `karate.env`, `karate.tags`, `--threads`, custom `-D` properties).
    *   Persists configurations within the workspace.
    *   Select an "Active" environment used for default test runs.
*   **Context Menu Test Execution:**
    *   Right-click within a `.feature` file:
        *   **"Karate TestOps: Run Scenario"**: Executes the specific scenario under the cursor using the active environment's arguments.
        *   **"Karate TestOps: Run Feature"**: Executes the entire feature file using the active environment's arguments.
    *   Tests run in a dedicated VS Code integrated terminal.
*   **Scenario-Level Debugging:**
    *   Right-click within a `.feature` file:
        *   **"Karate TestOps: Debug Scenario"**: Launches a Java debug session specifically for the scenario under the cursor.
    *   Dynamically generates debug configurations – **no manual `launch.json` setup needed for scenarios!**
    *   Uses the active environment's arguments.
    *   Set breakpoints directly in your `.feature` files (`Given`, `When`, `Then`). *(Requires Java Debugger extension for VS Code)*.

## Prerequisites

*   **Visual Studio Code:** Version 1.75 or higher.
*   **Java Development Kit (JDK):** A compatible JDK installed and configured (`JAVA_HOME` environment variable set).
*   **Karate Project:** An existing Karate test project.
*   **Build Tool (Optional but Common):** Maven (`mvn`) or Gradle (`gradlew`/`gradle`) configured in your system's PATH if your project uses them. The extension currently prioritizes Maven commands.
*   **VS Code Extension:** [Debugger for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-debug) (required for debugging feature).

## Installation

1.  Install from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=your-publisher-name.karate-testops) (Link will work once published).
2.  Alternatively, search for "Karate TestOps" in the VS Code Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`) and click **Install**.
3.  You can also install manually from a `.vsix` file (Extensions View -> ... -> Install from VSIX...).

## Setup: Configuring Environments

1.  Open the **Karate TestOps** view from the Activity Bar (look for its icon).
2.  Click the **Add Environment** (+) button in the view's title bar.
3.  Enter a unique name for the environment (e.g., `DEV`) and press Enter.
4.  **Edit Environment Arguments:**
    *   Right-click the newly created environment and select **Edit Environment**.
    *   You'll be prompted to enter the CLI arguments as a single string. Separate arguments with spaces. Use standard CLI syntax.
        *   **Example:** `karate.env=dev karate.tags=@smoke,~@regression -DmyCustomProp=abc --threads 4`
    *   Press Enter to save.
5.  **Set Active Environment:**
    *   Right-click the environment you want to use for running/debugging tests and select **Set as Active Environment**. The active environment will be marked (e.g., bold or with an icon).

## Usage

### Running Tests

1.  Open a `.feature` file from your Karate project.
2.  **To Run a Specific Scenario:** Right-click on any line within the scenario (e.g., `Scenario:`, `Given`, `When`, `Then`) and select **Karate TestOps: Run Scenario**.
3.  **To Run the Entire Feature:** Right-click anywhere in the editor (but typically not inside a specific scenario if you intend to run the whole file) and select **Karate TestOps: Run Feature**.
4.  A new terminal instance will open, executing the Karate test with the arguments from your **active** environment.

### Debugging Scenarios

1.  Ensure the [Debugger for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-debug) extension is installed and enabled.
2.  Open a `.feature` file.
3.  Set breakpoints on `Given`, `When`, or `Then` lines by clicking in the gutter to the left of the line number.
4.  Right-click on any line within the scenario you want to debug and select **Karate TestOps: Debug Scenario**.
5.  The Java debugger will attach, and execution should pause at your breakpoints. Use the standard VS Code debug controls (Continue, Step Over, etc.).

## Known Limitations & Future Ideas

*   Currently assumes a Maven (`mvn test`) structure for execution commands. Gradle/Standalone JAR support might require adjustments or configuration options.
*   Scenario name parsing relies on simple line searching; complex Gherkin structures might not be parsed perfectly.
*   Debug configuration assumes standard Java debug ports and arguments; might need tuning for specific setups.
*   No dedicated UI for editing arguments (uses plain input box).
*   Unit tests are basic and need expansion.

## Contributing

[Placeholder: Instructions for contributing, reporting bugs, etc.]

## License

[MIT](LICENSE.md)