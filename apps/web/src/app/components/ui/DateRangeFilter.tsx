import { format, isValid, parseISO } from "date-fns";
import { Calendar } from "lucide-react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useMemo, useState } from "react";
import { localDateTimeToISO } from "../../utilities/date";

export type DateRangeValue = {
  start: string | null;
  end: string | null;
};

type DateRangeFilterProps = {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
};

const toDateInput = (value: string | null) => {
  if (!value) return "";
  const date = parseISO(value);
  return isValid(date) ? format(date, "yyyy-MM-dd") : "";
};

const toTimeInput = (value: string | null, fallback: string) => {
  if (!value) return fallback;
  const date = parseISO(value);
  return isValid(date) ? format(date, "HH:mm") : fallback;
};

const DateRangeFilter = ({ value, onChange }: DateRangeFilterProps) => {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(toDateInput(value.start));
  const [endDate, setEndDate] = useState(toDateInput(value.end));
  const [startTime, setStartTime] = useState(toTimeInput(value.start, "00:00"));
  const [endTime, setEndTime] = useState(toTimeInput(value.end, "23:59"));

  const selectedRange = useMemo<DateRange | undefined>(() => {
    const from = startDate ? new Date(`${startDate}T00:00:00`) : undefined;
    const to = endDate ? new Date(`${endDate}T00:00:00`) : undefined;
    return from || to ? { from, to } : undefined;
  }, [endDate, startDate]);

  const label =
    value.start && value.end
      ? `${format(parseISO(value.start), "EEE, MMM d, yyyy HH:mm")} - ${format(
          parseISO(value.end),
          "EEE, MMM d, yyyy HH:mm",
        )}`
      : "";

  const apply = () => {
    onChange({
      start: localDateTimeToISO(startDate, startTime),
      end: localDateTimeToISO(endDate || startDate, endTime),
    });
    setOpen(false);
  };

  const clear = () => {
    setStartDate("");
    setEndDate("");
    setStartTime("00:00");
    setEndTime("23:59");
    onChange({ start: null, end: null });
    setOpen(false);
  };

  return (
    <div className="data-container wb-date-range">
      <button
        type="button"
        className="wb-date-range-trigger"
        onClick={() => setOpen((next) => !next)}
      >
        <Calendar size={16} aria-hidden="true" />
        <span>{label || "Select date & time"}</span>
      </button>
      {value.start || value.end ? (
        <button
          className="reset_val"
          type="button"
          onClick={clear}
          aria-label="Clear date range"
        >
          x
        </button>
      ) : null}
      {open ? (
        <div className="wb-date-range-popup">
          <DayPicker
            mode="range"
            selected={selectedRange}
            onSelect={(range) => {
              setStartDate(range?.from ? format(range.from, "yyyy-MM-dd") : "");
              setEndDate(range?.to ? format(range.to, "yyyy-MM-dd") : "");
            }}
            disabled={{ after: new Date() }}
          />
          <div className="wb-date-range-times">
            <label>
              Start
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </label>
            <label>
              End
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </label>
          </div>
          <div className="wb-date-range-actions">
            <button type="button" onClick={clear}>
              Clear
            </button>
            <button type="button" onClick={apply} disabled={!startDate}>
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DateRangeFilter;
