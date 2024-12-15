import React from "react";

interface TabProps {
  sessionId: string;
  label: string | number;
  isSelected?: boolean;
  onClose: () => void;
  onSelect: () => void;
  onContextMenu: (event: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * Tab component: HTML and styles copy pasted from Caido Replay Page
 */
export function Tab({
  sessionId,
  label,
  isSelected = false,
  onClose,
  onContextMenu,
  onSelect,
}: TabProps) {
  return (
    <div role="tab" aria-selected={isSelected} onClick={onSelect} style={{ margin: "0" }} onContextMenu={onContextMenu}>
      <div
        data-is-selected={isSelected}
        data-is-editable="false"
        data-session-id={sessionId}
      >
        <span
          role="group"
          className={`border-[1px] border-surface-700 rounded-md [&>[data-pc-name=button]]:m-0 [&>[data-pc-name=button]]:border-r-none [&>[data-pc-name=button]:nth-last-child(n+2)]:rounded-tr-none [&>[data-pc-name=button]:nth-last-child(n+2)]:rounded-br-none [&>[data-pc-name=button]:nth-child(n+2)]:rounded-tl-none [&>[data-pc-name=button]:nth-child(n+2)]:rounded-bl-none flex ${
            isSelected ? "!border-secondary-400" : ""
          }`}
          data-pc-name="buttongroup"
        >
          <button
            type="button"
            data-pc-name="button"
            data-p-disabled="false"
            data-p-severity="contrast"
            className="!bg-surface-900 border-surface-700 !ring-0 border-none flex-1 relative items-center inline-flex text-center align-bottom justify-center leading-[normal] text-sm py-1.5 px-3 rounded-md bg-transparent border text-surface-900 dark:text-surface-300 border-surface-900 dark:border-surface-300 focus:outline-none focus:outline-offset-0 focus:ring-1 focus:ring-surface-500 dark:focus:ring-surface-0 hover:bg-surface-900/10 dark:hover:bg-[rgba(255,255,255,0.03)] transition duration-200 ease-in-out cursor-pointer overflow-hidden select-none [&>[data-pc-name=badge]]:min-w-4 [&>[data-pc-name=badge]]:h-4 [&>[data-pc-name=badge]]:leading-4"
          >
            <div className="text-small">
              <span className="px-1 whitespace-nowrap">{label}</span>
            </div>
          </button>
          <div className="bg-surface-900 w-10 border-none rounded-md px-2 py-1">
            <button
              data-pc-name="button"
              data-p-disabled="false"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="cursor-pointer"
            >
              <span className="fas fa-close text-surface-900 dark:text-surface-300 hover:text-secondary-400 p-1 transition duration-200 ease-in-out"></span>
            </button>
          </div>
        </span>
      </div>
    </div>
  );
}
