"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

export type ConfirmDialogOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmDialogProps = ConfirmDialogOptions & {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ open, title = "Xác nhận", message, confirmLabel = "Xác nhận", cancelLabel = "Hủy", destructive = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancelRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = cancelRef.current?.closest<HTMLElement>("[role=dialog]");
      const controls = dialog?.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled)");
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    addEventListener("keydown", handleKeyDown);
    return () => {
      removeEventListener("keydown", handleKeyDown);
      previous?.focus();
    };
  }, [onCancel, open]);

  if (!open) return null;

  return <div className="dialog-backdrop" role="presentation" onMouseDown={onCancel}>
    <section role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="dialog confirm-dialog" onMouseDown={(event) => event.stopPropagation()}>
      <h2 id={titleId}>{title}</h2>
      <p id={descriptionId}>{message}</p>
      <div className="actions">
        <button ref={cancelRef} className="secondary" type="button" onClick={onCancel}>{cancelLabel}</button>
        <button className={destructive ? "danger" : "button"} type="button" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </section>
  </div>;
}

export function useConfirmDialog() {
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);
  const confirm = useCallback((next: ConfirmDialogOptions) => new Promise<boolean>((resolve) => {
    resolverRef.current?.(false);
    resolverRef.current = resolve;
    setOptions(next);
  }), []);
  const close = useCallback((confirmed: boolean) => {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setOptions(null);
  }, []);
  useEffect(() => () => resolverRef.current?.(false), []);
  const dialog = options ? <ConfirmDialog open {...options} onConfirm={() => close(true)} onCancel={() => close(false)} /> : null;
  return { confirm, dialog, open: !!options };
}
