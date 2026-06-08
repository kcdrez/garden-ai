import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { fetchCalendarPlants } from '@/api/plants';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { QueryState } from '@/components/ui/query-state';
import PlantingGantt from '@/components/calendar/PlantingGantt';

export default function CalendarPage() {
  const [year, setYear] = useState(() => new Date().getFullYear());

  const { data: plants = [], isLoading, error } = useQuery({
    queryKey: queryKeys.calendar.byYear(year),
    queryFn: () => fetchCalendarPlants(year),
  });

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-6">
        <h1>Planting Calendar</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setYear((y) => y - 1)} aria-label="Previous year">
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="text-lg font-semibold w-16 text-center">{year}</span>
          <Button variant="ghost" size="icon" onClick={() => setYear((y) => y + 1)} aria-label="Next year">
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={plants.length === 0}
        emptyMessage={`No plants with a start date in ${year}.`}
      >
        <PlantingGantt plants={plants} year={year} />
      </QueryState>
    </div>
  );
}
