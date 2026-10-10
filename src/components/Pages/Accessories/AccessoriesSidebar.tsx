/* eslint-disable @typescript-eslint/no-explicit-any */
// components/AccessoriesSidebar.tsx
'use client';

const filterData = {
  Category: [
    { label: 'Lighters', count: 56 },
    { label: 'Cutters & Guillotines', count: 56 },
    { label: 'Cigar Cases', count: 56 },
    { label: 'Humidors', count: 56 },
    { label: 'Ashtrays', count: 56 },
    { label: 'Pipes', count: 56 },
    { label: 'Gift Sets', count: 56 },
  ],
  Material: [
    { label: 'Gold Plated', count: 56 },
    { label: 'Sterling Silver', count: 56 },
    { label: 'Leather', count: 56 },
    { label: 'Walnut Wood', count: 56 },
    { label: 'Stainless Steel', count: 56 },
  ],
  Brand: [
    { label: 'Davidoff', count: 56 },
    { label: 'Marlboro', count: 56 },
    { label: 'Dunhill', count: 56 },
  ],
};

const AccessoriesSidebar = ({ filters, onFilterChange, onPriceChange, onApply, onReset }: any) => {
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
      <p className="text-gray-400 mb-4">Home / Accessories</p>

      {renderGroup('Category', filterData.Category)}
      {renderGroup('Material', filterData.Material)}
      {renderGroup('Brand', filterData.Brand)}

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

export default AccessoriesSidebar;
