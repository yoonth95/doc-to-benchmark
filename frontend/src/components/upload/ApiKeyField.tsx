import type { ChangeEvent } from "react";

import { Input } from "@/components/ui/input";

interface ApiKeyFieldProps {
  value: string;
  onChange: (value: string) => void;
  inputId?: string;
  label?: string;
  placeholder?: string;
}

const ApiKeyField = ({
  value,
  onChange,
  inputId = "api-key",
  label = "OCR API Key 입력",
  placeholder = "Solar Pro2 / Upstage API Key",
}: ApiKeyFieldProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold">{label}</h3>
      <Input
        id={inputId}
        type="password"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="min-w-0 flex-1"
        aria-label="OCR API Key"
      />
    </div>
  );
};

export default ApiKeyField;
