/**
 * A search-performance chart in the style of Google Search Console: clicks and
 * impressions over 16 weeks. It is an illustration of what the SEO agent
 * reports on, and it says so on the chart; it is not a client's result.
 */
const WEEKS = 16;
const impressions = [1.2, 1.3, 1.25, 1.5, 1.8, 2.1, 2.0, 2.6, 3.1, 3.4, 3.9, 4.6, 5.0, 5.8, 6.3, 7.1];
const clicks = [38, 41, 40, 47, 55, 61, 63, 78, 92, 101, 118, 135, 150, 171, 188, 214];

const W = 640;
const H = 220;
const x = (index: number) => 24 + (index / (WEEKS - 1)) * (W - 48);
const line = (values: number[], max: number) =>
  values
    .map(
      (value, index) =>
        `${index ? "L" : "M"}${x(index).toFixed(1)} ${(H - 24 - (value / max) * (H - 60)).toFixed(1)}`,
    )
    .join(" ");

export function SearchGrowthChart() {
  const impressionsPath = line(impressions, 8);
  const clicksPath = line(clicks, 240);
  return (
    <figure className="overflow-hidden rounded-3xl border border-white/12 bg-white text-[#202124]">
      <div className="grid grid-cols-2 sm:grid-cols-4">
        <div className="bg-[#4285f4] px-5 py-4 text-white">
          <p className="text-[12px] opacity-90">Total clicks</p>
          <p className="mt-1 text-[1.6rem] font-medium leading-none">1,592</p>
        </div>
        <div className="bg-[#5e35b1] px-5 py-4 text-white">
          <p className="text-[12px] opacity-90">Total impressions</p>
          <p className="mt-1 text-[1.6rem] font-medium leading-none">53.0K</p>
        </div>
        <div className="border-b border-[#e8eaed] px-5 py-4">
          <p className="text-[12px] text-[#5f6368]">Average CTR</p>
          <p className="mt-1 text-[1.6rem] font-medium leading-none">3.0%</p>
        </div>
        <div className="border-b border-[#e8eaed] px-5 py-4">
          <p className="text-[12px] text-[#5f6368]">Average position</p>
          <p className="mt-1 text-[1.6rem] font-medium leading-none">11.4</p>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label="Illustrative chart: clicks and impressions rising steadily over sixteen weeks"
      >
        {[0, 1, 2, 3].map((row) => (
          <line key={row} x1="24" x2={W - 24} y1={36 + row * 40} y2={36 + row * 40} stroke="#e8eaed" />
        ))}
        <path d={impressionsPath} fill="none" stroke="#5e35b1" strokeWidth="2.5" strokeLinejoin="round" />
        <path d={clicksPath} fill="none" stroke="#4285f4" strokeWidth="2.5" strokeLinejoin="round" />
        {["Wk 1", "Wk 4", "Wk 8", "Wk 12", "Wk 16"].map((label, index) => (
          <text
            key={label}
            x={x([0, 3, 7, 11, 15][index]!)}
            y={H - 6}
            textAnchor="middle"
            fontSize="11"
            fill="#5f6368"
          >
            {label}
          </text>
        ))}
      </svg>
      <figcaption className="border-t border-[#e8eaed] bg-[#f8f9fa] px-5 py-3 text-[12px] text-[#5f6368]">
        Illustration of the report Kestrel sends you, in the style of Google Search Console. Not a client’s
        result; real numbers depend on your site and market.
      </figcaption>
    </figure>
  );
}
