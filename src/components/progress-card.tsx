"use client";

import { AlertCircle, Check } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export type StepStatus =
  | "pending"
  | "in_progress"
  | "complete"
  | "error"
  | "warning";

export type Step = {
  id: string;
  title: string;
  description?: string;
  status: StepStatus;
};

type StepIndicatorProps = {
  status: StepStatus;
  isFinal?: boolean;
};

function AnimatedClock({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="12"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
      width="12"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="12" y2="7" />
      <line
        className="animate-[spin_2s_linear_infinite] motion-reduce:animate-none"
        style={{ transformOrigin: "12px 12px" }}
        x1="12"
        x2="15"
        y1="12"
        y2="13"
      />
    </svg>
  );
}

const BASE_CLASSES =
  "relative z-[1] flex h-5 w-5 items-center justify-center rounded-full";

function getIndicatorConfig(status: StepStatus, isFinal: boolean) {
  switch (status) {
    case "complete":
      return {
        className: `${BASE_CLASSES} animate-[circle-reveal_0.2s_cubic-bezier(0.165,0.84,0.44,1)_forwards] motion-reduce:animate-none ${
          isFinal ? "bg-tertiary-fixed-dim" : "bg-on-surface"
        }`,
        icon: "check",
        iconClassName:
          "opacity-0 animate-[icon-pop_0.15s_cubic-bezier(0.165,0.84,0.44,1)_0.05s_forwards] motion-reduce:animate-none motion-reduce:opacity-100 text-surface-container-lowest",
      } as const;
    case "in_progress":
      return {
        className: `${BASE_CLASSES} border-2 border-outline-variant bg-surface-container-lowest`,
        icon: null,
        iconClassName: null,
      } as const;
    case "error":
      return {
        className: `${BASE_CLASSES} bg-error`,
        icon: "error",
        iconClassName: "text-on-error",
      } as const;
    case "warning":
      return {
        className: `${BASE_CLASSES} bg-secondary-fixed`,
        icon: "clock",
        iconClassName: "text-on-secondary-fixed",
      } as const;
    default:
      return {
        className: `${BASE_CLASSES} border-2 border-outline-variant bg-surface-container-lowest`,
        icon: null,
        iconClassName: null,
      } as const;
    }
}

function StepIndicator({ status, isFinal = false }: StepIndicatorProps) {
  const { className, icon, iconClassName } = getIndicatorConfig(
    status,
    isFinal
  );
  const showSpinner = status === "in_progress" || status === "complete";
  const isComplete = status === "complete";

  return (
    <div className="relative h-5 w-5">
      {showSpinner ? (
        <div
          className={`absolute inset-0 z-[2] h-5 w-5 animate-spin rounded-full border-2 border-outline-variant border-t-secondary bg-surface-container-lowest transition-opacity duration-300 ease-out will-change-transform motion-reduce:animate-none ${
            isComplete ? "opacity-0" : "opacity-100"
          }`}
        />
      ) : null}
      <div className={className}>
        {icon === "clock" ? (
          <AnimatedClock className={iconClassName ?? ""} />
        ) : null}
        {icon === "check" ? (
          <Check className={iconClassName ?? ""} size={14} strokeWidth={3} />
        ) : null}
        {icon === "error" ? (
          <AlertCircle
            className={iconClassName ?? ""}
            size={14}
            strokeWidth={2.5}
          />
        ) : null}
      </div>
    </div>
  );
}

function getTitleClassName(status: StepStatus) {
  switch (status) {
    case "error":
      return "text-error";
    case "warning":
      return "text-secondary";
    case "complete":
      return "text-on-surface/60";
    default:
      return "text-on-surface-variant";
  }
}

type ProgressCardProps = {
  steps: Step[];
};

export function ProgressCard({ steps = [] }: ProgressCardProps) {
  const allComplete =
    steps.length > 0 && steps.every((item) => item.status === "complete");

  return (
    <Card className="w-full max-w-[380px] border-outline-variant/40 bg-surface-container-lowest/90 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_60px_rgba(0,0,0,0.16)] backdrop-blur-sm">
      <CardContent className="flex flex-col p-4">
        <div className="flex flex-col gap-1">
          {steps.map((item, index) => {
            const isHighlighted =
              item.status === "in_progress" ||
              item.status === "error" ||
              item.status === "warning";
            const showDescription = isHighlighted && item.description;
            const isFinal = index === steps.length - 1 && allComplete;
            const isLastStep = index === steps.length - 1;

            return (
              <div
                className="relative flex items-start gap-3 rounded-xl p-3 transition-colors duration-200"
                key={item.id}
              >
                {!isLastStep ? (
                  <div
                    className={`pointer-events-none absolute left-[23px] top-9 h-[calc(100%-16px)] w-px transition-colors duration-200 ${
                      item.status === "complete"
                        ? "bg-on-surface"
                        : "bg-outline-variant"
                    }`}
                  />
                ) : null}

                <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                  <StepIndicator isFinal={isFinal} status={item.status} />
                </div>

                <div className="flex min-h-6 flex-col gap-0.5 pt-0.5">
                  <span
                    className={`text-[0.9375rem] font-medium transition-colors duration-200 ${getTitleClassName(
                      item.status
                    )} ${
                      item.status === "in_progress"
                        ? "animate-shimmer bg-[length:200%_100%] bg-[linear-gradient(90deg,var(--color-on-surface-variant)_0%,var(--color-on-surface-variant)_40%,var(--color-on-surface)_50%,var(--color-on-surface-variant)_60%,var(--color-on-surface-variant)_100%)] bg-clip-text [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] motion-reduce:animate-none motion-reduce:bg-none motion-reduce:[-webkit-text-fill-color:var(--color-on-surface)]"
                        : ""
                    }`}
                  >
                    {item.title}
                  </span>
                  {item.description ? (
                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-250 ease-[cubic-bezier(0.165,0.84,0.44,1)] ${
                        showDescription
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <span className="overflow-hidden text-[0.8125rem] text-on-surface-variant">
                        {item.description}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
