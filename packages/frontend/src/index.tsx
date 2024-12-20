import { createRoot } from "react-dom/client";
import { FrontendSDK } from "./types";
import App from "./App";
import { setSDK } from "./stores/sdkStore";
import { setupEvents } from "./events";
import {
  generateID,
  getSelectedRequest,
  handleBackendCall,
  parseRequest,
} from "./utils/utils";
import { Caido } from "@caido/sdk-frontend";
import { API, BackendEvents } from "backend";
import { CommandContext } from "@caido/sdk-frontend/src/types";
import { AttackType, Request } from "shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createQuickMenu } from "./quickmenu/quickmenu";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

let setCount: (count: number) => void;

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
  root.render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );

  return rootElement;
}

/**
 * Registers commands and menu items
 */
let sidebarCount = 0;
function setupCommands(sdk: FrontendSDK) {
  const attackTypes = ["query", "body", "headers"] as AttackType[];

  let currentPath = window.location.hash;
  const observer = new MutationObserver(() => {
    const newPath = window.location.hash;
    if (newPath !== currentPath) {
      currentPath = newPath;
      if (currentPath === "#/paramfinder") {
        sidebarCount = 0;
        setCount(sidebarCount);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  async function handleMining(
    request: Request,
    settings: any,
    attackType: AttackType
  ) {
    const result = await handleBackendCall(
      sdk.backend.startMining(request, {
        attackType,
        learnRequestsCount: settings.learnRequestsCount,
        autoDetectMaxSize: settings.autoDetectMaxSize,
        timeout: settings.timeout,
        delayBetweenRequests: settings.delay,
        concurrency: settings.concurrency,
        performanceMode: settings.performanceMode,
        maxQuerySize: settings.maxQuerySize,
        maxHeaderSize: settings.maxHeaderSize,
        maxBodySize: settings.maxBodySize,
        wafDetection: settings.wafDetection,
        debug: settings.debug,
      }),
      sdk
    );

    sdk.window.showToast("Started ParamFinder session", {
      variant: "info",
      duration: 2000,
    });

    sidebarCount++;
    setCount(sidebarCount);

    return result;
  }

  async function handleRequestRowContext(
    requests: any[],
    attackType: AttackType
  ) {
    for (const req of requests) {
      const request = await handleBackendCall(
        sdk.backend.getRequest(req.id),
        sdk
      );
      const settings = await handleBackendCall(sdk.backend.getSettings(), sdk);
      await handleMining(request, settings, attackType);
    }
  }

  async function handleSingleRequest(
    request: {
      raw: string;
      isTls: boolean;
      host: string;
      port: number;
      path: string;
      query: string;
    },
    attackType: AttackType
  ) {
    const settings = await handleBackendCall(sdk.backend.getSettings(), sdk);
    const parsedRequest = parseRequest(request.raw);

    const url = `${request.isTls ? "https" : "http"}://${request.host}:${
      request.port
    }${request.path}${request.query ? `?${request.query}` : ""}`;

    const _request: Request = {
      ...parsedRequest,
      id: generateID(),
      url,
      query: request.query,
      host: request.host,
      port: request.port,
      tls: request.isTls,
      context: "discovery",
      raw: request.raw,
    };

    console.log("_request", _request);

    await handleMining(_request, settings, attackType);
  }

  async function handleCommandRun(
    context: CommandContext,
    attackType: AttackType
  ) {
    if (context.type === "RequestRowContext") {
      const requests = context.requests.slice(0, 25);
      await handleRequestRowContext(requests, attackType);
    }

    if (context.type === "RequestContext") {
      await handleSingleRequest(context.request, attackType);
    }

    if (context.type === "BaseContext") {
      const request = getSelectedRequest(sdk);
      if (request) {
        const parsedRequest = parseRequest(request.raw);
        await handleSingleRequest(
          {
            raw: request.raw,
            isTls: request.isTLS,
            host: request.host,
            port: request.port,
            path: parsedRequest.path,
            query: parsedRequest.query,
          },
          attackType
        );
      }
    }
  }

  attackTypes.forEach((attackType) => {
    const commandId = `paramfinder:start-${attackType}`;
    const displayName = `Param Finder [${attackType.toUpperCase()}]`;

    sdk.commands.register(commandId, {
      name: displayName,
      group: "Param Finder",
      run: async (context: CommandContext) => {
        await handleCommandRun(context, attackType);
      },
    });

    sdk.menu.registerItem({
      type: "RequestRow",
      commandId,
      leadingIcon: "fas fa-search",
    });

    sdk.menu.registerItem({
      type: "Request",
      commandId,
      leadingIcon: "fas fa-search",
    });

    sdk.commandPalette.register(commandId);
  });

  let mouseX = 0;
  let mouseY = 0;

  document.addEventListener("mousemove", (event: MouseEvent) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
  });

  let isQuickMenuOpen = false;
  sdk.commands.register("paramfinder:quick-menu", {
    name: "Param Finder Quick Menu",
    group: "Param Finder",
    run: async (context: CommandContext) => {
      if (isQuickMenuOpen) {
        return;
      }

      const onSelect = (attackType: AttackType) => {
        handleCommandRun(context, attackType);
      };

      const onClose = () => {
        isQuickMenuOpen = false;
      };

      const quickMenu = createQuickMenu(
        {
          x: mouseX,
          y: mouseY,
          attackTypes: ["query", "body", "headers"],
        },
        {
          onSelect,
          onClose,
        }
      );

      quickMenu.open();
      isQuickMenuOpen = true;
    },
  });

  sdk.shortcuts.register("paramfinder:quick-menu", ["command+shift+e", "ctrl+shift+e"]);
}

/**
 * Configures navigation and sidebar
 */
function setupNavigation(sdk: FrontendSDK, rootElement: HTMLDivElement) {
  sdk.navigation.addPage("/paramfinder", {
    body: rootElement,
  });

  const { setCount: setSidebarCount } = sdk.sidebar.registerItem(
    "Param Finder",
    "/paramfinder",
    {
      icon: "fas fa-search",
    }
  );

  setCount = setSidebarCount;
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
