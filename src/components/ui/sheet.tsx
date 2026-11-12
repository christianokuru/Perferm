"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { CloseIcon } from "@/components/icons";
import { lockScroll } from "@/lib/smooth-scroll";
import { cn } from "@/lib/utils";

import { IconButton } from "./icon-button";

type Side = "right" | "left" | "bottom" | "center" | "full";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Visually hide the built-in header (e.g. when the content renders its own). */
  hideHeader?: boolean;
  side?: Side;
  className?: string;
  children: ReactNode;
  footer?: ReactNode;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

const panelBySide: Record<Side, string> = {
  right: "inset-y-0 right-0 w-full max-w-[440px] animate-sheet-in rounded-l-[var(--radius-card)]",
  left: "inset-y-0 left-0 w-full max-w-[440px] animate-[sheet-in_0.45s_var(--ease-silk)_reverse_both] rounded-r-[var(--radius-card)]",
  bottom: "inset-x-0 bottom-0 max-h-[88dvh] animate-sheet-up rounded-t-[20px]",
  center:
    "top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 animate-fade-up rounded-[var(--radius-card)]",
  full: "inset-0 animate-fade-in",
};

/**
 * Accessible modal surface: focus trap, Escape to close, scroll lock,
 * focus restoration and `aria-modal`. Used for the bag, search, menu, filters.
 */
export function Sheet({ open, onClose, title, hideHeader, side = "right", className, children, footer }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const unlockScroll = lockScroll();

    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!focusable.length) return;
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      unlockScroll();
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <div aria-hidden="true" className="absolute inset-0 animate-fade-in bg-ink/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn("absolute flex flex-col overflow-hidden bg-white", panelBySide[side], className)}
      >
        {hideHeader ? null : (
          <div className="flex items-center justify-between border-b border-mist px-5 py-3 md:px-6">
            <h2 className="text-subheading font-light text-ink">{title}</h2>
            <IconButton label="Close" onClick={onClose} className="-mr-2">
              <CloseIcon />
            </IconButton>
          </div>
        )}
        <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
        {footer ? <div className="safe-bottom border-t border-mist px-5 pt-4 md:px-6">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
