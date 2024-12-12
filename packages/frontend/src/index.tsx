import { createRoot } from "react-dom/client";
import { FrontendSDK } from "./types";
import App from "./App";
import { setSDK } from "./stores/sdkStore";
import { setupEvents } from "./events";
import { ParamLocation } from "shared";
import { handleBackendCall } from "./utils/utils";
import { Caido } from "@caido/sdk-frontend";
import { API, BackendEvents } from "backend";
import { CommandContext } from "@caido/sdk-frontend/src/types";

/**
 * Sets up React UI and returns root element
 */
function setupUI(sdk: FrontendSDK) {
  const rootElement = document.createElement("div");
  Object.assign(rootElement.style, {
    height: "100%",
    width: "100%",
  });

  const root = createRoot(rootElement);
  root.render(<App />);

  return rootElement;
}
/**
 * Registers commands and menu items
 */
function setupCommands(sdk: FrontendSDK) {
  const paramsLocations = ["query", "body", "headers"] as ParamLocation[];

  paramsLocations.forEach((paramsLocation) => {
    const commandId = `paramfinder:start-${paramsLocation}`;
    const displayName = `Param Finder (${paramsLocation.toUpperCase()})`;

    sdk.commands.register(commandId, {
      name: displayName,
      run: async (context: CommandContext) => {
        if (context.type === "RequestRowContext") {
          sdk.navigation.goTo("/paramfinder");
          const requests = context.requests.slice(0, 25);

          for (const req of requests) {
            const request = await handleBackendCall(sdk.backend.getRequest(req.id), sdk);

            handleBackendCall(sdk.backend.startMining(request, {
              paramsLocation,
            }), sdk);
          }
        }
      },
    });

    sdk.menu.registerItem({
      type: "RequestRow",
      commandId,
      leadingIcon: "fas fa-search",
    });
  });
}

/**
 * Configures navigation and sidebar
 */
function setupNavigation(sdk: FrontendSDK, rootElement: HTMLDivElement) {
  sdk.navigation.addPage("/paramfinder", {
    body: rootElement,
  });

  sdk.sidebar.registerItem("Param Finder", "/paramfinder", {
    icon: "fas fa-search",
  });
}

/**
 * Initializes the plugin
 */
export const init = (sdk: Caido<API, BackendEvents>) => {
  setSDK(sdk);
  setupEvents(sdk);

  const rootElement = setupUI(sdk);
  setupCommands(sdk);
  setupNavigation(sdk, rootElement);
};
