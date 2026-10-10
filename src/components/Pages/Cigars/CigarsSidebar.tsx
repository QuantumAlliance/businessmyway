/* eslint-disable @typescript-eslint/no-explicit-any */
// components/CigarsSidebar.jsx
'use client';

const filterData = {
  'Size / Vitola': [
    { label: 'Robusto', count: 56 },
    { label: 'Churchill', count: 56 },
    { label: 'Toro', count: 56 },
    { label: 'Corona', count: 56 },
    { label: 'Panetela', count: 56 },
  ],
  Origin: [
    { label: 'Cuba', count: 56 },
    { label: 'Nicaragua', count: 56 },
    { label: 'Dominican Republic', count: 56 },
    { label: 'Honduras', count: 56 },
  ],
  Brand: [
    { label: 'Davidoff', count: 56 },
    { label: 'Marlboro', count: 56 },
    { label: 'Dunhill', count: 56 },
  ],
};

// Unlabeled wrapper-color group (no heading in the reference image)
const wrapperColors = [
  { label: 'Natural', count: 28 },
  { label: 'Claro', count: 14 },
  { label: 'Colorado', count: 11 },
  { label: 'Maduro', count: 56 },
];

const CigarsSidebar = ({ filters, onFilterChange, onPriceChange, onApply, onReset }: any) => {
  const renderGroup = (title: string, items: { label: string; count: number }[]) => (
    <div key={title} className="mb-6">
      <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <label
            key={item.label}
            className="flex items-center justify-between cursor-pointer hover:text-gray-900"
          >
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 accent-gray-800"
                checked={filters[title]?.includes(item.label) || false}
                onChange={() => onFilterChange(title, item.label)}
              />
              {item.label}
            </span>
            <span className="text-gray-400">{item.count}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <aside className="w-full lg:w-64 shrink-0 text-sm text-gray-700">
      <p className="text-gray-400 mb-4">Home / Cigars</p>

      {renderGroup('Size / Vitola', filterData['Size / Vitola'])}
      {renderGroup('Origin', filterData.Origin)}
      {renderGroup('Brand', filterData.Brand)}

      {/* Divider before the unlabeled wrapper-color group */}
      <hr className="border-gray-200 mb-6" />

      <div className="mb-6">
        <div className="space-y-2">
          {wrapperColors.map((item) => (
            <label
              key={item.label}
              className="flex items-center justify-between cursor-pointer hover:text-gray-900"
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 accent-gray-800"
                  checked={filters['WrapperColor']?.includes(item.label) || false}
                  onChange={() => onFilterChange('WrapperColor', item.label)}
                />
                {item.label}
              </span>
              <span className="text-gray-400">{item.count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
        <div className="flex gap-3">
          <input
            type="number"
            placeholder="$ Min"
            value={filters.minPrice || ''}
            onChange={(e) => onPriceChange('minPrice', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 w-1/2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <input
            type="number"
            placeholder="$ Max"
            value={filters.maxPrice || ''}
            onChange={(e) => onPriceChange('maxPrice', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 w-1/2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onApply}
          className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-5 py-2.5 rounded-md text-sm transition-colors"
        >
          Apply Filter
        </button>
        <button
          onClick={onReset}
          className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-5 py-2.5 rounded-md text-sm transition-colors"
        >
          Reset
        </button>
      </div>
    </aside>
  );
};

export default CigarsSidebar;
