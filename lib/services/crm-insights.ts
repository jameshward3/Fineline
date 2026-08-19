import type { getAccount } from "@/lib/queries/crm";

export interface StudioInsight {
  kind: "relationship-alert" | "reorder-timing" | "cross-sell";
  message: string;
}

type Account = NonNullable<Awaited<ReturnType<typeof getAccount>>>;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Rule-based account insights, deliberately not framed as "AI" in the UI —
 * these are plain date-math and pattern checks over real account data, not
 * predictions from a model. Purely informational; nothing here writes to
 * the account.
 */
export function buildStudioInsights(account: Account): StudioInsight[] {
  const insights: StudioInsight[] = [];
  const now = Date.now();

  const activityDates = [
    ...account.jobs.map((j) => j.updatedAt),
    ...account.samples.map((s) => s.createdAt),
    ...account.opportunities.map((o) => o.updatedAt),
  ];
  if (activityDates.length > 0) {
    const lastActivity = new Date(Math.max(...activityDates.map((d) => d.getTime())));
    const daysSince = Math.floor((now - lastActivity.getTime()) / DAY_MS);
    if (daysSince >= 60) {
      insights.push({
        kind: "relationship-alert",
        message: `No activity recorded with ${account.name} in ${daysSince} days.`,
      });
    }
  }

  if (account.jobs.length >= 2) {
    const sortedJobDates = [...account.jobs].map((j) => j.createdAt.getTime()).sort((a, b) => a - b);
    const gaps: number[] = [];
    for (let i = 1; i < sortedJobDates.length; i++) {
      gaps.push(sortedJobDates[i] - sortedJobDates[i - 1]);
    }
    const avgGapDays = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length / DAY_MS);
    const daysSinceLastJob = Math.floor((now - sortedJobDates[sortedJobDates.length - 1]) / DAY_MS);
    if (avgGapDays > 0 && daysSinceLastJob >= avgGapDays * 0.8) {
      insights.push({
        kind: "reorder-timing",
        message: `${account.name} typically reorders roughly every ${avgGapDays} days — it has been ${daysSinceLastJob} days since the last order.`,
      });
    }
  }

  const isIndividualLike =
    account.accountType === "FAMILY_HOUSEHOLD" || account.accountType === "INDIVIDUAL" || account.accountType === "LUXURY_RESIDENTIAL";
  if (isIndividualLike && account.monogramProfiles.length === 0 && (account.jobs.length > 0 || account.samples.length > 0)) {
    insights.push({
      kind: "cross-sell",
      message: `${account.name} has ordered before but has no saved monogram profile yet — consider setting one up for faster reorders.`,
    });
  }

  return insights;
}
