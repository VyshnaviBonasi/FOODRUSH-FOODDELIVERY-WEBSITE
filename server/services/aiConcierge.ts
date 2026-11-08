import { db } from '../db/store.js';
import type { MenuItem, Restaurant } from '../../src/types/index.js';

export interface ConciergeRecommendationItem {
  dish: MenuItem;
  restaurant: Restaurant;
  quantity: number;
  subtotal: number;
  reason: string;
}

export interface ConciergeMealCombo {
  id: string;
  title: string;
  restaurant: Restaurant;
  items: ConciergeRecommendationItem[];
  totalPrice: number;
  budgetUtilization: string;
  matchedCriteria: string[];
  explanation: string;
}

export interface ConciergeResponse {
  query: string;
  mode: 'gemini_api' | 'deterministic_engine';
  interpretation: {
    budget?: number;
    isVeg?: boolean;
    maxDeliveryTimeMinutes?: number;
    cuisine?: string;
    partySize?: number;
    mealType?: string;
    keywords: string[];
  };
  combos: ConciergeMealCombo[];
  individualDishes: { dish: MenuItem; restaurant: Restaurant; reason: string }[];
  summaryMessage: string;
}

export function queryAiConcierge(userQuery: string): ConciergeResponse {
  const q = userQuery.toLowerCase().trim();

  // 1. Parse budget: e.g. "under ₹400", "below 500", "within 350", "under 400"
  let budget: number | undefined;
  const budgetMatch = q.match(/(?:under|below|less than|within|budget of|max)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i) ||
                      q.match(/(?:₹|rs\.?)\s*(\d+)/i);
  if (budgetMatch) {
    budget = parseInt(budgetMatch[1], 10);
  }

  // 2. Parse dietary requirements
  let isVeg: boolean | undefined;
  if (q.includes('non-veg') || q.includes('chicken') || q.includes('mutton') || q.includes('meat') || q.includes('kebab')) {
    isVeg = false;
  } else if (q.includes('veg') || q.includes('vegetarian') || q.includes('paneer') || q.includes('dosa')) {
    isVeg = true;
  }

  // 3. Parse delivery time limit
  let maxDeliveryMinutes: number | undefined;
  const timeMatch = q.match(/(?:under|within|in less than|below)\s*(\d+)\s*(?:min|mins|minutes)/i);
  if (timeMatch) {
    maxDeliveryMinutes = parseInt(timeMatch[1], 10);
  }

  // 4. Parse party size: "for two", "for 2", "for 1", "couple", "solo", "family"
  let partySize = 1;
  if (q.includes('two') || q.includes('2 people') || q.includes('for 2') || q.includes('couple')) {
    partySize = 2;
  } else if (q.includes('four') || q.includes('4 people') || q.includes('for 4') || q.includes('family')) {
    partySize = 4;
  }

  // 5. Parse meal type
  let mealType = 'Meal';
  if (q.includes('dinner')) mealType = 'Dinner';
  else if (q.includes('lunch')) mealType = 'Lunch';
  else if (q.includes('breakfast') || q.includes('tiffin')) mealType = 'Breakfast/Tiffin';
  else if (q.includes('dessert') || q.includes('sweet') || q.includes('cake')) mealType = 'Dessert Treat';

  // 6. Keywords
  const keywords = q.split(/\s+/).filter(w => w.length > 2);

  // Get active menu items and restaurants
  const allRestaurants = db.getRestaurants().filter(r => r.isOpen);
  const restaurantMap = new Map<string, Restaurant>();
  allRestaurants.forEach(r => restaurantMap.set(r.id, r));

  const allItems = db.getMenuItems().filter(item => {
    if (!item.inStock) return false;
    const r = restaurantMap.get(item.restaurantId);
    if (!r) return false;

    // Delivery time filter
    if (maxDeliveryMinutes) {
      const matchMinutes = r.deliveryTime.match(/(\d+)\s*mins?/);
      if (matchMinutes && parseInt(matchMinutes[1], 10) > maxDeliveryMinutes) {
        return false;
      }
    }

    // Dietary filter
    if (isVeg !== undefined && item.isVeg !== isVeg) {
      return false;
    }

    return true;
  });

  // Group items by restaurant to form valid single-restaurant meal combos
  const combos: ConciergeMealCombo[] = [];

  for (const restaurant of allRestaurants) {
    const rItems = allItems.filter(i => i.restaurantId === restaurant.id);
    if (rItems.length === 0) continue;

    // Separate main courses, breads/sides, desserts/starters
    const mains = rItems.filter(i => 
      i.category.toLowerCase().includes('biryani') || 
      i.category.toLowerCase().includes('main') || 
      i.category.toLowerCase().includes('curry') || 
      i.category.toLowerCase().includes('burger') ||
      i.category.toLowerCase().includes('noodles') ||
      i.category.toLowerCase().includes('meals') ||
      i.category.toLowerCase().includes('tiffins')
    );
    const sides = rItems.filter(i => 
      i.category.toLowerCase().includes('bread') || 
      i.category.toLowerCase().includes('starter') || 
      i.category.toLowerCase().includes('side') ||
      i.category.toLowerCase().includes('soup')
    );

    // Try pairing
    for (const main of mains) {
      // Single dish combo
      if (!budget || main.price <= budget) {
        // Can we add a bread/side if budget permits?
        let comboItems: ConciergeRecommendationItem[] = [
          {
            dish: main,
            restaurant,
            quantity: partySize > 1 && main.price * 2 <= (budget || 1000) ? 2 : 1,
            subtotal: 0,
            reason: `${main.isVeg ? '🌱 Pure Veg' : '🍗 Non-Veg'} hearty staple from ${restaurant.name}`
          }
        ];
        comboItems[0].subtotal = comboItems[0].dish.price * comboItems[0].quantity;

        // Try adding a side or bread
        const remainingBudget = (budget || 500) - comboItems[0].subtotal;
        if (remainingBudget >= 35 && sides.length > 0) {
          const suitableSide = sides.find(s => s.price <= remainingBudget);
          if (suitableSide) {
            comboItems.push({
              dish: suitableSide,
              restaurant,
              quantity: 1,
              subtotal: suitableSide.price,
              reason: `Perfect complement under your ₹${budget || 500} target`
            });
          }
        }

        const totalPrice = comboItems.reduce((acc, curr) => acc + curr.subtotal, 0);
        if (!budget || totalPrice <= budget) {
          const matchedCriteria: string[] = [];
          if (isVeg !== undefined) matchedCriteria.push(isVeg ? 'Vegetarian Verified' : 'Non-Veg Approved');
          if (budget) matchedCriteria.push(`₹${totalPrice} (Saved ₹${budget - totalPrice} under budget)`);
          matchedCriteria.push(`Est. ${restaurant.deliveryTime}`);
          if (partySize > 1) matchedCriteria.push(`Portioned for ${partySize} persons`);

          combos.push({
            id: `combo_${restaurant.id}_${main.id}`,
            title: `${restaurant.name} ${mealType} Set`,
            restaurant,
            items: comboItems,
            totalPrice,
            budgetUtilization: budget ? `${Math.round((totalPrice / budget) * 100)}% of budget` : 'Optimal value',
            matchedCriteria,
            explanation: `Curated ${mealType.toLowerCase()} from ${restaurant.name} featuring ${comboItems.map(c => c.dish.name).join(' & ')}. Ready in ${restaurant.deliveryTime} for only ₹${totalPrice}.`
          });
        }
      }
    }
  }

  // Sort combos by best rating and price fit
  combos.sort((a, b) => b.restaurant.rating - a.restaurant.rating || a.totalPrice - b.totalPrice);
  const selectedCombos = combos.slice(0, 4);

  // Individual highlight dishes
  const individualDishes = allItems
    .filter(d => !budget || d.price <= budget)
    .slice(0, 6)
    .map(dish => ({
      dish,
      restaurant: restaurantMap.get(dish.restaurantId)!,
      reason: `Rated ⭐ ${dish.rating} · ₹${dish.price}`
    }));

  let summaryMessage = '';
  if (selectedCombos.length > 0) {
    summaryMessage = `I found ${selectedCombos.length} tailored ${isVeg ? 'vegetarian ' : ''}curations for you${budget ? ` within your ₹${budget} budget` : ''}${maxDeliveryMinutes ? ` delivered in under ${maxDeliveryMinutes} mins` : ''}. Review and tap to add any combo directly to your cart!`;
  } else if (individualDishes.length > 0) {
    summaryMessage = `Here are some popular ${isVeg ? 'vegetarian ' : ''}dishes that closely match your criteria.`;
  } else {
    summaryMessage = `No exact catalogue dishes matched all constraints (budget: ₹${budget}, ${isVeg ? 'veg only' : 'all'}, max time: ${maxDeliveryMinutes}m). Try increasing the budget slightly or choosing a different cuisine!`;
  }

  return {
    query: userQuery,
    mode: 'deterministic_engine',
    interpretation: {
      budget,
      isVeg,
      maxDeliveryTimeMinutes: maxDeliveryMinutes,
      cuisine: undefined,
      partySize,
      mealType,
      keywords
    },
    combos: selectedCombos,
    individualDishes,
    summaryMessage
  };
}
