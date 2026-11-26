"use client";

import { useId } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";

import { ACCOUNT_ROLE_OPTIONS, type AccountRole } from "@/utils/roleOptions";

interface AccountRoleSelectProps {
  value: AccountRole;
  onChange: (value: AccountRole) => void;

  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  showDescription?: boolean;
}

export default function AccountRoleSelect({
  value,
  onChange,
  id,
  name = "ac_role",
  disabled = false,
  required = true,
  error,
  className = "",
  showDescription = true,
}: AccountRoleSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  const selectedRole = ACCOUNT_ROLE_OPTIONS.find(
    (item) => item.value === value,
  );

  return (
    <div className={`w-full min-w-0 ${className}`}>
      <div className="relative">
        <ShieldCheck
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute top-3.5 left-3.5 z-10 text-indigo-500 dark:text-indigo-300"
        />

        <select
          id={selectId}
          name={name}
          value={value}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value as AccountRole)}
          className={`h-11 w-full appearance-none rounded-xl border bg-white pr-10 pl-11 text-sm font-semibold text-slate-800 transition-all duration-200 outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-950/60 dark:text-white ${
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
              : "border-slate-200 hover:border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500/10 dark:border-slate-700"
          } `}
        >
          {ACCOUNT_ROLE_OPTIONS.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label} ({role.value})
            </option>
          ))}
        </select>

        <ChevronDown
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute top-3.5 right-3.5 text-slate-400 dark:text-slate-500"
        />
      </div>

      {showDescription && selectedRole && (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 dark:from-blue-500/10 dark:to-indigo-500/10">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-indigo-500" />

          <p className="text-xs leading-relaxed text-indigo-700 dark:text-indigo-300">
            {selectedRole.description}
          </p>
        </div>
      )}
    </div>
  );
}
