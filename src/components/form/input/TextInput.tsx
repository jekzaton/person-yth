"use client";

import {
  forwardRef,
  useRef,
  useImperativeHandle,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { CalendarDays } from "lucide-react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: ReactNode;
  error?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(
    {
      leadingIcon,
      error = false,
      className = "",
      type = "text",
      onClick,
      ...props
    },
    forwardedRef,
  ) {
    const localRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(forwardedRef, () => localRef.current!);

    const isDate = type === "date";

    const openPicker = () => {
      const input = localRef.current;

      if (!input || input.disabled) return;

      try {
        input.showPicker?.();
      } catch {
        input.focus();
      }
    };

    return (
      <div className="relative">
        {!isDate && leadingIcon && (
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400">
            {leadingIcon}
          </span>
        )}

        <input
          {...props}
          ref={localRef}
          type={type}
          aria-invalid={error}
          onClick={(event) => {
            onClick?.(event);

            if (isDate && !event.defaultPrevented) {
              openPicker();
            }
          }}
          className={[
            "block w-full min-w-0 rounded-xl border",
            "bg-white px-3.5 py-3 text-sm text-gray-800",
            "transition outline-none",
            "focus:border-blue-500 focus:ring-4",
            "focus:ring-blue-500/10",
            "dark:bg-gray-950 dark:text-white",
            "dark:border-gray-700",
            !isDate && leadingIcon ? "pl-10" : "",
            isDate ? "cursor-pointer pr-12 dark:[color-scheme:dark]" : "",
            error ? "border-red-400 dark:border-red-500" : "border-gray-200",
            className,
          ].join(" ")}
        />

        {isDate && (
          <button
            type="button"
            onClick={openPicker}
            aria-label="เลือกวันที่"
            disabled={props.disabled}
            className="absolute inset-y-0 right-2 flex items-center justify-center rounded-lg px-2 text-gray-400 transition hover:text-blue-600 disabled:opacity-50 dark:hover:text-blue-400"
          >
            <CalendarDays size={19} />
          </button>
        )}
      </div>
    );
  },
);

TextInput.displayName = "TextInput";
