"use client";

export interface PickerOption {
  value: string;
  label: string;
}

interface SegmentedPickerProps {
  value: string;
  options: PickerOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function SegmentedPicker({ value, options, onChange, disabled = false }: SegmentedPickerProps) {
  return (
    <div className="segmented-picker" role="group">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`segmented-picker-btn${value === opt.value ? " active" : ""}`}
          onClick={() => onChange(opt.value)}
          disabled={disabled}
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
