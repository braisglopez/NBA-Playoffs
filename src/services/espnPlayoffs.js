const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";
const PLAYOFF_DATE_RANGE = "20260414-20260620";
const SCOREBOARD_PARAMS = new URLSearchParams({
  dates: PLAYOFF_DATE_RANGE,
  seasontype: "3",
  limit: "300",
});

export const ESPN_SCOREBOARD_SOURCE_URL = `${ESPN_SCOREBOARD_URL}?${SCOREBOARD_PARAMS}`;

const ESPN_TO_APP_TEAM_CODES = {
  CLE: "CAVS",
  LAL: "LAK",
  NY: "NYK",
  ORL: "MAG",
  PHI: "76ERS",
  SA: "SAS",
};

const normalizeTeamCode = (code) =>
  ESPN_TO_APP_TEAM_CODES[code?.toUpperCase()] ?? code?.toUpperCase();

const getCompetition = (event) => event?.competitions?.[0];

const getSeriesKeyFromCodes = (codes) =>
  codes.map(normalizeTeamCode).filter(Boolean).sort().join("-");

const getSeriesKey = (series) =>
  getSeriesKeyFromCodes(series.teams.map((team) => team.code));

const getEventSeriesKey = (event) => {
  const competition = getCompetition(event);
  const codes = competition?.competitors?.map(
    (competitor) => competitor.team?.abbreviation
  );

  return codes?.length >= 2 ? getSeriesKeyFromCodes(codes) : null;
};

const replaceTeamCodes = (text) => {
  if (!text) {
    return "";
  }

  return Object.entries(ESPN_TO_APP_TEAM_CODES).reduce(
    (currentText, [espnCode, appCode]) =>
      currentText.replace(new RegExp(`\\b${espnCode}\\b`, "g"), appCode),
    text
  );
};

const normalizeSeriesSummary = (summary) =>
  replaceTeamCodes(summary)
    .replace(/\bleads series\b/i, "leads")
    .replace(/\blead series\b/i, "leads")
    .replace(/\bwins series\b/i, "wins");

const getGameLabel = (event) => {
  const notes = getCompetition(event)?.notes;
  const headline = Array.isArray(notes) ? notes[0]?.headline : notes?.headline;
  const gameMatch = headline?.match(/Game \d+(?: If Necessary)?/i);

  return gameMatch?.[0] ?? null;
};

const getRelevantEvent = (events) => {
  const sortedEvents = [...events].sort(
    (eventA, eventB) => Date.parse(eventA.date) - Date.parse(eventB.date)
  );

  const completedSeriesEvent = [...sortedEvents]
    .reverse()
    .find((event) => getCompetition(event)?.series?.completed);

  if (completedSeriesEvent) {
    return completedSeriesEvent;
  }

  const liveEvent = sortedEvents.find(
    (event) => event.status?.type?.state === "in"
  );

  if (liveEvent) {
    return liveEvent;
  }

  const now = Date.now();
  const recentlyStartedWindowMs = 2 * 60 * 60 * 1000;
  const upcomingEvent = sortedEvents.find((event) => {
    if (event.status?.type?.state !== "pre") {
      return false;
    }

    const eventTime = Date.parse(event.date);

    return Number.isNaN(eventTime)
      ? true
      : eventTime >= now - recentlyStartedWindowMs;
  });

  if (upcomingEvent) {
    return upcomingEvent;
  }

  return sortedEvents[sortedEvents.length - 1] ?? null;
};

const buildFinalResult = (event) => {
  const competition = getCompetition(event);
  const series = competition?.series;

  if (!series?.completed) {
    return null;
  }

  const teamCodesById = Object.fromEntries(
    competition.competitors.map((competitor) => [
      competitor.team.id,
      normalizeTeamCode(competitor.team.abbreviation),
    ])
  );
  const seriesCompetitors = series.competitors ?? [];
  const winner = seriesCompetitors.reduce(
    (best, competitor) =>
      Number(competitor.wins) > Number(best?.wins ?? -1) ? competitor : best,
    null
  );
  const games = seriesCompetitors.reduce(
    (total, competitor) => total + Number(competitor.wins ?? 0),
    0
  );

  if (!winner || games < 4) {
    return null;
  }

  const winnerCode = teamCodesById[winner.id];

  if (!winnerCode) {
    return null;
  }

  return {
    winner: winnerCode,
    games,
  };
};

const buildSeriesUpdate = (event) => {
  const competition = getCompetition(event);
  const gameLabel = getGameLabel(event);
  const summary = normalizeSeriesSummary(competition?.series?.summary);

  return {
    result: buildFinalResult(event),
    source: "ESPN",
    status: [gameLabel, summary].filter(Boolean).join(", "),
  };
};

export async function fetchEspnSeriesUpdates(seriesList) {
  const response = await fetch(ESPN_SCOREBOARD_SOURCE_URL);

  if (!response.ok) {
    throw new Error(`ESPN scoreboard responded ${response.status}`);
  }

  const data = await response.json();
  const eventsBySeriesKey = new Map();

  data.events
    ?.filter((event) => getCompetition(event)?.series?.summary)
    .forEach((event) => {
      const seriesKey = getEventSeriesKey(event);

      if (!seriesKey) {
        return;
      }

      const currentEvents = eventsBySeriesKey.get(seriesKey) ?? [];
      eventsBySeriesKey.set(seriesKey, [...currentEvents, event]);
    });

  return Object.fromEntries(
    seriesList
      .map((series) => {
        const event = getRelevantEvent(eventsBySeriesKey.get(getSeriesKey(series)) ?? []);

        return event ? [series.id, buildSeriesUpdate(event)] : null;
      })
      .filter(Boolean)
  );
}
