function SeriesBox({ teamA, teamB, connectRight }) {
  return (
    <div className="relative">
      {/* Línea horizontal */}
      {connectRight && (
        <div className="absolute top-1/2 right-[-2rem] w-8 h-[2px] bg-gray-500" />
      )}

      <div className="bg-gray-800 rounded-lg w-44 shadow-md">
        <div className="bg-blue-600 px-3 py-2 font-semibold">{teamA}</div>
        <div className="bg-red-600 px-3 py-2 font-semibold">{teamB}</div>
      </div>
    </div>
  );
}

function SeriesPair({ top, bottom }) {
  return (
    <div className="relative flex flex-col gap-6">
      {/* Vertical line */}
      <div className="absolute right-[-2rem] top-1/4 h-23 w-[2px] bg-gray-500" />
      <div className="absolute top-1/4 right-[-2rem] w-8 h-[2px] bg-gray-500" />
      <div className="absolute top-3/4 right-[-2rem] w-8 h-[2px] bg-gray-500" />
      <div className="absolute top-2/4 right-[-4rem] w-8 h-[2px] bg-gray-500" />
      <SeriesBox teamA={top[0]} teamB={top[1]} />
      <SeriesBox teamA={bottom[0]} teamB={bottom[1]} />
    </div>
  );
}

/* ---------- ROUNDS ---------- */

function Round1() {
  return (
    <div className="flex flex-col gap-6">
      <SeriesPair top={["Team A", "Team B"]} bottom={["Team C", "Team D"]} />
      <SeriesPair top={["Team E", "Team F"]} bottom={["Team G", "Team H"]} />
    </div>
  );
}

function Round2() {
  return (
    <div className="flex flex-col gap-32 mt-13">
      <SeriesBox teamA="Winner 1" teamB="Winner 2" />
      <SeriesBox teamA="Winner 3" teamB="Winner 4" />
    </div>
  );
}

function Round3() {
  return (
    <div className="flex flex-col mt-38">
      <SeriesBox teamA="Conference Winner" teamB="—" />
    </div>
  );
}

/* ---------- CONFERENCE EAST---------- */

function Conference_East({ title }) {
  return (
    <div className="flex flex-col items-center">
      <h2 className="mb-6 font-bold">{title}</h2>

      <div className="flex gap-16">
        <Round3 />
        <Round2 />
        <Round1 />
      </div>
    </div>
  );
}

/* ---------- CONFERENCE WEST---------- */

function Conference_West({ title }) {
  return (
    <div className="flex flex-col items-center">
      <h2 className="mb-6 font-bold">{title}</h2>

      <div className="flex gap-16">
        <Round1 />
        <Round2 />
        <Round3 />
      </div>
    </div>
  );
}

/* ---------- MAIN BRACKET ---------- */

export default function Bracket() {
  return (
    <div className="flex justify-between items-start gap-24 overflow-x-auto">
      <Conference_West title="Western Conference" />

      {/* NBA FINALS */}
      <div className="flex flex-col items-center mt-38">
        <h2 className="mb-6 font-bold">NBA Finals</h2>
        <SeriesBox teamA="West Winner" teamB="East Winner" />
      </div>

      <Conference_East title="Eastern Conference" />
    </div>
  );
}
