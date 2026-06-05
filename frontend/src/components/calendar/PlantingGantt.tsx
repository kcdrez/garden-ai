import { Link } from 'react-router-dom';
import type { CalendarPlant, ObservationType, UserPlantStatus } from '@/types/plants';
import { routes } from '@/lib/routes';
import { STATUS_BAR_CLASSES, statusLabel } from '@/lib/plants';

interface Props {
  plants: CalendarPlant[];
  year: number;
}

const EVENT_DOT: Partial<Record<ObservationType, { dot: string; label: string }>> = {
  harvest:   { dot: 'bg-emerald-500', label: 'Harvest' },
  transplant:{ dot: 'bg-sky-500',     label: 'Transplant' },
  pest:      { dot: 'bg-orange-500',  label: 'Pest' },
  disease:   { dot: 'bg-red-600',     label: 'Disease' },
  weather:   { dot: 'bg-cyan-400',    label: 'Weather' },
  general:   { dot: 'bg-violet-400',  label: 'Note' },
};

const REMOVED_DOT = { dot: STATUS_BAR_CLASSES.removed, label: 'Removed' };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dateToPercent(dateStr: string, year: number): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const ms = new Date(y, m - 1, d).getTime();
  const yearStart = new Date(year, 0, 1).getTime();
  const yearEnd = new Date(year + 1, 0, 1).getTime();
  return ((ms - yearStart) / (yearEnd - yearStart)) * 100;
}

function monthLeft(year: number, month: number): number {
  const yearStart = new Date(year, 0, 1).getTime();
  const yearEnd = new Date(year + 1, 0, 1).getTime();
  return ((new Date(year, month, 1).getTime() - yearStart) / (yearEnd - yearStart)) * 100;
}

function removalDate(plant: CalendarPlant): string | null {
  return plant.observations
    .filter((o) => o.type === 'status_change' && o.newStatus === 'removed')
    .map((o) => o.observedDate)
    .sort()
    .at(-1) ?? null;
}

function barBounds(plant: CalendarPlant, year: number): { start: number; end: number } {
  const start = Math.max(0, dateToPercent(plant.startDate, year));
  const removal = removalDate(plant);
  let end: number;
  if (removal) {
    end = Math.min(100, dateToPercent(removal, year));
  } else if (new Date().getFullYear() === year) {
    end = Math.min(100, dateToPercent(new Date().toISOString().slice(0, 10), year));
  } else {
    end = 100;
  }
  return { start, end: Math.max(start + 0.8, end) };
}

interface Segment {
  start: string;
  end: string | null; // null = open-ended (extends to bar end)
  status: UserPlantStatus;
}

function buildSegments(plant: CalendarPlant): Segment[] {
  const statusObs = plant.observations
    .filter((o) => o.type === 'status_change' && o.newStatus)
    .sort((a, b) => a.observedDate.localeCompare(b.observedDate));

  if (statusObs.length === 0) {
    return [{ start: plant.startDate, end: null, status: plant.status }];
  }

  return statusObs.map((obs, i) => ({
    start: obs.observedDate,
    end: statusObs[i + 1]?.observedDate ?? null,
    status: obs.newStatus as UserPlantStatus,
  }));
}

interface BedGroup {
  bedId: string;
  bedName: string;
  gardenId: string;
  gardenName: string;
  plants: CalendarPlant[];
}

function groupByBed(plants: CalendarPlant[]): BedGroup[] {
  const map = new Map<string, BedGroup>();
  for (const plant of plants) {
    if (!map.has(plant.bed)) {
      map.set(plant.bed, {
        bedId: plant.bed,
        bedName: plant.bedName,
        gardenId: plant.gardenId,
        gardenName: plant.gardenName,
        plants: [],
      });
    }
    map.get(plant.bed)!.plants.push(plant);
  }
  return Array.from(map.values());
}

const LABEL_W = 'w-44';

export default function PlantingGantt({ plants, year }: Props) {
  const bedGroups = groupByBed(plants);
  const today = new Date();
  const todayPct = today.getFullYear() === year
    ? dateToPercent(today.toISOString().slice(0, 10), year)
    : null;

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="space-y-1.5 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-medium text-foreground w-12 shrink-0">Status</span>
          {(Object.entries(STATUS_BAR_CLASSES) as [UserPlantStatus, string][])
            .filter(([s]) => s !== 'removed')
            .map(([s, cls]) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className={`block w-4 h-3 rounded-sm shrink-0 ${cls}`} />
                {statusLabel(s)}
              </span>
            ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-medium text-foreground w-12 shrink-0">Events</span>
          {(Object.entries(EVENT_DOT) as [ObservationType, { dot: string; label: string }][]).map(([t, { dot, label }]) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className={`block w-3 h-3 rounded-full shrink-0 ${dot}`} />
              {label}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className={`block w-3 h-3 rounded-full shrink-0 ${REMOVED_DOT.dot}`} />
            {REMOVED_DOT.label}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: 600 }}>

          {/* Month header */}
          <div className="flex mb-2">
            <div className={`${LABEL_W} shrink-0`} />
            <div className="flex-1 relative h-4">
              {MONTHS.map((label, i) => (
                <span
                  key={label}
                  className="absolute text-xs text-muted-foreground select-none"
                  style={{ left: `${monthLeft(year, i)}%` }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Bed groups */}
          {bedGroups.map((group) => (
            <div key={group.bedId}>
              {/* Bed heading */}
              <div className="flex items-center gap-2 mt-4 mb-0.5">
                <div className={`${LABEL_W} shrink-0`} />
                <div className="flex-1 border-t border-border" />
              </div>
              <div className="flex mb-1">
                <div className={`${LABEL_W} shrink-0`} />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <Link to={routes.gardenDetail(group.gardenId)} className="hover:underline">
                    {group.gardenName}
                  </Link>
                  {' · '}
                  <Link to={routes.bedDetail(group.gardenId, group.bedId)} className="hover:underline">
                    {group.bedName}
                  </Link>
                </span>
              </div>

              {/* Plant rows */}
              {group.plants.map((plant) => {
                const { start, end } = barBounds(plant, year);
                const removal = removalDate(plant);
                const removalInYear = removal?.startsWith(String(year)) ? removal : null;
                const events = plant.observations.filter(
                  (o) => o.type !== 'status_change' && o.observedDate.startsWith(String(year)),
                );
                const label = plant.variety
                  ? `${plant.plantName} (${plant.variety})`
                  : plant.plantName;

                return (
                  <div
                    key={plant.id}
                    className="flex items-center py-1 group"
                  >
                    {/* Plant label */}
                    <div className={`${LABEL_W} shrink-0 pr-3`}>
                      <Link
                        to={routes.plantDetail(plant.id)}
                        className="text-sm truncate block hover:underline leading-tight"
                        title={label}
                      >
                        {label}
                      </Link>
                    </div>

                    {/* Timeline track */}
                    <div className="flex-1 relative h-6">
                      {/* Month gridlines */}
                      {MONTHS.map((_, i) => (
                        <div
                          key={i}
                          className="absolute inset-y-0 w-px bg-border"
                          style={{ left: `${monthLeft(year, i)}%` }}
                        />
                      ))}

                      {/* Today line */}
                      {todayPct !== null && (
                        <div
                          className="absolute inset-y-0 w-px bg-red-500/50 z-10"
                          style={{ left: `${todayPct}%` }}
                        />
                      )}

                      {/* Segmented bar */}
                      <div
                        className="absolute top-1.5 bottom-1.5 rounded-sm overflow-hidden flex"
                        style={{ left: `${start}%`, width: `${end - start}%` }}
                      >
                        {buildSegments(plant).map((seg, i) => {
                          const segStart = Math.max(start, Math.min(end, dateToPercent(seg.start, year)));
                          const segEnd = seg.end
                            ? Math.max(start, Math.min(end, dateToPercent(seg.end, year)))
                            : end;
                          const w = ((segEnd - segStart) / (end - start)) * 100;
                          if (w <= 0) return null;
                          return (
                            <div
                              key={i}
                              className={`h-full flex-none hover:brightness-110 transition-[filter] ${STATUS_BAR_CLASSES[seg.status]}`}
                              style={{ width: `${w}%` }}
                              title={statusLabel(seg.status)}
                            />
                          );
                        })}
                      </div>

                      {/* Event dots */}
                      {events.map((obs) => {
                        const meta = EVENT_DOT[obs.type];
                        if (!meta) return null;
                        const pct = Math.max(0, Math.min(100, dateToPercent(obs.observedDate, year)));
                        const title = obs.note ? `${meta.label}: ${obs.note}` : meta.label;
                        return (
                          <div
                            key={obs.id}
                            className={`absolute w-2.5 h-2.5 rounded-full ring-1 ring-background z-20 ${meta.dot}`}
                            style={{ left: `${pct}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
                            title={title}
                          />
                        );
                      })}

                      {/* Removal dot */}
                      {removalInYear && (() => {
                        const pct = Math.max(0, Math.min(100, dateToPercent(removalInYear, year)));
                        return (
                          <div
                            className={`absolute w-2.5 h-2.5 rounded-full ring-1 ring-background z-20 ${REMOVED_DOT.dot}`}
                            style={{ left: `${pct}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
                            title="Removed"
                          />
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
