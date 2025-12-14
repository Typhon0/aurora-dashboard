import { useId } from "react";
import {
  AlertCircle,
  Info,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";

export type AlertVariant = "info" | "warning" | "error" | "success";
export type AlertTone = "solid" | "soft" | "outline" | "subtle";

const variantIcon: Record<AlertVariant, JSX.Element> = {
  info: <Info className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  error: <AlertCircle className="h-4 w-4" />,
  success: <CheckCircle2 className="h-4 w-4" />,
};

function buildStyles(variant: AlertVariant, tone: AlertTone) {
  const base =
    "relative flex w-full items-start gap-3 overflow-hidden rounded-md backdrop-blur-sm surface-glass";
  const palette: Record<AlertVariant, { fg: string; bg: string; ring: string; soft: string; subtle: string } > = {
    info: {
      fg: "text-primary",
      bg: "bg-primary text-primary-foreground",
      ring: "border border-primary/30",
      soft: "bg-primary/10 text-primary",
      subtle: "bg-primary/5 text-primary",
    },
    warning: {
      fg: "text-yellow-400",
      bg: "bg-yellow-500 text-yellow-950",
      ring: "border border-yellow-400/40",
      soft: "bg-yellow-500/10 text-yellow-400",
      subtle: "bg-yellow-500/5 text-yellow-400",
    },
    error: {
      fg: "text-red-400",
      bg: "bg-red-500 text-red-50",
      ring: "border border-red-400/40",
      soft: "bg-red-500/10 text-red-400",
      subtle: "bg-red-500/5 text-red-400",
    },
    success: {
      fg: "text-emerald-400",
      bg: "bg-emerald-500 text-emerald-50",
      ring: "border border-emerald-400/40",
      soft: "bg-emerald-500/10 text-emerald-400",
      subtle: "bg-emerald-500/5 text-emerald-400",
    },
  };
  const p = palette[variant];
  switch (tone) {
    case "solid":
      return `${base} ${p.bg}`;
    case "outline":
      return `${base} ${p.ring} ${p.fg}`;
    case "subtle":
      return `${base} ${p.subtle}`;
    case "soft":
    default:
      return `${base} ${p.soft}`;
  }
}

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  tone?: AlertTone;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  dense?: boolean;
  onDismiss?: () => void;
  action?: React.ReactNode;
  ariaLive?: "polite" | "assertive" | "off";
}

export function Alert({
  variant = "info",
  tone = "soft",
  title,
  description,
  icon,
  className,
  children,
  dense = false,
  onDismiss,
  action,
  ariaLive = variant === "error" ? "assertive" : "polite",
  ...rest
}: AlertProps) {
  const titleId = useId();
  const descId = useId();

  const style = buildStyles(variant, tone);
  const spacing = dense ? "px-3 py-2" : "px-4 py-3";

  return (
    <div
      role="alert"
      aria-live={ariaLive}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description || children ? descId : undefined}
      className={`${style} ${spacing} ${className ?? ""}`}
      {...rest}
    >
      <div className="shrink-0 mt-0.5 opacity-90">{icon ?? variantIcon[variant]}</div>
      <div className="flex-1 min-w-0 space-y-1">
        {title && (
          <div
            id={titleId}
            className="text-xs font-semibold tracking-wide uppercase opacity-90 leading-none"
          >
            {title}
          </div>
        )}
        {(description || children) && (
          <div id={descId} className="text-sm text-white/80 leading-snug">
            {description}
            {children}
          </div>
        )}
      </div>
      {(action || onDismiss) && (
        <div className="flex items-start gap-2 ml-2">
          {action}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
