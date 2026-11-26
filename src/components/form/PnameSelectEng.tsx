"use client";

import { useId } from "react";
import { ChevronDown, UserRound } from "lucide-react";

import { PNAME_OPTIONS_ENG } from "@/utils/pnameOptions";

// ======================================================
// TYPES
// ======================================================

interface PnameSelectEngProps {
  value: string;
  onChange: (value: string) => void;

  disabled?: boolean;
  required?: boolean;
  error?: string;

  placeholder?: string;
  id?: string;
  name?: string;

  showIcon?: boolean;
  className?: string;
}

// ======================================================
// COMPONENT
// ======================================================

export default function PnameSelectEng({
  value,
  onChange,
  disabled = false,
  required = false,
  error,
  placeholder = "Select title",
  id,
  name = "ac_pname_eng",
  showIcon = false,
  className = "",
}: PnameSelectEngProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  // รองรับข้อมูลเดิมที่ไม่อยู่ในตัวเลือก
  const isExistingCustomValue =
    value.trim() !== "" &&
    !PNAME_OPTIONS_ENG.some((option) => option.value === value);

  return (
    <div className={`relative w-full ${className}`}>
      {/* OPTIONAL ICON */}
      {showIcon && (
        <UserRound
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute top-3.5 left-3.5 z-10 text-indigo-500 dark:text-indigo-300"
        />
      )}

      {/* SELECT */}
      <select
        id={selectId}
        name={name}
        value={value}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${selectId}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`h-11 w-full appearance-none rounded-xl border bg-white pr-10 text-sm font-medium text-gray-900 transition duration-200 outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-950/60 dark:text-white ${showIcon ? "pl-10" : "pl-3.5"} ${
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500"
            : "border-gray-200 hover:border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500/10 dark:border-gray-700 dark:hover:border-indigo-500"
        } `}
      >
        <option value="">{placeholder}</option>

        {PNAME_OPTIONS_ENG.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}

        {/* ค่าเดิมที่ไม่มีอยู่ในรายการ */}
        {isExistingCustomValue && (
          <option value={value}>{value} (ข้อมูลเดิม)</option>
        )}
      </select>

      {/* DROPDOWN ICON */}
      <ChevronDown
        size={17}
        aria-hidden="true"
        className="pointer-events-none absolute top-3.5 right-3.5 text-gray-400 dark:text-gray-500"
      />

      {/* ERROR MESSAGE */}
      {error && (
        <p
          id={`${selectId}-error`}
          className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
