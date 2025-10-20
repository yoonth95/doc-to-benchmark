import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsClamped } from "@/hooks/useClampled";

interface ClampedTextCellProps {
  text: string;
}

const ClampedTextCell = ({ text }: ClampedTextCellProps) => {
  const [expanded, setExpanded] = useState(false);
  const { ref, clamped } = useIsClamped<HTMLDivElement>([text, expanded]);

  if (!text?.trim()) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={ref} className={cn("whitespace-pre-wrap text-sm text-foreground", expanded ? "" : "line-clamp-3")}>
        {text}
      </div>
      {(clamped || expanded) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 shrink-0 px-2"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          {expanded ? "간략히" : "더보기"}
        </Button>
      )}
    </div>
  );
};

export default ClampedTextCell;
