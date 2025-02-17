import React, { useEffect, useRef, useState } from "react";
import {
  HTTPRequestEditor,
  HTTPResponseEditor,
} from "@caido/sdk-frontend/src/types/editor";
import { getSDK } from "@/stores/sdkStore";
import { Menu, MenuItem } from "@mui/material";

interface HTTPEditorProps {
  value: string;
  host?: string;
  port?: number;
  isTls?: boolean;
  type: "request" | "response";
  style?: React.CSSProperties;
  onChange?: (value: string) => void;
  removeFooter?: boolean;
  removeHeader?: boolean;
}

type EditorType = HTTPRequestEditor | HTTPResponseEditor;

export const HTTPEditor: React.FC<HTTPEditorProps> = ({
  value,
  host,
  port,
  isTls,
  type,
  style,
  onChange,
  removeFooter = false,
  removeHeader = false,
}) => {
  const sdk = getSDK();
  const editorRef = useRef<EditorType | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hash, setHash] = useState(window.location.hash);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const setValue = (value: string) => {
    const view = editorRef.current?.getEditorView();
    if (!view) return;
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: value,
      },
    });
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    if (type !== "request") return;

    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
          }
        : null
    );
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  const handleSendToReplay = async () => {
    if (!editorRef.current) return;

    const requestSource = editorRef.current
      .getEditorView()
      ?.state.doc.toString()
      ?.replace(/\n/g, "\r\n");
    if (!requestSource) return;

    try {
      const createdSession = await sdk.graphql.createReplaySession({
        input: {
          requestSource: {
            raw: {
              raw: requestSource,
              connectionInfo: {
                host: host,
                port: port,
                isTLS: isTls,
              },
            },
          },
        },
      });

      sdk.replay.openTab(createdSession.createReplaySession.session?.id);
      sdk.window.showToast("Request sent to replay", {
        variant: "success",
      });
    } catch (error) {
      console.error("Error creating replay session:", error);
      sdk.window.showToast(
        "Error creating replay session. Check console for details.",
        {
          variant: "error",
        }
      );
    }

    handleClose();
  };
  const initializeEditor = () => {
    if (!containerRef.current) return;
    const newEditor =
      type === "request"
        ? sdk.ui.httpRequestEditor()
        : sdk.ui.httpResponseEditor();

    editorRef.current = newEditor;
    containerRef.current.appendChild(newEditor.getElement());
    setValue(value);

    return newEditor;
  };

  useEffect(() => {
    const newEditor = initializeEditor();

    return () => {
      if (containerRef.current && newEditor) {
        containerRef.current.removeChild(newEditor.getElement());
      }
    };
  }, [sdk, type, hash]);

  useEffect(() => {
    if (editorRef.current) setValue(value);
  }, [value]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newHash = window.location.hash;
      if (newHash !== hash) {
        setHash(newHash);
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
    });

    return () => observer.disconnect();
  }, [hash]);

  return (
    <div
      style={{ height: "100%", ...style }}
      ref={containerRef}
      onContextMenu={handleContextMenu}
    >
      {type === "request" && (
        <Menu
          open={contextMenu !== null}
          onClose={handleClose}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu !== null
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined
          }
        >
          <MenuItem onClick={handleSendToReplay}>Send to Replay</MenuItem>
        </Menu>
      )}
    </div>
  );
};
