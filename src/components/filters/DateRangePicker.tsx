import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type DateRange = { from?: Date; to?: Date };

export function DateRangePicker({
  value,
  onChange,
  className,
}: {
  value: DateRange;
  onChange: (next: DateRange) => void;
  className?: string;
}) {
  const label = React.useMemo(() => {
    if (value?.from && value?.to) return `${format(value.from, "PPP")} – ${format(value.to, "PPP")}`;
    if (value?.from) return `${format(value.from, "PPP")} – …`;
    return "Pick date range";
  }, [value?.from, value?.to]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value?.from && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-50 w-auto bg-popover p-0" align="start">
        <Calendar
          mode="range"
          selected={value as any}
          onSelect={(r: any) => onChange(r ?? {})}
          numberOfMonths={2}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
