import "./dialog.css";

interface DialogOptions {
  title: string;
  onSubmit?: (value: string) => void;
  onCancel?: () => void;
  onValidate?: (value: string) => boolean;
  initialValue?: string;
}

interface DragOffset {
  x: number;
  y: number;
}

export class CustomDialog {
  private element!: HTMLDivElement;
  private input!: HTMLInputElement;
  private isDragging: boolean = false;
  private dragOffset: DragOffset = { x: 0, y: 0 };
  private readonly options: DialogOptions;
  private escapeListener: (e: KeyboardEvent) => void;

  constructor(options: DialogOptions = { title: "Default title" }) {
    this.options = options;
    this.createDialog();
    this.setupEventListeners();
    this.escapeListener = (e: KeyboardEvent) => {
      if (e.key === "Escape") this.handleCancel();
    };
  }

  private createDialog(): void {
    this.element = document.createElement("div");
    this.element.className = "popup";
    this.element.innerHTML = `
        <div class="popup-header">
          <div class="popup-title">${this.options.title}</div>
          <button class="close-button">×</button>
        </div>
        <div class="popup-content">
          <div class="input-container">
            <span class="cursor">></span>
            <input type="text" value="${this.options.initialValue || ""}" />
          </div>
          <button class="submit-button">⏎</button>
        </div>
      `;

    const inputElement = this.element.querySelector("input");
    if (!inputElement) throw new Error("Input element not found");
    this.input = inputElement;
  }

  private setupEventListeners(): void {
    // Dragging
    this.element.addEventListener("mousedown", this.handleDragStart);
    document.addEventListener("mousemove", this.handleDrag);
    document.addEventListener("mouseup", this.handleDragEnd);

    // Input validation
    this.input.addEventListener("input", this.handleInput);

    // Submit and cancel
    const submitButton = this.element.querySelector(".submit-button");
    const closeButton = this.element.querySelector(".close-button");

    if (!submitButton || !closeButton) {
      throw new Error("Required buttons not found");
    }

    submitButton.addEventListener("click", () => this.handleSubmit());
    closeButton.addEventListener("click", () => this.handleCancel());

    this.input.addEventListener("keypress", (e: KeyboardEvent) => {
      if (e.key === "Enter") this.handleSubmit();
    });
  }

  private handleDragStart = (e: MouseEvent): void => {
    if (e.target instanceof HTMLInputElement) return;

    const rect = this.element.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    this.isDragging = true;
  };

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

  private handleInput = (): void => {
    const isValid = this.validateInput(this.input.value);
    this.input.classList.toggle("invalid", !isValid && this.input.value !== "");
  };

  private validateInput(value: string): boolean {
    if (!value.trim()) return true;

    if (this.options.onValidate) {
      return this.options.onValidate(value);
    }

    return true;
  }

  private handleSubmit(): void {
    if (this.validateInput(this.input.value)) {
      this.options.onSubmit?.(this.input.value);
      this.destroy();
    }
  }

  private handleCancel(): void {
    this.options.onCancel?.();
    this.destroy();
  }

  public show(): this {
    document.body.appendChild(this.element);
    document.addEventListener("keydown", this.escapeListener);
    this.input.focus();
    if (this.input.value) {
      this.input.setSelectionRange(this.input.value.length, this.input.value.length);
    }
    return this;
  }

  public destroy(): void {
    document.removeEventListener("mousemove", this.handleDrag);
    document.removeEventListener("mouseup", this.handleDragEnd);
    document.removeEventListener("keydown", this.escapeListener);
    this.element.remove();
  }
}
