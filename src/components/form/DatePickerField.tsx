"use client";

import { useId, useRef } from "react";
import { CalendarDays, X } from "lucide-react";

interface DatePickerFieldProps {
  value: string;
  onChange: (value: string) => void;

  id?: string;
  name?: string;
  placeholder?: string;

  min?: string;
  max?: string;

  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;

  error?: string;
  className?: string;
}

export default function DatePickerField({
  value,
  onChange,
  id,
  name,
  placeholder = "เลือกวันที่",
  min,
  max,
  disabled = false,
  required = false,
  clearable = true,
  error,
  className = "",
}: DatePickerFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    if (disabled) return;

    const input = inputRef.current;
    if (!input) return;

    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
      } else {
        input.focus();
      }
    } catch {
      input.focus();
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div
        className={`relative flex h-11 items-center rounded-xl border bg-white transition focus-within:ring-4 dark:bg-gray-950/60 ${
          error
            ? "border-rose-400 focus-within:border-rose-500 focus-within:ring-rose-500/10"
            : "border-gray-200 focus-within:border-indigo-500 focus-within:ring-indigo-500/10 hover:border-indigo-300 dark:border-gray-700"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          min={min}
          max={max}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          aria-label={placeholder}
          onClick={openPicker}
          className="h-full min-w-0 flex-1 cursor-pointer rounded-xl bg-transparent px-3.5 pr-2 text-sm font-medium text-gray-900 outline-none dark:text-white [&::-webkit-calendar-picker-indicator]:hidden"
        />

        {clearable && value && !disabled && !required && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="ล้างวันที่"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
          >
            <X size={16} />
          </button>
        )}

        <button
          type="button"
          disabled={disabled}
          onClick={openPicker}
          aria-label={placeholder}
          className="flex h-10 w-11 shrink-0 items-center justify-center rounded-r-xl text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed dark:text-indigo-300 dark:hover:bg-indigo-500/10"
        >
          <CalendarDays size={19} />
        </button>
      </div>

      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
