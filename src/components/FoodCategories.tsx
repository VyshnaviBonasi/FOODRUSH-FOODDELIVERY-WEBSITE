import React from 'react';

interface FoodCategoriesProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const FoodCategories: React.FC<FoodCategoriesProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const categories = [
    { id: 'All', name: 'All Cuisines', image: '/assets/moody-banquet-banner.jpg' },
    { id: 'Biryani', name: 'Biryani', image: '/assets/chickenbiriyani.jpg' },
    { id: 'Burgers', name: 'Burgers', image: '/assets/burger.jpg' },
    { id: 'Pizza', name: 'Pizza', image: '/assets/pizza.jpg' },
    { id: 'South Indian', name: 'South Indian', image: '/assets/south indian.jpg' },
    { id: 'Chinese', name: 'Chinese', image: '/assets/chineese.jpg' },
    { id: 'Desserts', name: 'Desserts', image: '/assets/chocolate brownie.jpg' },
    { id: 'Tandoori', name: 'Kebabs & Grills', image: '/assets/tandoori-skewers.webp' },
  ];

  return (
    <section className="py-12 bg-[#0D0B0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Food Categories
            </h2>
            <p className="text-sm text-gray-400 mt-1">Explore authentic dishes by popular cuisine</p>
          </div>
          <button
            onClick={() => onSelectCategory('All')}
            className="text-xs font-bold text-[#CAF509] hover:underline"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`group flex flex-col items-center p-3 rounded-2xl transition-all ${
                  isSelected
                    ? 'bg-[#1F1B12] border-2 border-[#CAF509] shadow-lg shadow-[#CAF509]/10'
                    : 'bg-[#151110] border border-[#2E2623] hover:border-gray-500 hover:bg-[#1C1715]'
                }`}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mb-3 border-2 border-[#2E2623] group-hover:scale-105 transition-transform">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <span
                  className={`text-xs font-bold text-center tracking-tight transition-colors ${
                    isSelected ? 'text-[#CAF509]' : 'text-gray-300 group-hover:text-white'
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
