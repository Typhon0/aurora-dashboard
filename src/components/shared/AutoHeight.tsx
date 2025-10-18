import { useRef, useState, useLayoutEffect } from "react";

export interface AutoHeightProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  duration?: number; // ms
  onCollapseComplete?: () => void;
  immediate?: boolean; // if true skip first animation
}

// A light rewrite inspired by upstream but simplified for shadcn/tailwind
export function AutoHeight({
  isOpen,
  duration = 300,
  onCollapseComplete,
  className,
  style,
  children,
  immediate = false,
  ...rest
}: AutoHeightProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [renderChildren, setRenderChildren] = useState(isOpen);
  const first = useRef(true);
  const animating = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (first.current) {
      first.current = false;
      if (immediate) return;
    }

    // Expand
    if (isOpen) {
      setRenderChildren(true);
      requestAnimationFrame(() => {
        if (!el) return;
        animating.current = true;
        el.style.height = "0px";
        el.style.overflow = "hidden";
        el.style.transition = `height ${duration}ms ease`;
        const target = el.scrollHeight;
        el.style.height = target + "px";
        timeoutRef.current = window.setTimeout(() => {
          if (!el) return;
            el.style.height = "auto";
            el.style.overflow = "visible";
            el.style.transition = "";
            animating.current = false;
            timeoutRef.current = null;
        }, duration);
      });
    } else {
      // Collapse
      if (!renderChildren) return; // already collapsed
      requestAnimationFrame(() => {
        if (!el) return;
        animating.current = true;
        const current = el.scrollHeight;
        el.style.height = current + "px";
        el.style.overflow = "hidden";
        el.style.transition = `height ${duration}ms ease`;
        // next frame collapse
        requestAnimationFrame(() => {
          if (!el) return;
          el.style.height = "0px";
        });
        timeoutRef.current = window.setTimeout(() => {
          setRenderChildren(false);
          animating.current = false;
          timeoutRef.current = null;
          onCollapseComplete?.();
        }, duration);
      });
    }

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isOpen, duration, onCollapseComplete, renderChildren, immediate]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...style, height: isOpen && !animating.current ? "auto" : undefined }}
      {...rest}
    >
      {renderChildren ? children : null}
    </div>
  );
}
