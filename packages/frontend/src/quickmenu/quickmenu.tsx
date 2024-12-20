import { AttackType } from "shared";

interface QuickMenuCallbacks {
  onSelect?: (attackType: AttackType) => void;
  onClose?: () => void;
  onHover?: (button: HTMLButtonElement | null) => void;
}

interface QuickMenuOptions {
  x: number;
  y: number;
  attackTypes: AttackType[];
}

export function createQuickMenu(options: QuickMenuOptions, callbacks: QuickMenuCallbacks = {}) {
  let isOpen = false;
  let currentHoveredButton: HTMLButtonElement | null = null;
  let menu: HTMLDivElement | null = null;

  function closeMenu() {
    if (menu && document.body.contains(menu)) {
      document.body.removeChild(menu);
    }
    isOpen = false;
    document.removeEventListener("keyup", handleKeyUp);
    document.removeEventListener("click", handleClickOutside);
    callbacks.onClose?.();
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (
      e.key === "Meta" ||
      e.key === "Control" ||
      e.key === "Shift" ||
      e.key.toLowerCase() === "e"
    ) {
      if (currentHoveredButton) {
        currentHoveredButton.click();
        closeMenu();
      } else {
        closeMenu();
      }
    }
  }

  function handleClickOutside(e: MouseEvent) {
    if (menu && !menu.contains(e.target as Node)) {
      closeMenu();
    }
  }

  function open() {
    if (isOpen) return;
    isOpen = true;

    menu = document.createElement("div");
    Object.assign(menu.style, {
      position: "fixed",
      background: "var(--c-bg-subtle)",
      borderRadius: "4px",
      padding: "4px",
      zIndex: "10000",
      display: "flex",
      flexDirection: "column",
      gap: "2px",
      left: `${options.x}px`,
      top: `${options.y}px`,
      transform: "translate(-50%, -50%)",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
      minWidth: "120px",
    });

    const hint = document.createElement("div");
    Object.assign(hint.style, {
      fontSize: "10px",
      color: "var(--c-text-subtle)",
      padding: "2px 8px 4px",
      borderBottom: "1px solid var(--c-bg-default)",
      marginBottom: "2px",
    });
    hint.textContent = "ParamMiner Options";
    menu.appendChild(hint);

    options.attackTypes.forEach((attackType) => {
      const button = document.createElement("button");
      Object.assign(button.style, {
        display: "flex",
        alignItems: "center",
        padding: "4px 8px",
        background: "none",
        border: "none",
        color: "#fff",
        cursor: "pointer",
        fontSize: "12px",
        width: "100%",
        borderRadius: "2px",
      });

      const icon = document.createElement("i");
      icon.className = attackType === "query"
        ? "fas fa-search"
        : attackType === "body"
        ? "fas fa-file-alt"
        : "fas fa-list";

      Object.assign(icon.style, {
        marginRight: "6px",
        width: "12px",
      });

      button.appendChild(icon);
      button.appendChild(document.createTextNode(attackType.toUpperCase()));

      button.addEventListener("mouseenter", () => {
        button.style.background = "rgba(255, 255, 255, 0.1)";
        currentHoveredButton = button;
        callbacks.onHover?.(button);
      });

      button.addEventListener("mouseleave", () => {
        button.style.background = "none";
        currentHoveredButton = null;
        callbacks.onHover?.(null);
      });

      button.addEventListener("click", () => {
        callbacks.onSelect?.(attackType);
        closeMenu();
      });

      menu.appendChild(button);
    });

    document.body.appendChild(menu);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("click", handleClickOutside);
  }

  return {
    open,
    close: closeMenu,
    isOpen: () => isOpen,
  };
}
