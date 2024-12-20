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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

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
function setupCommands(sdk: FrontendSDK) {
  const attackTypes = ["query", "body", "headers"] as AttackType[];

  attackTypes.forEach((attackType) => {
    const commandId = `paramfinder:start-${attackType}`;
    const displayName = `Param Finder [${attackType.toUpperCase()}]`;

    async function handleMining(request: Request, settings: any) {
      return handleBackendCall(
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
    }

    async function handleRequestRowContext(requests: any[]) {
      for (const req of requests) {
        const request = await handleBackendCall(
          sdk.backend.getRequest(req.id),
          sdk
        );
        const settings = await handleBackendCall(
          sdk.backend.getSettings(),
          sdk
        );
        await handleMining(request, settings);
      }
    }

    async function handleSingleRequest(request: {
      raw: string;
      isTls: boolean;
      host: string;
      port: number;
      path: string;
      query: string;
    }) {
      const settings = await handleBackendCall(sdk.backend.getSettings(), sdk);
      const parsedRequest = parseRequest(request.raw);

      const _request: Request = {
        ...parsedRequest,
        id: generateID(),
        url: `${request.isTls ? "https" : "http"}://${request.host}:${
          request.port
        }${request.path}${request.query}`,
        query: request.query,
        host: request.host,
        port: request.port,
        tls: request.isTls,
        context: "discovery",
        raw: request.raw,
      };

      await handleMining(_request, settings);
    }

    sdk.commands.register(commandId, {
      name: displayName,
      group: "Param Finder",
      run: async (context: CommandContext) => {
        sdk.navigation.goTo("/paramfinder");

        if (context.type === "RequestRowContext") {
          const requests = context.requests.slice(0, 25);
          await handleRequestRowContext(requests);
        }

        if (context.type === "RequestContext") {
          await handleSingleRequest(context.request);
        }

        if (context.type === "BaseContext") {
          const request = getSelectedRequest(sdk);
          if (request) {
            const parsedRequest = parseRequest(request.raw);
            await handleSingleRequest({
              raw: request.raw,
              isTls: request.isTLS,
              host: parsedRequest.host,
              port: request.port,
              path: parsedRequest.path,
              query: parsedRequest.query,
            });
          }
        }
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
