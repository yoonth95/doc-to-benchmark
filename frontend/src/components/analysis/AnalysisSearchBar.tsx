import { Search } from "lucide-react";
import type { ChangeEvent, ReactNode } from "react";

import { Input } from "@/components/ui/input";

interface AnalysisSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: ReactNode;
}

const AnalysisSearchBar = ({
  value,
  onChange,
  placeholder = "파일명, 저장 이름 또는 문서 ID로 검색...",
  icon = <Search className="h-5 w-5 text-muted-foreground" />,
}: AnalysisSearchBarProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>
      <Input value={value} onChange={handleChange} placeholder={placeholder} className="pl-10" />
    </div>
  );
};

export default AnalysisSearchBar;
