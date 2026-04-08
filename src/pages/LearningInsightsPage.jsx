import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import { useSheetStore } from "../store/sheetStore";
import { useAuthStore } from "../store/authStore";
import {
  InsightsHeader,
  KPIStatsRow,
  AttemptsTrendChart,
  ResultDistributionChart,
  MistakeFrequencyChart,
  TopicMasteryChart,
  RevisionTimelineCard,
  WeakAreasCard,
  RecentMistakesCard,
  SuggestionsCard,
} from "../components/insights/InsightsDashboardComponents";

const normalizePlatform = (platform, link) => {
  if (platform) return platform;
  if (!link) return "Unknown";
  if (link.includes("leetcode")) return "LeetCode";
  if (link.includes("codeforces")) return "Codeforces";
  if (link.includes("geeksforgeeks")) return "GeeksforGeeks";
  return "Other";
};

const parseMinutes = (timeLabel) => {
  if (typeof timeLabel === "number") return timeLabel;
  if (!timeLabel || typeof timeLabel !== "string") return 0;
  const match = timeLabel.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
};

const toRevisionDate = (attempt) => {
  if (attempt.revisionDate) return new Date(attempt.revisionDate);
  const base = attempt.loggedAt ? new Date(attempt.loggedAt) : new Date();
  const timing = attempt.revisionTiming || attempt.revision;
  const mappedDays = {
    Today: 0,
    Tomorrow: 1,
    "In 2 Days": 2,
    "In 1 Week": 7,
    "In 2 Weeks": 14,
  };
  if (mappedDays[timing] === undefined) return null;
  const date = new Date(base);
  date.setDate(base.getDate() + mappedDays[timing]);
  return date;
};

const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

function LearningInsightsPage({ theme, onThemeChange }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const sheets = useSheetStore((state) => state.sheets);
  const loadSheets = useSheetStore((state) => state.loadSheets);
  const [filters, setFilters] = useState({ dateRange: "all", topic: "all", platform: "all" });

  useEffect(() => {
    if (!currentUser?.token) return;
    loadSheets(currentUser.token);
  }, [currentUser?.token, loadSheets]);

  const dashboardData = useMemo(() => {
    const attempts = [];
    const now = new Date();

    sheets.forEach((sheet) => {
      (sheet.topics || []).forEach((topic) => {
        (topic.subTopics || []).forEach((subTopic) => {
          (subTopic.questions || []).forEach((question) => {
            if (!question?.attemptLog) return;
            attempts.push({
              ...question.attemptLog,
              topic: question.attemptLog.topic || topic.title,
              subTopic: subTopic.title,
              problemName: question.attemptLog.problemName || question.text,
              platform: normalizePlatform(question.attemptLog.platform, question.link),
              loggedAt: question.attemptLog.loggedAt || now.toISOString(),
              revisionDate: question.attemptLog.revisionDate,
            });
          });
        });
      });
    });

    const topics = [...new Set(attempts.map((item) => item.topic).filter(Boolean))];
    const platforms = [...new Set(attempts.map((item) => item.platform).filter(Boolean))];

    let filteredAttempts = [...attempts];
    if (filters.topic !== "all") filteredAttempts = filteredAttempts.filter((item) => item.topic === filters.topic);
    if (filters.platform !== "all") filteredAttempts = filteredAttempts.filter((item) => item.platform === filters.platform);
    if (filters.dateRange !== "all") {
      const days = Number(filters.dateRange.replace("d", ""));
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filteredAttempts = filteredAttempts.filter((item) => new Date(item.loggedAt) >= cutoff);
    }

    const totalAttempts = filteredAttempts.length;
    const solvedCount = filteredAttempts.filter((item) => item.result === "solved").length;
    const totalMinutes = filteredAttempts.reduce((sum, item) => sum + parseMinutes(item.timeSpent), 0);

    const byDay = new Map();
    filteredAttempts.forEach((item) => {
      const key = dayKey(item.loggedAt);
      byDay.set(key, (byDay.get(key) || 0) + 1);
    });

    const attemptsTrend = Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-10)
      .map(([label, value]) => ({ label: label.slice(5), value }));

    const mistakeCounts = new Map();
    filteredAttempts.forEach((item) => {
      (item.mistakes || []).forEach((mistake) => {
        mistakeCounts.set(mistake, (mistakeCounts.get(mistake) || 0) + 1);
      });
    });
    const topMistakes = Array.from(mistakeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    const topicMap = new Map();
    filteredAttempts.forEach((item) => {
      const current = topicMap.get(item.topic) || { attempts: 0, solved: 0, minutes: 0, revisionDue: 0 };
      current.attempts += 1;
      if (item.result === "solved") current.solved += 1;
      current.minutes += parseMinutes(item.timeSpent);
      const revisionDate = toRevisionDate(item);
      if (revisionDate && revisionDate <= now) current.revisionDue += 1;
      topicMap.set(item.topic, current);
    });

    const topicMastery = Array.from(topicMap.entries()).map(([name, data]) => ({
      name,
      mastery: data.attempts ? Math.round((data.solved / data.attempts) * 100) : 0,
      attempts: data.attempts,
      solvedRate: data.attempts ? Math.round((data.solved / data.attempts) * 100) : 0,
      avgMinutes: data.attempts ? Math.round(data.minutes / data.attempts) : 0,
      revisionDue: data.revisionDue,
    }));

    const weakAreas = [...topicMastery].sort((a, b) => a.mastery - b.mastery || b.attempts - a.attempts).slice(0, 5);
    const strongestTopics = [...topicMastery].sort((a, b) => b.mastery - a.mastery).slice(0, 3);

    const revisions = { overdue: 0, today: 0, tomorrow: 0, thisWeek: 0 };
    filteredAttempts.forEach((item) => {
      const revisionDate = toRevisionDate(item);
      if (!revisionDate) return;
      const diffDays = Math.floor((new Date(dayKey(revisionDate)) - new Date(dayKey(now))) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) revisions.overdue += 1;
      else if (diffDays === 0) revisions.today += 1;
      else if (diffDays === 1) revisions.tomorrow += 1;
      else if (diffDays <= 7) revisions.thisWeek += 1;
    });

    const dailyAttemptsMap = new Map();
    filteredAttempts.forEach((item) => {
      const key = dayKey(item.loggedAt);
      dailyAttemptsMap.set(key, (dailyAttemptsMap.get(key) || 0) + 1);
    });

    const timeByResult = ["solved", "partially_solved", "failed"].map((result) => {
      const selected = filteredAttempts.filter((item) => item.result === result);
      const minutes = selected.reduce((sum, item) => sum + parseMinutes(item.timeSpent), 0);
      return { result, minutes };
    });

    const confidenceVsResult = ["Low", "Medium", "High"].map((confidence) => {
      const band = filteredAttempts.filter((item) => (item.confidence || "Medium") === confidence);
      return {
        confidence,
        solved: band.filter((item) => item.result === "solved").length,
        failed: band.filter((item) => item.result === "failed").length,
      };
    });

    const groupedRecentMistakes = new Map();
    filteredAttempts.forEach((item) => {
      const dateLabel = new Date(item.loggedAt).toLocaleDateString();
      (item.mistakes || []).forEach((mistake) => {
        const key = `${mistake}__${item.topic || "General"}`;
        const existing = groupedRecentMistakes.get(key);
        if (!existing) {
          groupedRecentMistakes.set(key, {
            id: key,
            name: mistake,
            topic: item.topic || "General",
            count: 1,
            latestAt: item.loggedAt,
            when: dateLabel,
          });
          return;
        }
        existing.count += 1;
        if (new Date(item.loggedAt) > new Date(existing.latestAt)) {
          existing.latestAt = item.loggedAt;
          existing.when = dateLabel;
        }
      });
    });

    const recentMistakes = Array.from(groupedRecentMistakes.values())
      .sort((a, b) => new Date(b.latestAt) - new Date(a.latestAt))
      .slice(0, 6)
      .map((mistake) => ({ ...mistake, summary: `${mistake.name} in ${mistake.topic} • ${mistake.count} ${mistake.count === 1 ? "time" : "times"}` }));

    const practiceDays = [...new Set(filteredAttempts.map((item) => dayKey(item.loggedAt)))].sort();
    let streak = 0;
    let cursor = new Date(dayKey(now));
    while (practiceDays.includes(dayKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const avgFailedMinutes = Math.round(timeByResult.find((item) => item.result === "failed")?.minutes / (filteredAttempts.filter((item) => item.result === "failed").length || 1));
    const avgSolvedMinutes = Math.round(timeByResult.find((item) => item.result === "solved")?.minutes / (filteredAttempts.filter((item) => item.result === "solved").length || 1));

    const insights = [
      `${topMistakes[0]?.name || "No frequent mistake yet"} is currently your most repeated mistake pattern.`,
      `${strongestTopics[0]?.name || "No strong topic yet"} looks stable, while ${weakAreas[0]?.name || "your weakest topic"} needs focused revision.`,
      `Failed attempts average ${avgFailedMinutes || 0} min vs ${avgSolvedMinutes || 0} min for solved attempts.`,
      "High confidence does not always convert to solved outcomes—review assumptions before coding.",
    ];

    const actions = [
      `Schedule ${revisions.overdue + revisions.today} urgent revisions first (overdue + today).`,
      `Run a focused session on ${weakAreas[0]?.name || "weak topics"} with 3 timed problems.`,
      "After each failed attempt, capture one concrete edge case in notes.",
      "Use hint/editorial toggles to track independence trends weekly.",
    ];

    return {
      filtersMeta: { topics, platforms },
      stats: {
        totalAttempts,
        totalQuestions: topicMastery.reduce((sum, item) => sum + item.attempts, 0),
        solvedRate: totalAttempts ? (solvedCount / totalAttempts) * 100 : 0,
        solvedCount,
        avgMinutes: totalAttempts ? Math.round(totalMinutes / totalAttempts) : 0,
        totalMinutes,
        streak,
        lastPracticeLabel: practiceDays.length ? `Last practice ${practiceDays[practiceDays.length - 1]}` : "No recent practice",
        revisionsDue: revisions.overdue + revisions.today,
        revisionOverdue: revisions.overdue,
        weakestTopic: weakAreas[0]?.name,
        weakestTopicRate: weakAreas[0]?.mastery,
        topMistake: topMistakes[0]?.name,
        topMistakeCount: topMistakes[0]?.count,
      },
      attemptsTrend: attemptsTrend.length ? attemptsTrend : [{ label: "No data", value: 0 }],
      resultDistribution: {
        solved: filteredAttempts.filter((item) => item.result === "solved").length,
        partially_solved: filteredAttempts.filter((item) => item.result === "partially_solved").length,
        failed: filteredAttempts.filter((item) => item.result === "failed").length,
      },
      topMistakes,
      topicMastery,
      weakAreas,
      recentMistakes,
      insights,
      actions,
      revisionTimeline: [
        { label: "Overdue", count: revisions.overdue },
        { label: "Today", count: revisions.today },
        { label: "Tomorrow", count: revisions.tomorrow },
        { label: "This week", count: revisions.thisWeek },
      ],
      confidenceVsResult,
      dailyAttemptsMap,
      timeByResult,
    };
  }, [sheets, filters]);

  const updateFilters = (partial) => setFilters((current) => ({ ...current, ...partial }));

  return (
    <AppShell title="Learning Insights" subtitle="Private analytics from your sheets" theme={theme} onThemeChange={onThemeChange}>
      <div className="space-y-4">
        <InsightsHeader
          filters={filters}
          onFiltersChange={updateFilters}
          topics={dashboardData.filtersMeta.topics}
          platforms={dashboardData.filtersMeta.platforms}
        />
        <KPIStatsRow stats={dashboardData.stats} />

        <div className="grid gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-8">
            <AttemptsTrendChart points={dashboardData.attemptsTrend} />
            <div className="grid gap-4 lg:grid-cols-2">
              <MistakeFrequencyChart mistakes={dashboardData.topMistakes} />
              <TopicMasteryChart topics={dashboardData.topicMastery} />
            </div>
            <SuggestionsCard insights={dashboardData.insights} actions={dashboardData.actions} />
          </div>
          <div className="space-y-4 xl:col-span-4">
            <ResultDistributionChart distribution={dashboardData.resultDistribution} />
            <RevisionTimelineCard items={dashboardData.revisionTimeline} />
            <WeakAreasCard weakAreas={dashboardData.weakAreas} />
            <RecentMistakesCard mistakes={dashboardData.recentMistakes} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="panel rounded-2xl p-4 lg:col-span-2">
            <h3 className="text-base font-semibold">Confidence vs result</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {dashboardData.confidenceVsResult.map((row) => (
                <article key={row.confidence} className="rounded-lg border border-[var(--border-subtle)] p-3">
                  <p className="text-sm font-medium">{row.confidence} confidence</p>
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">Solved: {row.solved}</p>
                  <p className="text-xs text-[var(--text-secondary)]">Failed: {row.failed}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="panel rounded-2xl p-4">
            <h3 className="text-base font-semibold">Time spent by result</h3>
            <div className="mt-4 space-y-3">
              {dashboardData.timeByResult.map((item) => (
                <div key={item.result} className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-sm">
                  <span className="capitalize">{item.result.replace("_", " ")}</span>
                  <span className="text-[var(--text-tertiary)]">{item.minutes} min</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="panel rounded-2xl p-4">
          <h3 className="text-base font-semibold">Practice consistency heatmap</h3>
          <div className="mt-4 overflow-x-auto">
            <div className="inline-flex gap-2">
              <div className="mt-6 grid grid-rows-7 gap-1 text-[10px] text-[var(--text-tertiary)]">
                {["Mon", "", "Wed", "", "Fri", "", ""].map((label, index) => (
                  <span key={`${label}-${index}`} className="h-3 leading-3">{label}</span>
                ))}
              </div>
              <div className="space-y-1">
                <div className="flex gap-1 text-[10px] text-[var(--text-tertiary)]">
                  {Array.from({ length: 20 }).map((_, weekIndex) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (140 - weekIndex * 7));
                    const label = date.getDate() <= 7 ? date.toLocaleString(undefined, { month: "short" }) : "";
                    return <span key={weekIndex} className="w-3">{label}</span>;
                  })}
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 20 }).map((_, weekIndex) => (
                    <div key={weekIndex} className="grid grid-rows-7 gap-1">
                      {Array.from({ length: 7 }).map((_, dayIndex) => {
                        const date = new Date();
                        const offset = 139 - (weekIndex * 7 + dayIndex);
                        date.setDate(date.getDate() - offset);
                        const key = dayKey(date);
                        const count = dashboardData.dailyAttemptsMap.get(key) || 0;
                        const intensity = count === 0 ? 0 : count >= 4 ? 4 : count >= 3 ? 3 : count >= 2 ? 2 : 1;
                        const backgrounds = [
                          "var(--surface-soft)",
                          "color-mix(in srgb, var(--accent-success) 25%, var(--surface-soft))",
                          "color-mix(in srgb, var(--accent-success) 45%, var(--surface-soft))",
                          "color-mix(in srgb, var(--accent-success) 65%, var(--surface-soft))",
                          "color-mix(in srgb, var(--accent-success) 85%, var(--surface-soft))",
                        ];
                        return (
                          <div
                            key={`${weekIndex}-${dayIndex}`}
                            className="h-3 w-3 rounded-[3px] border border-[var(--border-subtle)]"
                            style={{ background: backgrounds[intensity] }}
                            title={`${date.toDateString()} • ${count} ${count === 1 ? "attempt" : "attempts"}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default LearningInsightsPage;
