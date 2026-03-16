"use client";

import { useEffect, useState } from "react";

interface TimeRange {
  open: number;
  close: number;
}

type DaySchedule = TimeRange[] | null;

type WeekSchedule = {
  sun: DaySchedule;
  mon: DaySchedule;
  tue: DaySchedule;
  wed: DaySchedule;
  thu: DaySchedule;
  fri: DaySchedule;
  sat: DaySchedule;
};

interface SchedulePeriod {
  label: string;
  start: string;
  end: string;
}

interface LocationConfig {
  name: string;
  schedules: {
    period: string;
    hours: WeekSchedule | Record<string, DaySchedule>;
  }[];
}

const h = (hour: number, min = 0) => hour * 60 + min;

const PERIODS: SchedulePeriod[] = [
  { label: "regular-1", start: "2026-01-13", end: "2026-03-05" },
  { label: "spring-break", start: "2026-03-06", end: "2026-03-15" },
  { label: "regular-2", start: "2026-03-16", end: "2026-04-01" },
  { label: "april-break", start: "2026-04-02", end: "2026-04-06" },
  { label: "regular-3", start: "2026-04-07", end: "2026-05-06" },
  { label: "end-of-semester", start: "2026-05-07", end: "2026-05-18" },
];

const weekday = (sched: DaySchedule): WeekSchedule => ({
  sun: null, mon: sched, tue: sched, wed: sched, thu: sched, fri: sched, sat: null,
});

const daily = (sched: DaySchedule): WeekSchedule => ({
  sun: sched, mon: sched, tue: sched, wed: sched, thu: sched, fri: sched, sat: sched,
});

const LOCATIONS: LocationConfig[] = [
  {
    name: "Davis Café",
    schedules: [
      {
        period: "regular",
        hours: {
          sun: [{ open: h(11), close: h(24) }],
          mon: [{ open: h(7, 30), close: h(24) }],
          tue: [{ open: h(7, 30), close: h(24) }],
          wed: [{ open: h(7, 30), close: h(24) }],
          thu: [{ open: h(7, 30), close: h(24) }],
          fri: [{ open: h(7, 30), close: h(24) }],
          sat: [{ open: h(11), close: h(24) }],
        },
      },
      {
        period: "spring-break",
        hours: {
          "2026-03-06": [{ open: h(7, 30), close: h(21) }],
          "2026-03-07": [{ open: h(9), close: h(19) }],
          "2026-03-08": [{ open: h(9), close: h(19) }],
          "2026-03-09": [{ open: h(9), close: h(19) }],
          "2026-03-10": [{ open: h(9), close: h(19) }],
          "2026-03-11": [{ open: h(9), close: h(19) }],
          "2026-03-12": [{ open: h(9), close: h(19) }],
          "2026-03-13": [{ open: h(9), close: h(19) }],
          "2026-03-14": [{ open: h(9), close: h(19) }],
          "2026-03-15": [{ open: h(9), close: h(24) }],
        },
      },
      {
        period: "april-break",
        hours: {
          "2026-04-02": [{ open: h(7, 30), close: h(21) }],
          "2026-04-03": [{ open: h(9), close: h(20) }],
          "2026-04-04": [{ open: h(9), close: h(20) }],
          "2026-04-05": [{ open: h(9), close: h(20) }],
          "2026-04-06": [{ open: h(9), close: h(24) }],
        },
      },
      {
        period: "end-of-semester",
        hours: {
          "2026-05-07": [{ open: h(7, 30), close: h(24) }],
          "2026-05-08": [{ open: h(7, 30), close: h(24) }],
          "2026-05-09": [{ open: h(11), close: h(24) }],
          "2026-05-10": [{ open: h(11), close: h(24) }],
          "2026-05-11": [{ open: h(7, 30), close: h(24) }],
          "2026-05-12": [{ open: h(7, 30), close: h(24) }],
          "2026-05-13": [{ open: h(7, 30), close: h(21) }],
          "2026-05-14": [{ open: h(7, 30), close: h(19) }],
          "2026-05-15": [{ open: h(10), close: h(19) }],
          "2026-05-16": [{ open: h(10), close: h(19) }],
          "2026-05-17": [{ open: h(8), close: h(12) }],
          "2026-05-18": null,
        },
      },
    ],
  },
  {
    name: "Qdoba",
    schedules: [
      {
        period: "regular",
        hours: daily([{ open: h(11), close: h(21) }]),
      },
      {
        period: "spring-break",
        hours: {
          "2026-03-06": null,
          "2026-03-07": null,
          "2026-03-08": null,
          "2026-03-09": null,
          "2026-03-10": null,
          "2026-03-11": null,
          "2026-03-12": null,
          "2026-03-13": null,
          "2026-03-14": null,
          "2026-03-15": [{ open: h(16), close: h(21) }],
        },
      },
      {
        period: "april-break",
        hours: {
          "2026-04-02": null,
          "2026-04-03": null,
          "2026-04-04": null,
          "2026-04-05": null,
          "2026-04-06": [{ open: h(16), close: h(21) }],
        },
      },
      {
        period: "end-of-semester",
        hours: {
          "2026-05-07": [{ open: h(11), close: h(21) }],
          "2026-05-08": [{ open: h(11), close: h(21) }],
          "2026-05-09": [{ open: h(11), close: h(21) }],
          "2026-05-10": [{ open: h(11), close: h(21) }],
          "2026-05-11": [{ open: h(11), close: h(21) }],
          "2026-05-12": [{ open: h(11), close: h(21) }],
          "2026-05-13": null,
        },
      },
    ],
  },
  {
    name: "Chick-fil-A",
    schedules: [
      {
        period: "regular",
        hours: {
          sun: null,
          mon: [{ open: h(11), close: h(21) }],
          tue: [{ open: h(11), close: h(21) }],
          wed: [{ open: h(11), close: h(21) }],
          thu: [{ open: h(11), close: h(21) }],
          fri: [{ open: h(11), close: h(21) }],
          sat: [{ open: h(11), close: h(21) }],
        },
      },
      {
        period: "spring-break",
        hours: {
          "2026-03-06": [{ open: h(11), close: h(21) }],
          "2026-03-07": null,
          "2026-03-08": null,
          "2026-03-09": null,
          "2026-03-10": null,
          "2026-03-11": null,
          "2026-03-12": null,
          "2026-03-13": null,
          "2026-03-14": null,
          "2026-03-15": null,
        },
      },
      {
        period: "april-break",
        hours: {
          "2026-04-02": [{ open: h(11), close: h(21) }],
          "2026-04-03": null,
          "2026-04-04": null,
          "2026-04-05": null,
          "2026-04-06": [{ open: h(11), close: h(21) }],
        },
      },
      {
        period: "end-of-semester",
        hours: {
          "2026-05-07": [{ open: h(11), close: h(21) }],
          "2026-05-08": [{ open: h(11), close: h(21) }],
          "2026-05-09": [{ open: h(11), close: h(21) }],
          "2026-05-10": null,
          "2026-05-11": [{ open: h(11), close: h(21) }],
          "2026-05-12": [{ open: h(11), close: h(21) }],
          "2026-05-13": null,
        },
      },
    ],
  },
  {
    name: "Wildcat Den",
    schedules: [
      {
        period: "regular",
        hours: weekday([{ open: h(11), close: h(14) }]),
      },
      {
        period: "spring-break",
        hours: {
          "2026-03-06": [{ open: h(11), close: h(14) }],
          "2026-03-07": null,
          "2026-03-08": null,
          "2026-03-09": null,
          "2026-03-10": null,
          "2026-03-11": null,
          "2026-03-12": null,
          "2026-03-13": null,
          "2026-03-14": null,
          "2026-03-15": null,
        },
      },
      {
        period: "april-break",
        hours: {
          "2026-04-02": [{ open: h(11), close: h(14) }],
          "2026-04-03": null,
          "2026-04-04": null,
          "2026-04-05": null,
          "2026-04-06": null,
        },
      },
      {
        period: "end-of-semester",
        hours: {
          "2026-05-07": [{ open: h(11), close: h(14) }],
          "2026-05-08": [{ open: h(11), close: h(14) }],
          "2026-05-09": null,
        },
      },
    ],
  },
];

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getCurrentPeriodLabel(dateStr: string): string {
  for (const p of PERIODS) {
    if (dateStr >= p.start && dateStr <= p.end) return p.label;
  }
  return "off-season";
}

function getTodaySchedule(location: LocationConfig, now: Date): DaySchedule {
  const dateStr = toDateStr(now);
  const periodLabel = getCurrentPeriodLabel(dateStr);
  const dayIdx = now.getDay();
  const dayKey: keyof WeekSchedule = DAY_KEYS[dayIdx] as keyof WeekSchedule;

  for (const sched of location.schedules) {
    if (sched.period === "regular" && periodLabel.startsWith("regular")) {
      const week = sched.hours as WeekSchedule;
      return week[dayKey] ?? null;
    }

    if (sched.period === periodLabel) {
      const hours = sched.hours as Record<string, DaySchedule>;
      if (dateStr in hours) return hours[dateStr] ?? null;
      if (dayKey in hours) return hours[dayKey] ?? null;
      return null;
    }
  }

  return null;
}

function formatTime(minutes: number): string {
  const hr = Math.floor(minutes / 60);
  const min = minutes % 60;
  const ampm = hr >= 12 ? "PM" : "AM";
  const display = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
  return min === 0 ? `${display} ${ampm}` : `${display}:${String(min).padStart(2, "0")} ${ampm}`;
}

function formatRanges(ranges: TimeRange[]): string {
  return ranges
    .map((r) => {
      if (r.close === h(24)) return `${formatTime(r.open)} – Midnight`;
      return `${formatTime(r.open)} – ${formatTime(r.close)}`;
    })
    .join(", ");
}

interface LocationStatus {
  name: string;
  isOpen: boolean;
  hoursText: string;
}

function getLocationStatus(location: LocationConfig, now: Date): LocationStatus {
  const schedule = getTodaySchedule(location, now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (!schedule || schedule.length === 0) {
    return { name: location.name, isOpen: false, hoursText: "Closed Today" };
  }

  const isOpen = schedule.some((r) => currentMinutes >= r.open && currentMinutes < r.close);

  return {
    name: location.name,
    isOpen,
    hoursText: formatRanges(schedule),
  };
}

export function DiningHours() {
  const [statuses, setStatuses] = useState<LocationStatus[]>([]);

  useEffect(() => {
    function refresh() {
      const now = new Date();
      setStatuses(LOCATIONS.map((loc) => getLocationStatus(loc, now)));
    }

    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (statuses.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="font-serif text-xl font-bold mb-4">Dining Right Now</h2>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(14rem, 1fr))" }}>
        {statuses.map((s) => (
          <div key={s.name} className="card card-hover" style={{ padding: "1.25rem" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-serif font-bold text-sm">{s.name}</span>
              <span
                className="pill"
                style={{
                  backgroundColor: s.isOpen ? "#d1fae5" : "#e5e7eb",
                  color: s.isOpen ? "#064e3b" : "#1f2937",
                }}
              >
                {s.isOpen ? "Open" : "Closed"}
              </span>
            </div>
            <p className="text-xs text-muted">{s.hoursText}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
