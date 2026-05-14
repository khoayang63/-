"use client";

export default function SortBar({ sortBy, setSortBy, onSortChange }) {
  const sortOptions = [
    { value: "a-z", label: "A → Z" },
    { value: "z-a", label: "Z → A" },
    { value: "price-asc", label: "Giá tăng dần" },
    { value: "price-desc", label: "Giá giảm dần" },
  ];

  const handleChange = (e) => {
    const newSort = e.target.value;
    if (onSortChange) {
      onSortChange(newSort);
    } else {
      setSortBy(newSort);
    }
  };

  return (
    <div className="flex items-center gap-4 bg-slate-800 py-2 px-4 rounded-xl border border-slate-700">
      <span className="text-sm font-semibold text-slate-400 hidden sm:inline-block">Sắp xếp:</span>
      <div className="relative">
        <select
          value={sortBy}
          onChange={handleChange}
          className="appearance-none bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full py-2 pl-4 pr-10 focus:outline-none transition-colors cursor-pointer font-medium"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-amber-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>
  );
}
