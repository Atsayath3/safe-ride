import React, { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface EnhancedDatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
  minYear?: number;
  maxYear?: number;
}

const EnhancedDatePicker: React.FC<EnhancedDatePickerProps> = ({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className,
  minYear = 1900,
  maxYear = new Date().getFullYear(),
}) => {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value || new Date());

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from(
    { length: maxYear - minYear + 1 }, 
    (_, i) => maxYear - i
  );

  const handleYearChange = (year: string) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(parseInt(year));
    setViewDate(newDate);
  };

  const handleMonthChange = (monthIndex: string) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(parseInt(monthIndex));
    setViewDate(newDate);
  };

  const handleDateSelect = (date: Date | undefined) => {
    onChange?.(date);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between text-left font-normal bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700",
            !value && "text-slate-500",
            className
          )}
        >
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-slate-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-slate-800 border border-slate-700 shadow-lg rounded-lg" align="start">
        <div className="p-3 border-b bg-slate-700 border-slate-600">
          <div className="flex items-center justify-between space-x-2">
            <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-32 h-8 text-sm bg-slate-800 border-slate-600 text-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {months.map((month, index) => (
                  <SelectItem key={index} value={index.toString()} className="text-slate-300 focus:bg-slate-700 focus:text-slate-200">
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={currentYear.toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-20 h-8 text-sm bg-slate-800 border-slate-600 text-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-48 bg-slate-800 border-slate-600">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()} className="text-slate-300 focus:bg-slate-700 focus:text-slate-200">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateSelect}
          disabled={disabled}
          month={viewDate}
          onMonthChange={setViewDate}
          initialFocus
          className="rounded-md border-0 bg-slate-800"
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center text-slate-300",
            caption_label: "text-sm font-medium text-slate-300",
            nav: "space-x-1 flex items-center",
            nav_button: "h-7 w-7 bg-slate-700 border border-slate-600 p-0 text-slate-300 hover:bg-slate-600 rounded-md",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-slate-400 rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
            day: "h-9 w-9 p-0 font-normal text-slate-300 hover:bg-slate-700 rounded-md aria-selected:bg-blue-600 aria-selected:text-white",
            day_selected: "bg-blue-600 text-white hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white",
            day_today: "bg-slate-700 text-slate-200 font-medium",
            day_outside: "text-slate-500 opacity-50",
            day_disabled: "text-slate-600 opacity-50",
            day_hidden: "invisible",
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

export default EnhancedDatePicker;
