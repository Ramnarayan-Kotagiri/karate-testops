# Karate TestOps for VS Code

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/RamKotagiri.karate-testops.svg?style=flat-square&label=Marketplace)](https://marketplace.visualstudio.com/items?itemName=RamKotagiri.karate-testops)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/RamKotagiri.karate-testops.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=RamKotagiri.karate-testops)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/RamKotagiri.karate-testops.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=RamKotagiri.karate-testops)

**Streamline your Karate API testing workflow directly within Visual Studio Code!**

Karate TestOps provides essential tools to manage test environments and execute your `.feature` files directly from the editor context menu, enhancing productivity for Karate developers.

## Key Features (v0.1.0 - MVP)

* **🌿 Environment Management Sidebar:**
    * Dedicated "Karate TestOps" view in the Activity Bar.
    * Easily **Create, Read, Update, and Delete** test environments (e.g., DEV, QA, PROD).
    * Configure environment-specific **Karate CLI arguments** (like `karate.env`, `karate.tags`, custom `-D` properties) in one place.
    * Select an **Active Environment** to be used for running tests.
    * Configurations are saved per workspace.
    * **▶️ Context Menu Test Execution:**
    * Right-click within a `.feature` file editor:
        * **`Karate TestOps: Run Scenario`**: Executes the specific scenario under your cursor.
        * **`Karate TestOps: Run Feature`**: Executes the entire feature file.
    * Uses the settings (CLI arguments) from your **currently active environment**.
    * Commands run in a dedicated VS Code integrated terminal.
    * **🖥️ Integrated Terminal Output:**
    * Test execution output (e.g., `mvn test` logs) appears directly in a VS Code terminal panel.

*(Note: Scenario debugging functionality is planned for a future release and is not included in this version).*

## Prerequisites

* **Visual Studio Code:** Version 1.75 or higher recommended.
* **Java Development Kit (JDK):** A compatible JDK installed and `JAVA_HOME` environment variable correctly configured.
* **Karate Project:** An existing Karate test project.
* **Build Tool:**
    * Currently assumes a **Maven** project (`pom.xml` at the workspace root). Ensure `mvn` is available in your system's PATH.
    * *(Support for Gradle and standalone JARs may be added in the future).*

## Installation

1.  Open **Visual Studio Code**.
2.  Go to the **Extensions** view (`Ctrl+Shift+X` or `Cmd+Shift+X`).
3.  Search for `Karate TestOps`.
4.  Look for the extension published by **RamKotagiri**.
5.  Click **Install**.

Alternatively, install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=RamKotagiri.karate-testops).

## Getting Started: Configuring Environments

1.  Open your Karate project folder in VS Code.
2.  Click the **Karate TestOps icon** in the Activity Bar (find the icon you chose!).
3.  In the "Environments" view that appears, click the **`+` (Add Environment)** button in the view's title bar.
4.  Enter a unique name (e.g., `DEV`, `QA`) and press `Enter`.
5.  **Configure Arguments:**
    * Right-click the environment you just added and select **`Edit Environment`**.
    * You'll be prompted for a name (you can keep it or change it). Press `Enter`.
    * You'll be prompted for CLI arguments. Enter all arguments as a single string, separated by spaces.
        * **Example:** `karate.env=dev -DmyCustomProp=abc karate.tags=@smoke,~@regression`
    * Press `Enter` to save the arguments.
6.  **Set Active:**
    * Right-click the environment you want to use for running tests and select **`Set as Active Environment`**.
    * The active environment will be marked (e.g., with a check icon and '(Active)').

## Usage: Running Tests

1.  Ensure you have configured at least one environment and set it as **Active**.
2.  Open a `.feature` file from your Karate project (expected under `src/test/java` or `src/test/resources` for current path logic).
3.  **To Run a Specific Scenario:**
    * Place your cursor on any line within the `Scenario:` block you want to run.
    * Right-click and select **`Karate TestOps: Run Scenario`**.
4.  **To Run the Entire Feature:**
    * Right-click anywhere within the editor for the `.feature` file.
    * Select **`Karate TestOps: Run Feature`**.
5.  A VS Code terminal will open/reuse and execute the appropriate command (e.g., `mvn test -Dkarate.options="..."`) using the arguments from your active environment.

## Known Limitations & Future Scope

* **Maven Focus:** Currently assumes a standard Maven project structure and uses `mvn test` for execution. Path resolution expects features under `src/test/java` or `src/test/resources`.
* **No Debugging (Yet!):** Scenario debugging via context menu is planned for future versions.
* **Build Tool Detection:** Does not yet auto-detect Gradle or support standalone JAR execution.
* **Basic Argument Parsing:** Assumes environment arguments are space-separated. Complex quoted arguments might need careful formatting.

## Contributing / Support


* Found a bug or have a feature request? Please report issues at: [Link to your GitHub Issues page - e.g., https://github.com/RamKotagiri/karate-testops/issues]
* Contributions are welcome! [Link to your contribution guidelines if available]

## License

This extension is licensed under the [MIT License](LICENSE.txt).