import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { playoffRounds, players } from "./data/playoffs";

const RESULTS_STORAGE_KEY = "nba-playoffs-bets:results";

const getSavedResults = () => {
  try {
    const savedResults = window.localStorage.getItem(RESULTS_STORAGE_KEY);
    return savedResults ? JSON.parse(savedResults) : {};
  } catch {
    return {};
  }
};

const getPickLabel = (pick) => (pick ? `${pick.winner} ${pick.games}` : "-");

const getResultValue = (result) =>
  result ? `${result.winner}-${result.games}` : "";

const parseResultValue = (value) => {
  if (!value) {
    return null;
  }

  const [winner, games] = value.split("-");
  return { winner, games: Number(games) };
};

const getScore = (pick, result, scoring) => {
  if (!pick || !result) {
    return 0;
  }

  if (pick.winner !== result.winner) {
    return 0;
  }

  return pick.games === result.games ? scoring.exact : scoring.winner;
};

const getPickStatus = (pick, result) => {
  if (!result || !pick) {
    return "pending";
  }

  if (pick.winner !== result.winner) {
    return "wrong";
  }

  return pick.games === result.games ? "exact" : "winner";
};

function LogoSlot({ team }) {
  return (
    <span className="logo-slot" aria-label={`${team.city} ${team.name} logo`}>
      {team.code.slice(0, 3)}
    </span>
  );
}

function TeamRow({ team }) {
  return (
    <div className="team-row">
      <LogoSlot team={team} />
      <span className="seed">{team.seed}</span>
      <strong>{team.name}</strong>
    </div>
  );
}

function BracketSeriesCard({ series, side }) {
  return (
    <article className={`bracket-series ${side}`}>
      <div className="series-meta">
        <span>{series.status}</span>
      </div>
      <TeamRow team={series.teams[0]} />
      <TeamRow team={series.teams[1]} />
    </article>
  );
}

function BracketPlaceholder({ side, title = "TBD" }) {
  return (
    <article className={`bracket-placeholder ${side}`}>
      <div className="placeholder-team">
        <span className="shield-slot" />
        <strong>{title}</strong>
      </div>
      <div className="placeholder-team">
        <span className="shield-slot" />
        <strong>TBD</strong>
      </div>
    </article>
  );
}

function FirstRoundColumn({ series, side }) {
  const pairs = [series.slice(0, 2), series.slice(2, 4)];

  return (
    <div className={`first-round-column ${side}`}>
      {pairs.map((pair) => (
        <div className="bracket-pair" key={pair.map((item) => item.id).join("-")}>
          {pair.map((item) => (
            <BracketSeriesCard key={item.id} series={item} side={side} />
          ))}
          <span className="pair-rail" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}

function PlayoffBracket({ series }) {
  const westSeries = series.filter((item) => item.conference === "west");
  const eastSeries = series.filter((item) => item.conference === "east");

  return (
    <section className="bracket-section" aria-labelledby="bracket-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Playoffs 2026</p>
          <h1 id="bracket-title">Porra NBA Playoffs</h1>
        </div>
        <p className="score-help">
          R1: 1 punto ganador, 2 exacto - R2: 2/3 - CF: 3/4 - Final: 4/5
        </p>
      </div>

      <div className="bracket-scroll">
        <div className="conference-labels">
          <h2>WESTERN CONFERENCE</h2>
          <h2>EASTERN CONFERENCE</h2>
        </div>

        <div className="bracket-grid">
          <FirstRoundColumn series={westSeries} side="west" />

          <div className="round-column semi-column west">
            <BracketPlaceholder side="west" />
            <BracketPlaceholder side="west" />
          </div>

          <div className="round-column conference-column west">
            <BracketPlaceholder side="west" />
          </div>

          <article className="championship-card">
            <h2>Championship</h2>
            <div className="championship-matchup">
              <span className="shield-slot large" />
              <span>TBD</span>
              <span>TBD</span>
              <span className="shield-slot large" />
            </div>
          </article>

          <div className="round-column conference-column east">
            <BracketPlaceholder side="east" />
          </div>

          <div className="round-column semi-column east">
            <BracketPlaceholder side="east" />
            <BracketPlaceholder side="east" />
          </div>

          <FirstRoundColumn series={eastSeries} side="east" />
        </div>
      </div>
    </section>
  );
}

function Standings({ standings }) {
  return (
    <section className="standings-section" aria-labelledby="standings-title">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Clasificacion</p>
          <h2 id="standings-title">General actualizada</h2>
        </div>
        <span className="pending-badge">Pendiente de resultados reales</span>
      </div>

      <div className="standings-grid">
        {standings.map((player, index) => (
          <article className="standing-card" key={player.id}>
            <span className="rank">{index + 1}</span>
            <div>
              <h3>{player.name}</h3>
              <p>
                {player.total} pts - {player.exactHits} exactos -{" "}
                {player.winnerHits} ganadores
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RoundTabs({ activeRound, onRoundChange }) {
  return (
    <nav className="round-tabs" aria-label="Rondas de playoffs">
      {playoffRounds.map((round) => (
        <button
          className={round.id === activeRound ? "active" : ""}
          key={round.id}
          onClick={() => onRoundChange(round.id)}
          type="button"
        >
          {round.label}
        </button>
      ))}
    </nav>
  );
}

function ResultSelect({ series, value, onChange }) {
  return (
    <label className="result-select">
      <span>Resultado real</span>
      <select
        value={getResultValue(value)}
        onChange={(event) => onChange(series.id, parseResultValue(event.target.value))}
      >
        <option value="">Pendiente</option>
        {series.teams.map((team) =>
          [4, 5, 6, 7].map((games) => (
            <option key={`${team.code}-${games}`} value={`${team.code}-${games}`}>
              {team.code} en {games}
            </option>
          ))
        )}
      </select>
    </label>
  );
}

function PredictionsTable({ round, results }) {
  return (
    <div className="table-wrap">
      <table className="predictions-table">
        <thead>
          <tr>
            <th>Serie</th>
            {players.map((player) => (
              <th key={player.id}>{player.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {round.series.map((series) => (
            <tr key={series.id}>
              <th scope="row">{series.label}</th>
              {players.map((player) => {
                const pick = series.picks[player.id];
                const status = getPickStatus(pick, results[series.id]);

                return (
                  <td className={`pick-cell ${status}`} key={player.id}>
                    {getPickLabel(pick)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SeriesPredictionCard({ round, series, result, onResultChange }) {
  return (
    <article className="prediction-card">
      <div className="prediction-card-header">
        <div>
          <p className="eyebrow">{round.label}</p>
          <h3>
            {series.teams[0].code} vs {series.teams[1].code}
          </h3>
        </div>
        <ResultSelect series={series} value={result} onChange={onResultChange} />
      </div>

      <div className="prediction-list">
        {players.map((player) => {
          const pick = series.picks[player.id];
          const status = getPickStatus(pick, result);
          const score = getScore(pick, result, round.scoring);

          return (
            <div className={`prediction-row ${status}`} key={player.id}>
              <span>{player.name}</span>
              <strong>{pick ? `${pick.winner} en ${pick.games}` : "-"}</strong>
              <em>{score} pts</em>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function EmptyRound({ round }) {
  return (
    <section className="empty-round">
      <p className="eyebrow">{round.shortLabel}</p>
      <h2>{round.label}</h2>
      <p>
        Esta ronda queda preparada para meter las predicciones cuando se sepan
        los cruces. Puntuacion: {round.scoring.winner} punto(s) por ganador y{" "}
        {round.scoring.exact} por ganador + partidos exactos.
      </p>
    </section>
  );
}

function RoundPanel({ round, results, onResultChange }) {
  if (round.series.length === 0) {
    return <EmptyRound round={round} />;
  }

  return (
    <section className="round-panel" aria-labelledby={`${round.id}-title`}>
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Predicciones</p>
          <h2 id={`${round.id}-title`}>{round.label}</h2>
        </div>
        <p className="round-score-note">
          {round.scoring.winner} punto ganador - {round.scoring.exact} exacto
        </p>
      </div>

      <PredictionsTable round={round} results={results} />

      <div className="prediction-grid">
        {round.series.map((series) => (
          <SeriesPredictionCard
            key={series.id}
            round={round}
            series={series}
            result={results[series.id]}
            onResultChange={onResultChange}
          />
        ))}
      </div>
    </section>
  );
}

function App() {
  const [activeRound, setActiveRound] = useState("round1");
  const [results, setResults] = useState(getSavedResults);
  const firstRound = playoffRounds[0];
  const selectedRound = playoffRounds.find((round) => round.id === activeRound);

  useEffect(() => {
    window.localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(results));
  }, [results]);

  const standings = useMemo(() => {
    return players
      .map((player, originalIndex) => {
        const totals = playoffRounds.reduce(
          (summary, round) => {
            round.series.forEach((series) => {
              const pick = series.picks[player.id];
              const result = results[series.id];
              const score = getScore(pick, result, round.scoring);

              summary.total += score;

              if (result && pick?.winner === result.winner) {
                summary.winnerHits += 1;
              }

              if (
                result &&
                pick?.winner === result.winner &&
                pick?.games === result.games
              ) {
                summary.exactHits += 1;
              }
            });

            return summary;
          },
          { total: 0, winnerHits: 0, exactHits: 0 }
        );

        return { ...player, originalIndex, ...totals };
      })
      .sort(
        (a, b) =>
          b.total - a.total ||
          b.exactHits - a.exactHits ||
          b.winnerHits - a.winnerHits ||
          a.originalIndex - b.originalIndex
      );
  }, [results]);

  const handleResultChange = (seriesId, result) => {
    setResults((currentResults) => {
      const nextResults = { ...currentResults };

      if (!result) {
        delete nextResults[seriesId];
      } else {
        nextResults[seriesId] = result;
      }

      return nextResults;
    });
  };

  return (
    <main className="app-shell">
      <PlayoffBracket series={firstRound.series} />
      <Standings standings={standings} />
      <RoundTabs activeRound={activeRound} onRoundChange={setActiveRound} />
      <RoundPanel
        round={selectedRound}
        results={results}
        onResultChange={handleResultChange}
      />
    </main>
  );
}

export default App;
