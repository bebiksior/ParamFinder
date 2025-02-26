import { AttackType } from "shared";
import "./dialog.css";

interface DialogOptions {
  jsonBody: string;
  onSubmit?: (data: DialogResult) => void;
  onCancel?: () => void;
  initialValues?: Partial<DialogResult>;
}

export interface DialogResult {
  attackType?: AttackType;
  customValue?: string;
  jsonBodyPath?: string;
}

interface DragOffset {
  x: number;
  y: number;
}

const CACHE_KEY = 'paramfinder-dialog-cache';

export class AdvancedScanDialog {
  private element!: HTMLDivElement;
  private attackTypeSelect!: HTMLSelectElement;
  private customDropdown!: HTMLDivElement;
  private selectedOption!: HTMLDivElement;
  private customValueInput!: HTMLInputElement;
  private jsonBodyPathInput!: HTMLInputElement;
  private jsonBodyPathContainer!: HTMLDivElement;
  private jsonPathSelectorButton!: HTMLButtonElement;
  private jsonPathSelectorContainer!: HTMLDivElement;
  private jsonErrorMessage!: HTMLDivElement;
  private isDragging: boolean = false;
  private dragOffset: DragOffset = { x: 0, y: 0 };
  private readonly options: DialogOptions;
  private escapeListener: (e: KeyboardEvent) => void;
  private enterListener: (e: KeyboardEvent) => void;
  private currentAttackType: AttackType = "query";
  private isJsonSelectorVisible: boolean = false;
  private isValidJson: boolean = true;

  constructor(options: DialogOptions) {
    this.options = options;

    const cachedValues = this.loadFromCache();
    const initialValues = options.initialValues || cachedValues || {};

    this.currentAttackType = initialValues.attackType || "query";

    this.createDialog();
    this.setupEventListeners();

    this.applyInitialValues(initialValues);

    this.escapeListener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (this.isJsonSelectorVisible) {
          this.toggleJsonPathSelector(false);
        } else {
          this.handleCancel();
        }
      }
    };
    this.enterListener = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) this.handleSubmit();
    };

    this.validateJson(this.options.jsonBody);
  }

  private loadFromCache(): Partial<DialogResult> | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.error('Error loading cached dialog values:', e);
      return null;
    }
  }

  private saveToCache(values: Partial<DialogResult>): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(values));
    } catch (e) {
      console.error('Error saving dialog values to cache:', e);
    }
  }

  private applyInitialValues(values: Partial<DialogResult>): void {
    if (values.attackType) {
      this.currentAttackType = values.attackType;
      this.updateAttackTypeUI(values.attackType);
    }

    if (values.customValue && this.customValueInput) {
      this.customValueInput.value = values.customValue;
    }

    if (values.jsonBodyPath && this.jsonBodyPathInput) {
      this.jsonBodyPathInput.value = values.jsonBodyPath;
    }

    this.onSelectChange();
  }

  private updateAttackTypeUI(attackType: AttackType): void {
    if (!this.selectedOption || !this.attackTypeSelect) return;

    this.attackTypeSelect.value = attackType;

    const option = this.customDropdown.querySelector(`.custom-option[data-value="${attackType}"]`);
    if (option) {
      this.selectedOption.innerHTML = option.innerHTML;
    }
  }

  private createDialog(): void {
    this.element = document.createElement("div");
    this.element.className = "paramfinder-dialog";
    this.element.innerHTML = `
        <div class="popup-header">
          <div class="popup-title">Advanced Scan</div>
          <button class="close-button">×</button>
        </div>
        <div class="popup-body">
          <div class="option-group">
            <label class="option-label" for="custom-value">
              Custom parameter value
              <div class="tooltip">
                <span class="tooltip-icon">?</span>
                <span class="tooltip-text">A random value will be added to the end of this value</span>
              </div>
            </label>
            <input type="text" id="custom-value" class="option-input" placeholder="Optional custom value" autocomplete="off" />
          </div>

          <div class="option-group json-body-path-container">
            <label class="option-label" for="json-body-path">
              JSON body path
              <div class="tooltip">
                <span class="tooltip-icon">?</span>
                <span class="tooltip-text">The path to the JSON body to be used for the attack. It follows the JSONPath syntax.</span>
              </div>
            </label>
            <div class="input-with-button">
              <input type="text" id="json-body-path" class="option-input" placeholder="e.g. $.data.user" autocomplete="off" />
              <button type="button" class="json-path-selector-button" title="Select JSON path">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2">
                  <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M8 10l4-4 4 4" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 6v12" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M8 14l4 4 4-4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            <div class="json-error-message" style="display: none;">Invalid JSON: Unable to parse the JSON body</div>
          </div>

          <div class="json-path-selector-container" style="display: none;">
            <div class="json-path-selector-header">
              <div class="json-path-selector-title">Select JSON Path</div>
              <button class="json-path-selector-close">×</button>
            </div>
            <div class="json-path-selector-content"></div>
          </div>
        </div>
        <div class="popup-footer">
          <div class="attack-type-container">
            <div class="custom-select">
              <div class="selected-option">
                <svg class="icon-svg" viewBox="0 0 24 24" width="14" height="14">
                  <path d="M4 17v2h16v-2H4zM4 5v2h16V5H4zm4 6v2h8v-2H8z"/>
                </svg>
                Query
              </div>
              <div class="custom-options">
                <div class="custom-option" data-value="query">
                  <svg class="icon-svg" viewBox="0 0 24 24" width="14" height="14">
                    <path d="M4 17v2h16v-2H4zM4 5v2h16V5H4zm4 6v2h8v-2H8z"/>
                  </svg>
                  Query
                </div>
                <div class="custom-option" data-value="headers">
                  <svg class="icon-svg" viewBox="0 0 24 24" width="14" height="14">
                    <path d="M2 5h20v2H2V5zm0 6h20v2H2v-2zm0 6h20v2H2v-2z"/>
                  </svg>
                  Headers
                </div>
                <div class="custom-option" data-value="body">
                  <svg class="icon-svg" viewBox="0 0 24 24" width="14" height="14">
                    <path d="M3 3v18h18V3H3zm16 16H5V5h14v14z"/>
                    <path d="M7 7h10v10H7z"/>
                  </svg>
                  Body
                </div>
              </div>
            </div>
            <select class="attack-type-select" style="display: none;">
              <option value="query">Query</option>
              <option value="headers">Headers</option>
              <option value="body">Body</option>
            </select>
          </div>
          <button class="run-button">
            <span>Run</span>
          </button>
        </div>
      `;

    this.initializeElements();
    this.onSelectChange();
  }

  private initializeElements(): void {
    this.attackTypeSelect = this.element.querySelector(".attack-type-select") as HTMLSelectElement;
    this.customDropdown = this.element.querySelector(".custom-select") as HTMLDivElement;
    this.selectedOption = this.element.querySelector(".selected-option") as HTMLDivElement;
    this.customValueInput = this.element.querySelector("#custom-value") as HTMLInputElement;
    this.jsonBodyPathInput = this.element.querySelector("#json-body-path") as HTMLInputElement;
    this.jsonBodyPathContainer = this.element.querySelector(".json-body-path-container") as HTMLDivElement;
    this.jsonPathSelectorButton = this.element.querySelector(".json-path-selector-button") as HTMLButtonElement;
    this.jsonPathSelectorContainer = this.element.querySelector(".json-path-selector-container") as HTMLDivElement;
    this.jsonErrorMessage = this.element.querySelector(".json-error-message") as HTMLDivElement;

    if (this.jsonPathSelectorContainer) {
      this.jsonPathSelectorContainer.style.maxHeight = '0';
      this.jsonPathSelectorContainer.style.opacity = '0';
    }
  }

  private validateJson(jsonString: string): boolean {
    try {
      if (typeof jsonString !== 'string' || jsonString.trim() === '') {
        throw new Error('Empty or invalid JSON string');
      }

      JSON.parse(jsonString);
      this.isValidJson = true;

      if (this.jsonErrorMessage) {
        this.jsonErrorMessage.style.display = 'none';
      }

      if (this.jsonPathSelectorButton) {
        this.jsonPathSelectorButton.disabled = false;
        this.jsonPathSelectorButton.title = 'Select JSON path';
      }

      return true;
    } catch (error) {
      this.isValidJson = false;

      if (this.jsonErrorMessage) {
        this.jsonErrorMessage.style.display = 'block';
        this.jsonErrorMessage.textContent = `Invalid JSON: ${(error as Error).message}`;
      }

      if (this.jsonPathSelectorButton) {
        this.jsonPathSelectorButton.disabled = true;
        this.jsonPathSelectorButton.title = 'Cannot select path: Invalid JSON';
      }

      return false;
    }
  }

  private onSelectChange(): void {
    const isBodyAttack = this.currentAttackType === "body";
    this.jsonBodyPathContainer.style.display = isBodyAttack ? "flex" : "none";

    if (isBodyAttack) {
      this.jsonBodyPathInput.focus();
      this.jsonPathSelectorButton.style.display = "flex";
      this.jsonPathSelectorButton.style.alignItems = "center";
      this.jsonPathSelectorButton.style.justifyContent = "center";
      this.jsonPathSelectorButton.style.opacity = "1";
      this.jsonBodyPathInput.style.paddingRight = "30px";

      if (!this.isValidJson) {
        this.jsonErrorMessage.style.display = 'block';
      }
    } else {
      this.jsonErrorMessage.style.display = 'none';
    }
  }

  private setupEventListeners(): void {
    this.setupDragListeners();
    this.setupDropdownListeners();
    this.setupButtonListeners();
    this.setupJsonPathSelector();
    this.setupInputListeners();
  }

  private setupDragListeners(): void {
    this.element.addEventListener("mousedown", this.handleDragStart);
    document.addEventListener("mousemove", this.handleDrag);
    document.addEventListener("mouseup", this.handleDragEnd);
  }

  private setupDropdownListeners(): void {
    this.selectedOption.addEventListener("click", this.handleDropdownToggle);

    document.addEventListener("click", (e) => {
      if (!this.customDropdown.contains(e.target as Node)) {
        this.closeDropdown();
      }
    });

    const options = this.customDropdown.querySelectorAll(".custom-option");
    options.forEach((option) => {
      option.addEventListener("click", () => this.handleOptionSelect(option));
    });
  }

  private handleDropdownToggle = (e: MouseEvent): void => {
    e.stopPropagation();
    const options = this.customDropdown.querySelector(
      ".custom-options"
    ) as HTMLDivElement;

    const isVisible = options.classList.contains("show");
    options.classList.toggle("show");

    if (!isVisible) {
      this.positionDropdown(options);
    }
  };

  private positionDropdown(dropdown: HTMLDivElement): void {
    setTimeout(() => {
      const rect = dropdown.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (rect.bottom + 80 > viewportHeight) {
        dropdown.style.top = "auto";
        dropdown.style.bottom = "calc(100% + 4px)";
      } else {
        dropdown.style.top = "calc(100% + 4px)";
        dropdown.style.bottom = "auto";
      }
    }, 0);
  }

  private closeDropdown(): void {
    const options = this.customDropdown.querySelector(
      ".custom-options"
    ) as HTMLDivElement;
    options.classList.remove("show");
  }

  private handleOptionSelect(option: Element): void {
    const value = option.getAttribute("data-value") as
      | "query"
      | "headers"
      | "body";
    this.selectedOption.innerHTML = option.innerHTML;
    this.currentAttackType = value as AttackType;

    this.attackTypeSelect.value = value;
    this.closeDropdown();
    this.onSelectChange();

    if (value === "body") {
      this.validateJson(this.options.jsonBody);
    }

    const currentValues = this.getCurrentValues();
    this.saveToCache(currentValues);
  }

  private getCurrentValues(): DialogResult {
    return {
      attackType: this.currentAttackType,
      customValue: this.customValueInput.value || undefined,
      jsonBodyPath: this.jsonBodyPathInput.value || undefined
    };
  }

  private setupButtonListeners(): void {
    const runButton = this.element.querySelector(".run-button");
    const closeButton = this.element.querySelector(".close-button");

    if (!runButton || !closeButton) {
      throw new Error("Required buttons not found");
    }

    runButton.addEventListener("click", () => this.handleSubmit());
    closeButton.addEventListener("click", () => this.handleCancel());
  }

  private handleDragStart = (e: MouseEvent): void => {
    if (this.isInteractiveElement(e.target as HTMLElement)) return;

    const rect = this.element.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    this.isDragging = true;
  };

  private isInteractiveElement(element: HTMLElement): boolean {
    return (
      element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLButtonElement ||
      element.classList.contains("custom-option") ||
      element.classList.contains("selected-option") ||
      element.classList.contains("json-path-selector-button") ||
      element.closest(".json-path-selector-container") !== null
    );
  }

  private handleDrag = (e: MouseEvent): void => {
    if (!this.isDragging) return;

    e.preventDefault();
    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;

    this.element.style.transform = "none";
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
  };

  private handleDragEnd = (): void => {
    this.isDragging = false;
  };

  private handleSubmit(): void {
    const data: DialogResult = {
      attackType: this.currentAttackType as AttackType,
      customValue: this.customValueInput.value || undefined,
    };

    if (data.attackType === "body") {
      if (!this.isValidJson) {
        this.jsonErrorMessage.classList.add('json-error-message-highlight');
        setTimeout(() => {
          this.jsonErrorMessage.classList.remove('json-error-message-highlight');
        }, 1500);
        return;
      }

      if (this.jsonBodyPathInput.value) {
        data.jsonBodyPath = this.jsonBodyPathInput.value;
      }
    }

    this.saveToCache({
      attackType: data.attackType,
      customValue: data.customValue,
      jsonBodyPath: data.jsonBodyPath
    });

    this.toggleJsonPathSelector(false);
    this.options.onSubmit?.(data);
    this.destroy();
  }

  private handleCancel(): void {
    this.toggleJsonPathSelector(false);
    this.options.onCancel?.();
    this.destroy();
  }

  private setupJsonPathSelector(): void {
    this.jsonPathSelectorButton.addEventListener("click", (e) => {
      e.preventDefault();

      if (this.isValidJson) {
        this.toggleJsonPathSelector(true);
      }
    });

    const closeButton = this.jsonPathSelectorContainer.querySelector(".json-path-selector-close");
    if (closeButton) {
      closeButton.addEventListener("click", () => this.toggleJsonPathSelector(false));
    }

    if (this.isValidJson) {
      this.createJsonTree();
    }
  }

  private toggleJsonPathSelector(show: boolean): void {
    if (show && !this.isJsonSelectorVisible) {
      if (!this.isValidJson) {
        this.jsonErrorMessage.classList.add('json-error-message-highlight');
        setTimeout(() => {
          this.jsonErrorMessage.classList.remove('json-error-message-highlight');
        }, 1500);
        return;
      }

      this.jsonPathSelectorContainer.style.maxHeight = '0';
      this.jsonPathSelectorContainer.style.display = 'flex';
      this.jsonPathSelectorContainer.style.opacity = '0';

      void this.jsonPathSelectorContainer.offsetHeight;

      this.jsonPathSelectorContainer.style.maxHeight = '300px';
      this.jsonPathSelectorContainer.style.opacity = '1';
      this.isJsonSelectorVisible = true;

      setTimeout(() => {
        const firstLevelExpanders = this.jsonPathSelectorContainer.querySelectorAll(
          ".json-tree-container > .json-tree-row > .json-tree-key > .json-tree-expander"
        );
        firstLevelExpanders.forEach((expander) => {
          if (expander.textContent === "▶") {
            (expander as HTMLElement).click();
          }
        });
      }, 50);
    } else if (!show && this.isJsonSelectorVisible) {
      this.jsonPathSelectorContainer.style.maxHeight = '0';
      this.jsonPathSelectorContainer.style.opacity = '0';

      setTimeout(() => {
        this.jsonPathSelectorContainer.style.display = 'none';
        this.isJsonSelectorVisible = false;
      }, 200);
    }
  }
  private createJsonTree(): void {
    const content = this.jsonPathSelectorContainer.querySelector(".json-path-selector-content");
    if (!content) return;

    try {
      const jsonTree = this.buildJsonTree(this.options.jsonBody);
      content.innerHTML = '';
      content.appendChild(jsonTree);
    } catch (error) {
      const errorElement = document.createElement("div");
      errorElement.className = "json-tree-error";
      errorElement.textContent = `Error parsing JSON: ${(error as Error).message}`;
      content.textContent = '';
      content.appendChild(errorElement);
    }
  }

  private buildJsonTree(json: any, path: string = "$", level: number = 0): HTMLElement {
    const container = document.createElement("div");
    container.className = "json-tree-container";

    if (typeof json === "string") {
      try {
        const value = JSON.parse(json);
        return this.buildJsonTree(value, path, level);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        const errorElement = document.createElement("div");
        errorElement.className = "json-tree-error";
        errorElement.textContent = `Error parsing JSON: ${(error as Error).message}`;
        container.appendChild(errorElement);
        return container;
      }
    }

    if (typeof json === "object" && json !== null) {
      const isArray = Array.isArray(json);
      const keys = Object.keys(json);

      keys.forEach(key => {
        const value = json[key];
        const currentPath = isArray ? `${path}[${key}]` : `${path}.${key}`;
        const row = document.createElement("div");
        row.className = "json-tree-row";
        row.style.paddingLeft = `${level * 16}px`;

        const isExpandable = typeof value === "object" && value !== null;

        const keyElement = document.createElement("div");
        keyElement.className = "json-tree-key";

        const expanderElement = document.createElement("span");
        expanderElement.className = isExpandable ? "json-tree-expander" : "json-tree-spacer";
        expanderElement.textContent = isExpandable ? "▶" : "";
        keyElement.appendChild(expanderElement);

        const keyTextElement = document.createElement("span");
        keyTextElement.className = "json-tree-key-text";
        const keyText = document.createTextNode(`${key}${isArray ? '' : ':'}`);
        keyTextElement.appendChild(keyText);
        keyElement.appendChild(keyTextElement);

        if (isExpandable) {
          const typeIndicator = document.createElement("span");
          typeIndicator.className = "json-tree-type-indicator";
          typeIndicator.textContent = isArray ? "[]" : "{}";
          keyElement.appendChild(typeIndicator);
        }

        const rowContent = document.createElement("div");
        rowContent.className = "json-tree-row-content";
        rowContent.setAttribute("data-path", currentPath);
        rowContent.appendChild(keyElement);

        rowContent.addEventListener("click", (e) => {
          if ((e.target as HTMLElement).classList.contains("json-tree-expander")) {
            return;
          }
          this.selectJsonPath(currentPath);
        });

        if (isExpandable) {
          expanderElement.addEventListener("click", (e) => {
            e.stopPropagation();

            const isExpanded = expanderElement.textContent === "▼";
            expanderElement.textContent = isExpanded ? "▶" : "▼";

            const childContainer = row.querySelector(".json-tree-container");
            if (childContainer) {
              (childContainer as HTMLElement).style.display = isExpanded ? "none" : "block";
            }
          });
        }

        row.appendChild(rowContent);

        if (!isExpandable) {
          const valueElement = document.createElement("div");
          valueElement.className = "json-tree-value";

          const valueSpan = document.createElement("span");
          if (typeof value === "string") {
            valueSpan.className = "json-tree-string";
            valueSpan.textContent = `"${value}"`;
          } else if (typeof value === "number") {
            valueSpan.className = "json-tree-number";
            valueSpan.textContent = String(value);
          } else if (typeof value === "boolean") {
            valueSpan.className = "json-tree-boolean";
            valueSpan.textContent = String(value);
          } else if (value === null) {
            valueSpan.className = "json-tree-null";
            valueSpan.textContent = "null";
          }

          valueElement.appendChild(valueSpan);
          rowContent.appendChild(valueElement);
        } else {
          const childContainer = this.buildJsonTree(value, currentPath, level + 1);
          childContainer.style.display = "none";
          row.appendChild(childContainer);
        }

        container.appendChild(row);
      });
    }

    return container;
  }

  private selectJsonPath(path: string): void {
    this.jsonBodyPathInput.value = path;
    this.toggleJsonPathSelector(false);
    this.jsonBodyPathInput.focus();
  }

  public show(): this {
    document.body.appendChild(this.element);
    document.addEventListener("keydown", this.escapeListener);
    document.addEventListener("keydown", this.enterListener);

    if (this.currentAttackType === "body" && this.jsonBodyPathInput.value) {
      this.jsonBodyPathInput.focus();
    } else {
      this.customValueInput.focus();
    }

    if (this.currentAttackType === "body") {
      this.validateJson(this.options.jsonBody);
    }

    return this;
  }

  public destroy(): void {
    document.removeEventListener("mousemove", this.handleDrag);
    document.removeEventListener("mouseup", this.handleDragEnd);
    document.removeEventListener("keydown", this.escapeListener);
    document.removeEventListener("keydown", this.enterListener);

    this.element.remove();
  }

  public static clearCache(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (e) {
      console.error('Error clearing dialog cache:', e);
    }
  }

  private setupInputListeners(): void {
    this.customValueInput.addEventListener('input', this.handleInputChange);
    this.jsonBodyPathInput.addEventListener('input', this.handleInputChange);
  }

  private handleInputChange = (): void => {
    const currentValues = this.getCurrentValues();
    this.saveToCache(currentValues);
  };
}
