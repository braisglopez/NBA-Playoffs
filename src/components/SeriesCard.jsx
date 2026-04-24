export default function SeriesCard({ series }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <h2 className="text-xl font-semibold">
        {series.home} vs {series.away}
      </h2>
    </div>
  );
}
