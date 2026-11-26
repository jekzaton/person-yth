"use client";

import { useId } from "react";
import { ChevronDown, UserRound } from "lucide-react";

import { PNAME_OPTIONS } from "@/utils/pnameOptions";

interface PnameSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  placeholder?: string;
  id?: string;
  name?: string;
  showIcon?: boolean;
}

export default function PnameSelect({
  value,
  onChange,
  disabled = false,
  required = false,
  error,
  placeholder = "เลือกคำนำหน้า",
  id,
  name = "ac_pname",
  showIcon = false,
}: PnameSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  // รองรับข้อมูลคำนำหน้าเดิมที่ไม่อยู่ในตัวเลือก
  const isExistingCustomValue =
    value.trim() !== "" && !PNAME_OPTIONS.some((item) => item.value === value);

  return (
    <div className="relative w-full">
      {showIcon && (
        <UserRound
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute top-3.5 left-3.5 z-10 text-indigo-500 dark:text-indigo-300"
        />
      )}

      <select
        id={selectId}
        name={name}
        value={value}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        className={`h-11 w-full appearance-none rounded-xl border bg-white pr-10 text-sm font-medium text-gray-900 transition duration-200 outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-950/60 dark:text-white ${
          showIcon ? "pl-10" : "pl-3.5"
        } ${
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500"
            : "border-gray-200 hover:border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500/10 dark:border-gray-700 dark:hover:border-indigo-500"
        } `}
      >
        <option value="">{placeholder}</option>

        {PNAME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}

        {isExistingCustomValue && (
          <option value={value}>{value} (ข้อมูลเดิม)</option>
        )}
      </select>

      <ChevronDown
        size={17}
        aria-hidden="true"
        className="pointer-events-none absolute top-3.5 right-3.5 text-gray-400 dark:text-gray-500"
      />
    </div>
  );
}
