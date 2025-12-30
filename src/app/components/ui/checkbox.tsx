"use client";

import * as React from "react";
import CheckboxMui from "@mui/material/Checkbox";
import CheckIcon from "@mui/icons-material/Check";
import RemoveIcon from "@mui/icons-material/Remove";

import { cn } from "./utils";

type CheckedState = boolean | "indeterminate";

function Checkbox({
  className,
  ...props
}: Omit<React.ComponentProps<typeof CheckboxMui>, "checked" | "onChange"> & {
  checked?: CheckedState;
  onCheckedChange?: (checked: CheckedState) => void;
}) {
  const { checked, onCheckedChange, ...rest } = props;
  const isIndeterminate = checked === "indeterminate";
  const isChecked = typeof checked === "boolean" ? checked : false;
  const controlProps =
    checked === undefined ? {} : { checked: isChecked, indeterminate: isIndeterminate };

  return (
    <CheckboxMui
      data-slot="checkbox"
      {...controlProps}
      onChange={(_, nextChecked) => onCheckedChange?.(nextChecked)}
      className={cn("size-4 shrink-0", className)}
      icon={
        <span
          className="checkbox-box"
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            border: "1px solid var(--border)",
            background: "var(--input-background)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            display: "inline-block",
          }}
        />
      }
      checkedIcon={
        <span
          className="checkbox-box"
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            border: "1px solid var(--primary)",
            background: "var(--primary)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--primary-foreground)",
            lineHeight: 0,
          }}
        >
          <CheckIcon sx={{ fontSize: 14 }} />
        </span>
      }
      indeterminateIcon={
        <span
          className="checkbox-box"
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            border: "1px solid var(--primary)",
            background: "var(--primary)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--primary-foreground)",
            lineHeight: 0,
          }}
        >
          <RemoveIcon sx={{ fontSize: 14 }} />
        </span>
      }
      sx={{
        padding: 0,
        "&.Mui-focusVisible .checkbox-box": {
          boxShadow:
            "0 0 0 3px color-mix(in srgb, var(--ring) 50%, transparent), 0 1px 2px rgba(0,0,0,0.05)",
        },
      }}
      {...rest}
    />
  );
}

export { Checkbox };
