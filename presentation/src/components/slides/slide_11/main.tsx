import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { sponsors, type Sponsor, type SponsorPriority } from "./data/sponsors";

type SortKey = "name" | "donations" | "averageGift" | "lastDonationMonths" | "likelihood" | "priority";

const priorityOrder: Record<SponsorPriority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

function formatCurrency(value: number) {
  return `€${value.toLocaleString("en-US")}`;
}

function priorityClass(priority: SponsorPriority) {
  if (priority === "High") {
    return "border-primary bg-primary text-primary-foreground";
  }

  if (priority === "Medium") {
    return "border-border bg-muted text-foreground";
  }

  return "border-border bg-background text-muted-foreground";
}

function SortIcon({ active, sortDirection }: { active: boolean; sortDirection: 1 | -1 }) {
  if (!active) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m8 9 4-5 4 5" />
        <path d="m8 15 4 5 4-5" />
      </svg>
    );
  }

  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {sortDirection === -1 ? <path d="m6 9 6 6 6-6" /> : <path d="m6 15 6-6 6 6" />}
    </svg>
  );
}

function SortButton({
  activeSortKey,
  label,
  onSort,
  sortDirection,
  value,
}: {
  activeSortKey: SortKey;
  label: string;
  onSort: (value: SortKey) => void;
  sortDirection: 1 | -1;
  value: SortKey;
}) {
  const active = activeSortKey === value;

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1 text-left text-[11px] font-semibold uppercase tracking-[0.12em]",
        active ? "text-primary" : "text-muted-foreground",
      )}
      onClick={() => onSort(value)}
    >
      {label}
      <SortIcon active={active} sortDirection={sortDirection} />
    </button>
  );
}

export function Slide11() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("likelihood");
  const [sortDirection, setSortDirection] = useState<1 | -1>(-1);
  const [openSponsor, setOpenSponsor] = useState<string | null>(null);

  const sponsorTypes = useMemo(
    () => Array.from(new Set(sponsors.map((sponsor) => sponsor.type))).sort(),
    [],
  );

  const filteredSponsors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sponsors.filter((sponsor) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        sponsor.name.toLowerCase().includes(normalizedQuery) ||
        sponsor.type.toLowerCase().includes(normalizedQuery);
      const matchesType = !typeFilter || sponsor.type === typeFilter;
      const matchesPriority =
        !priorityFilter || sponsor.priority === priorityFilter;

      return matchesQuery && matchesType && matchesPriority;
    });
  }, [priorityFilter, query, typeFilter]);

  const sortedSponsors = useMemo(() => {
    return [...filteredSponsors].sort((a, b) => {
      if (sortKey === "name") {
        return sortDirection * a.name.localeCompare(b.name);
      }

      if (sortKey === "priority") {
        return sortDirection * (priorityOrder[a.priority] - priorityOrder[b.priority]);
      }

      return sortDirection * ((b[sortKey] as number) - (a[sortKey] as number));
    });
  }, [filteredSponsors, sortDirection, sortKey]);

  const stats = useMemo(() => {
    const count = sortedSponsors.length;
    const totalGift = sortedSponsors.reduce(
      (sum, sponsor) => sum + sponsor.averageGift,
      0,
    );
    const totalLikelihood = sortedSponsors.reduce(
      (sum, sponsor) => sum + sponsor.likelihood,
      0,
    );

    return {
      totalSponsors: count,
      highPriority: sortedSponsors.filter((sponsor) => sponsor.priority === "High").length,
      averageGift: count ? Math.round(totalGift / count) : 0,
      averageLikelihood: count ? Math.round(totalLikelihood / count) : 0,
    };
  }, [sortedSponsors]);

  function handleSort(nextKey: SortKey) {
    setOpenSponsor(null);
    if (nextKey === sortKey) {
      setSortDirection((current) => (current === -1 ? 1 : -1));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(-1);
  }

  return (
    <section
      className="h-full w-full overflow-hidden bg-background p-8 text-foreground"
      data-capture-arrows
    >
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-4">
        <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div>
            <p className="text-xl font-semibold tracking-[-0.03em]">
              Sponsorship & Fundraising Dashboard
            </p>
            <p className="text-sm text-muted-foreground">
              Special Olympics Belgium
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sponsor..."
              className="h-9 w-52 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All types</option>
              {sponsorTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All priorities</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
        </Card>

        <div className="grid gap-3 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Total sponsors
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-primary">
              {stats.totalSponsors}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              High priority
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-[-0.05em]">
              {stats.highPriority}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Avg contribution
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-[-0.05em]">
              {formatCurrency(stats.averageGift)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Avg likelihood
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-[-0.05em]">
              {stats.averageLikelihood}%
            </p>
          </Card>
        </div>

        <Card className="min-h-0 flex-1 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Sponsor priority list</p>
            <p className="text-xs text-muted-foreground">
              Sort columns. Click a row for history.
            </p>
          </div>
          <div className="no-scrollbar h-full overflow-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-muted">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left"><SortButton activeSortKey={sortKey} label="Sponsor" onSort={handleSort} sortDirection={sortDirection} value="name" /></th>
                  <th className="px-4 py-3 text-center"><SortButton activeSortKey={sortKey} label="Donations" onSort={handleSort} sortDirection={sortDirection} value="donations" /></th>
                  <th className="px-4 py-3 text-right"><SortButton activeSortKey={sortKey} label="Avg Donation" onSort={handleSort} sortDirection={sortDirection} value="averageGift" /></th>
                  <th className="px-4 py-3 text-left"><SortButton activeSortKey={sortKey} label="Last" onSort={handleSort} sortDirection={sortDirection} value="lastDonationMonths" /></th>
                  <th className="px-4 py-3 text-left"><SortButton activeSortKey={sortKey} label="Likelihood" onSort={handleSort} sortDirection={sortDirection} value="likelihood" /></th>
                  <th className="px-4 py-3 text-left"><SortButton activeSortKey={sortKey} label="Priority" onSort={handleSort} sortDirection={sortDirection} value="priority" /></th>
                </tr>
              </thead>
              <tbody>
                {sortedSponsors.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-muted-foreground" colSpan={6}>
                      No sponsors match the filters.
                    </td>
                  </tr>
                ) : (
                  sortedSponsors.map((sponsor) => {
                    const open = openSponsor === sponsor.name;

                    return (
                      <FragmentRow
                        key={sponsor.name}
                        sponsor={sponsor}
                        open={open}
                        onToggle={() =>
                          setOpenSponsor(open ? null : sponsor.name)
                        }
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </section>
  );
}

function FragmentRow({
  sponsor,
  open,
  onToggle,
}: {
  sponsor: Sponsor;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className={cn(
          "cursor-pointer border-b border-border transition-colors hover:bg-muted/70",
          open && "bg-primary/5",
        )}
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <p className={cn("font-semibold", open && "text-primary")}>
            {sponsor.name}
          </p>
          <p className="text-xs text-muted-foreground">{sponsor.type}</p>
        </td>
        <td className="px-4 py-3 text-center font-semibold">{sponsor.donations}</td>
        <td className="px-4 py-3 text-right font-semibold">
          {formatCurrency(sponsor.averageGift)}
        </td>
        <td className="px-4 py-3 text-muted-foreground">{sponsor.lastDonationLabel}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 flex-1 rounded-sm bg-muted">
              <span
                className="block h-2 rounded-sm bg-primary"
                style={{ width: `${sponsor.likelihood}%` }}
              />
            </span>
            <span className="w-9 text-right text-xs font-semibold">
              {sponsor.likelihood}%
            </span>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={cn("rounded-sm border px-2 py-1 text-xs font-semibold", priorityClass(sponsor.priority))}>
            {sponsor.priority}
          </span>
        </td>
      </tr>
      {open ? (
        <tr className="border-b border-border bg-background">
          <td colSpan={6} className="px-4 py-5">
            <div className="grid gap-4">
              <div className="grid gap-5 lg:grid-cols-4">
                <MiniFact label="Total donations" value={String(sponsor.donations)} />
                <MiniFact label="Avg Donation" value={formatCurrency(sponsor.averageGift)} />
                <MiniFact label="Last donated" value={sponsor.lastDonationLabel} />
                <MiniFact label="Likelihood score" value={`${sponsor.likelihood}%`} />
              </div>
              <p className="border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
                {sponsor.note}
              </p>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-semibold tracking-[-0.03em]">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
