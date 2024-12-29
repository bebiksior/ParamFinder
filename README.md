# ParamFinder
Discover hidden parameters straight from Caido!

![Screen Recording 2024-12-12 at 13 10 27](https://github.com/user-attachments/assets/8a37a8a0-4c2e-4a23-8d0e-bc50169759f6)

## Installation

### Via Community Store [Recommended]
1. In your Caido, go to the Plugins page
2. Navigate to the Community Store
3. Search for ParamFinder
4. Click Install
5. Done! 🎉

### Manual Installation
1. Navigate to the [Releases](https://github.com/bebiksior/ParamFinder/releases) page
2. Download latest `plugin_package.zip`
3. Go to the Plugins page in your Caido
4. Click 'Install Package' and select downloaded `plugin_package.zip` file
5. Done! 🎉

---

## Ways to Start

##### Quick Menu Shortcut
The fastest way to start ParamFinder is using the keyboard shortcut (customizable in Caido Settings → Shortcuts).

![Quick Menu usage demonstration](https://raw.githubusercontent.com/bebiksior/ParamFinder/refs/heads/main/assets/QuickMenu.gif)

##### Command Palette
Open Caido's command palette and type 'Param Finder' to see available commands:

- **Param Finder [QUERY]** - Discover parameters in URL query string
- **Param Finder [BODY]** - Find parameters in request body
- **Param Finder [HEADERS]** - Search for header parameters

![Command palette usage demonstration](https://raw.githubusercontent.com/bebiksior/ParamFinder/refs/heads/main/assets/CommandPalette.gif)

##### Context Menu
Right-click on any request in Caido to start parameter discovery from the context menu.

![Context menu usage demonstration](https://raw.githubusercontent.com/bebiksior/ParamFinder/refs/heads/main/assets/ContextMenu.gif)

##### Custom Shortcuts
You can create custom shortcuts for ParamFinder actions in Caido Settings → Shortcuts.

![Custom shortcuts usage demonstration](https://raw.githubusercontent.com/bebiksior/ParamFinder/refs/heads/main/assets/CustomShortcuts.gif)

---

### Getting Started

1. **Upload a Wordlist**
   Before starting, make sure you have at least one wordlist uploaded and enabled in ParamFinder settings. The wordlist should contain potential parameter names to test.

2. **Select a Request**
   Choose a request from your Caido history that you want to test for hidden parameters. This will be your base request for parameter discovery.

3. **Choose Attack Type**
   Select where to look for parameters:
   - **QUERY** - Tests parameters in the URL query string
   - **BODY** - Tests parameters in the request body (JSON or URL-encoded)
   - **HEADERS** - Tests for custom header parameters

4. **Monitor Progress**
   ParamFinder will start testing parameters and show results in real-time. You can:
   - View discovered parameters in the Findings section
   - Copy or export found parameters
   - Pause/Resume or Cancel the discovery process

---

## Contributing
Feel free to contribute! If you'd like to request a feature or report a bug, please create a [GitHub Issue](https://github.com/bebiksior/ParamFinder/issues/new).
