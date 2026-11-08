import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import type {
  User,
  Restaurant,
  MenuItem,
  Order,
  Coupon,
  OrderStatus,
  OrderTimelineEvent
} from '../../src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, '../data');
const DB_FILE = process.env.DATABASE_FILE || path.join(DATA_DIR, 'db.json');

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface DatabaseSchema {
  users: User[];
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  orders: Order[];
  coupons: Coupon[];
  auditLogs: AuditLog[];
}

export class DatabaseStore {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadDatabase();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.warn('Could not read existing database file, reseeding initial data:', err);
      }
    }
    const initial = this.getInitialSeedData();
    this.saveDatabase(initial);
    return initial;
  }

  public save() {
    this.saveDatabase(this.data);
  }

  private saveDatabase(data: DatabaseSchema) {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write to database file:', err);
    }
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public addUser(user: User): User {
    this.data.users.push(user);
    this.logAudit('USER_REGISTERED', user.id, { email: user.email, role: user.role });
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    return this.data.users[idx];
  }

  // --- Restaurants ---
  public getRestaurants(): Restaurant[] {
    return this.data.restaurants;
  }

  public getRestaurantById(id: string): Restaurant | undefined {
    return this.data.restaurants.find(r => r.id === id);
  }

  public updateRestaurant(id: string, updates: Partial<Restaurant>): Restaurant | null {
    const idx = this.data.restaurants.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.data.restaurants[idx] = { ...this.data.restaurants[idx], ...updates };
    this.logAudit('RESTAURANT_UPDATED', 'system', { restaurantId: id, updates });
    this.save();
    return this.data.restaurants[idx];
  }

  // --- Menu Items ---
  public getMenuItems(restaurantId?: string): MenuItem[] {
    if (restaurantId) {
      return this.data.menuItems.filter(m => m.restaurantId === restaurantId);
    }
    return this.data.menuItems;
  }

  public getMenuItemById(id: string): MenuItem | undefined {
    return this.data.menuItems.find(m => m.id === id);
  }

  public updateMenuItem(id: string, updates: Partial<MenuItem>): MenuItem | null {
    const idx = this.data.menuItems.findIndex(m => m.id === id);
    if (idx === -1) return null;
    this.data.menuItems[idx] = { ...this.data.menuItems[idx], ...updates };
    this.logAudit('MENU_ITEM_UPDATED', 'restaurant_partner', { itemId: id, updates });
    this.save();
    return this.data.menuItems[idx];
  }

  public addMenuItem(item: MenuItem): MenuItem {
    this.data.menuItems.push(item);
    this.logAudit('MENU_ITEM_ADDED', 'restaurant_partner', { itemId: item.id, name: item.name });
    this.save();
    return item;
  }

  public deleteMenuItem(id: string): boolean {
    const lenBefore = this.data.menuItems.length;
    this.data.menuItems = this.data.menuItems.filter(m => m.id !== id);
    const deleted = this.data.menuItems.length < lenBefore;
    if (deleted) {
      this.logAudit('MENU_ITEM_DELETED', 'restaurant_partner', { itemId: id });
      this.save();
    }
    return deleted;
  }

  // --- Orders ---
  public getOrders(filters?: { userId?: string; restaurantId?: string; courierId?: string }): Order[] {
    let orders = [...this.data.orders];
    if (filters?.userId) orders = orders.filter(o => o.userId === filters.userId);
    if (filters?.restaurantId) orders = orders.filter(o => o.restaurantId === filters.restaurantId);
    if (filters?.courierId) orders = orders.filter(o => o.courierId === filters.courierId);
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrderById(id: string): Order | undefined {
    return this.data.orders.find(o => o.id === id);
  }

  public createOrder(order: Order): Order {
    this.data.orders.unshift(order);
    this.logAudit('ORDER_CREATED', order.userId, { orderId: order.id, total: order.total, restaurantId: order.restaurantId });
    this.save();
    return order;
  }

  public updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    performedBy: string,
    description: string,
    extras?: { courierId?: string; courierName?: string; courierPhone?: string; cancellationReason?: string }
  ): Order | null {
    const order = this.data.orders.find(o => o.id === orderId);
    if (!order) return null;

    // Validate state transitions
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PLACED: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'],
      READY_FOR_PICKUP: ['OUT_FOR_DELIVERY', 'CANCELLED'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
      DELIVERED: ['REFUNDED'],
      CANCELLED: ['REFUNDED'],
      REFUNDED: []
    };

    if (!validTransitions[order.status]?.includes(newStatus)) {
      throw new Error(`Invalid state transition from ${order.status} to ${newStatus}`);
    }

    order.status = newStatus;
    order.updatedAt = new Date().toISOString();

    if (extras?.courierId) order.courierId = extras.courierId;
    if (extras?.courierName) order.courierName = extras.courierName;
    if (extras?.courierPhone) order.courierPhone = extras.courierPhone;
    if (extras?.cancellationReason) order.cancellationReason = extras.cancellationReason;

    const timelineEvent: OrderTimelineEvent = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      description,
      performedBy
    };
    order.timeline.push(timelineEvent);

    this.logAudit('ORDER_STATUS_CHANGED', performedBy, { orderId, oldStatus: order.status, newStatus });
    this.save();
    return order;
  }

  // --- Coupons ---
  public getCoupons(): Coupon[] {
    return this.data.coupons;
  }

  public getCouponByCode(code: string): Coupon | undefined {
    return this.data.coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
  }

  // --- Audit Logs ---
  public logAudit(action: string, performedBy: string, details: Record<string, any>) {
    const log: AuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      action,
      performedBy,
      details,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
  }

  public getAuditLogs(limit: number = 50): AuditLog[] {
    return this.data.auditLogs.slice(0, limit);
  }

  // --- Initial Seed Data ---
  private getInitialSeedData(): DatabaseSchema {
    const passwordHash = bcrypt.hashSync('foodrush123', 8);

    const users: User[] = [
      {
        id: 'usr_admin',
        name: 'Chief Admin',
        email: 'admin@foodrush.com',
        role: 'admin',
        phone: '+91 9876543200',
        avatar: '/assets/user-sign.jpg',
        passwordHash,
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 'usr_paradise',
        name: 'Manager Paradise',
        email: 'partner@paradise.com',
        role: 'restaurant',
        restaurantId: 'res_paradise',
        phone: '+91 9876543201',
        avatar: '/assets/user-sign.jpg',
        passwordHash,
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 'usr_nawabi',
        name: 'Manager Nawabi',
        email: 'partner@nawabi.com',
        role: 'restaurant',
        restaurantId: 'res_nawabi',
        phone: '+91 9876543202',
        avatar: '/assets/user-sign.jpg',
        passwordHash,
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 'usr_courier',
        name: 'Rajesh Kumar',
        email: 'courier@foodrush.com',
        role: 'delivery',
        deliveryVehicle: 'TVS Raider 125 (TN-09-CB-4491)',
        deliveryStatus: 'online',
        rating: 4.9,
        phone: '+91 9876543210',
        avatar: '/assets/free-delivery-logo-with-bike-man-courier_1308-48827.avif',
        passwordHash,
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 'usr_customer',
        name: 'Bonasi Vyshnavi',
        email: 'vyshnavi@foodrush.com',
        role: 'customer',
        phone: '+91 9876543299',
        avatar: '/assets/user-sign.jpg',
        passwordHash,
        createdAt: '2026-01-01T00:00:00.000Z'
      }
    ];

    const restaurants: Restaurant[] = [
      {
        id: 'res_paradise',
        name: 'Paradise Biryani',
        tagline: 'World-famous authentic Hyderabadi Dum Biryani & Kebabs',
        image: '/assets/paradise biriyani.avif',
        bannerImage: '/assets/moody-banquet-banner.jpg',
        cuisines: ['Biryani', 'Hyderabadi', 'North Indian', 'Mughlai'],
        rating: 4.7,
        ratingCount: 1420,
        deliveryTime: '25-35 mins',
        deliveryFee: 30,
        priceForTwo: 550,
        address: 'MG Road, Central Food District',
        area: 'Central Hub',
        city: 'Chennai',
        coordinates: { lat: 13.0827, lng: 80.2707 },
        isOpen: true,
        isFeatured: true,
        categories: ['Biryani Specials', 'Starters', 'Main Course', 'Breads & Desserts'],
        totalOrdersServed: 8430
      },
      {
        id: 'res_nawabi',
        name: 'Nawabi Dum House',
        tagline: 'Royal Mughlai curries, succulent kebabs and rich aromas',
        image: '/assets/nawabi.jpg',
        bannerImage: '/assets/hero.jpeg',
        cuisines: ['Mughlai', 'North Indian', 'Biryani'],
        rating: 4.4,
        ratingCount: 980,
        deliveryTime: '30-40 mins',
        deliveryFee: 35,
        priceForTwo: 600,
        address: 'Nawab Palace Lane, High Street',
        area: 'High Street',
        city: 'Chennai',
        coordinates: { lat: 13.0855, lng: 80.2644 },
        isOpen: true,
        isFeatured: true,
        categories: ['Nawabi Specials', 'Mughlai Curries', 'Tandoor & Starters', 'Breads'],
        totalOrdersServed: 4320
      },
      {
        id: 'res_burgerhub',
        name: 'Burger Hub',
        tagline: 'Gourmet smashed burgers, loaded fries and crispy pizzas',
        image: '/assets/burger hub.jpeg',
        bannerImage: '/assets/background.jpeg',
        cuisines: ['Fast Food', 'Burgers', 'Pizza'],
        rating: 4.3,
        ratingCount: 810,
        deliveryTime: '20-30 mins',
        deliveryFee: 25,
        priceForTwo: 350,
        address: '4th Cross, Food Court Boulevard',
        area: 'Avenue West',
        city: 'Chennai',
        coordinates: { lat: 13.0789, lng: 80.2588 },
        isOpen: true,
        isFeatured: true,
        categories: ['Burgers', 'Pizza', 'Sides & Drinks'],
        totalOrdersServed: 5120
      },
      {
        id: 'res_dragonwok',
        name: 'Dragon Wok',
        tagline: 'Wok-tossed fiery Hakka noodles, dumplings and soups',
        image: '/assets/dragonwok.avif',
        bannerImage: '/assets/offersbackground.jpeg',
        cuisines: ['Chinese', 'Asian', 'Noodles'],
        rating: 4.6,
        ratingCount: 1120,
        deliveryTime: '25-35 mins',
        deliveryFee: 30,
        priceForTwo: 450,
        address: 'East Silk Road, Dragon Plaza',
        area: 'Metro East',
        city: 'Chennai',
        coordinates: { lat: 13.0901, lng: 80.2799 },
        isOpen: true,
        isFeatured: false,
        categories: ['Soups', 'Hakka Noodles', 'Starters', 'Wok Specials'],
        totalOrdersServed: 3890
      },
      {
        id: 'res_sweettooth',
        name: 'Sweet Tooth Bakery',
        tagline: 'Artisanal cakes, decadent pastries, donuts and brownies',
        image: '/assets/Sweet Tooth Bakery.avif',
        bannerImage: '/assets/moody-banquet-banner.jpg',
        cuisines: ['Desserts', 'Bakery', 'Cakes'],
        rating: 4.9,
        ratingCount: 1750,
        deliveryTime: '20-30 mins',
        deliveryFee: 25,
        priceForTwo: 300,
        address: 'Baker Street, Pastel Corner',
        area: 'South Park',
        city: 'Chennai',
        coordinates: { lat: 13.0734, lng: 80.2621 },
        isOpen: true,
        isFeatured: true,
        categories: ['Cakes', 'Pastries', 'Donuts & Brownies', 'Beverages'],
        totalOrdersServed: 7210
      },
      {
        id: 'res_andhra',
        name: 'Andhra Spice Kitchen',
        tagline: 'Fiery Andhra spicy curries, fragrant ghee roasts and tiffins',
        image: '/assets/andhraspicekitchen.avif',
        bannerImage: '/assets/background.jpeg',
        cuisines: ['South Indian', 'Andhra', 'Tiffins'],
        rating: 4.5,
        ratingCount: 940,
        deliveryTime: '20-30 mins',
        deliveryFee: 25,
        priceForTwo: 350,
        address: '7th Avenue, Spice Valley',
        area: 'Spice Gate',
        city: 'Chennai',
        coordinates: { lat: 13.0812, lng: 80.2811 },
        isOpen: true,
        isFeatured: false,
        categories: ['Tiffins', 'Andhra Meals', 'Curries', 'Beverages'],
        totalOrdersServed: 4120
      },
      {
        id: 'res_urbantadka',
        name: 'Urban Tadka',
        tagline: 'Rich gravies, smoky charcoal grills and comfort food',
        image: '/assets/urbantadka.jpg',
        bannerImage: '/assets/hero.jpeg',
        cuisines: ['North Indian', 'Mughlai', 'Tandoori'],
        rating: 4.4,
        ratingCount: 670,
        deliveryTime: '30-40 mins',
        deliveryFee: 35,
        priceForTwo: 500,
        address: '32 Urban Arcade',
        area: 'North City',
        city: 'Chennai',
        coordinates: { lat: 13.0955, lng: 80.2677 },
        isOpen: true,
        isFeatured: false,
        categories: ['Starters', 'Main Course', 'Rice & Breads'],
        totalOrdersServed: 2980
      },
      {
        id: 'res_bbqnation',
        name: 'BBQ Nation Express',
        tagline: 'Unlimited grill flavours, skewers and smoky tandoor bites',
        image: '/assets/bbq nation.avif',
        bannerImage: '/assets/tandoori-skewers.webp',
        cuisines: ['North Indian', 'BBQ', 'Tandoori'],
        rating: 4.8,
        ratingCount: 2200,
        deliveryTime: '30-45 mins',
        deliveryFee: 40,
        priceForTwo: 700,
        address: 'Express Avenue Level 3',
        area: 'Downtown',
        city: 'Chennai',
        coordinates: { lat: 13.0841, lng: 80.2733 },
        isOpen: true,
        isFeatured: true,
        categories: ['Grill Platters', 'Curries', 'Biryani'],
        totalOrdersServed: 9640
      }
    ];

    const menuItems: MenuItem[] = [
      // Paradise Biryani
      {
        id: 'item_pb_1',
        restaurantId: 'res_paradise',
        name: 'Chicken 65',
        description: 'Crispy fried boneless chicken tossed in aromatic curry leaves, green chilies, and fiery Hyderabadi spices.',
        price: 299,
        image: '/assets/65.jpg',
        category: 'Starters',
        cuisine: 'Hyderabadi',
        isVeg: false,
        isPopular: true,
        spiceLevel: 'spicy',
        rating: 4.8,
        preparationTimeMinutes: 18,
        inStock: true,
        variants: [
          { id: 'v_half', name: 'Half (6 pcs)', price: 299 },
          { id: 'v_full', name: 'Full (12 pcs)', price: 499 }
        ],
        addons: [
          { id: 'a_lemon', name: 'Extra Fried Chilly & Lime', price: 20 },
          { id: 'a_sauce', name: 'Mint Chutney Dip', price: 30 }
        ],
        allergens: ['Gluten', 'Eggs'],
        calories: 420
      },
      {
        id: 'item_pb_2',
        restaurantId: 'res_paradise',
        name: 'Paneer Tikka',
        description: 'Charcoal-grilled cottage cheese cubes marinated in Kashmiri chili yogurt, carom seeds and bell peppers.',
        price: 279,
        image: '/assets/Paneer-Tikka-Featured-1.jpg',
        category: 'Starters',
        cuisine: 'North Indian',
        isVeg: true,
        isPopular: true,
        spiceLevel: 'medium',
        rating: 4.6,
        preparationTimeMinutes: 15,
        inStock: true,
        variants: [
          { id: 'v_reg', name: 'Regular', price: 279 },
          { id: 'v_cheese', name: 'Cheese Stuffed', price: 329 }
        ],
        addons: [
          { id: 'a_chutney', name: 'Special Garlic Chutney', price: 25 }
        ],
        allergens: ['Dairy'],
        calories: 380
      },
      {
        id: 'item_pb_3',
        restaurantId: 'res_paradise',
        name: 'Hyderabadi Chicken Biryani',
        description: 'World-famous slow-cooked long-grain Basmati rice, marinated tender chicken, saffron milk, and layered royal pot aromatics. Served with Mirchi ka Salan & Raita.',
        price: 289,
        image: '/assets/chickenbiriyani.jpg',
        category: 'Biryani Specials',
        cuisine: 'Hyderabadi',
        isVeg: false,
        isPopular: true,
        spiceLevel: 'medium',
        rating: 4.9,
        preparationTimeMinutes: 20,
        inStock: true,
        variants: [
          { id: 'v_single', name: 'Single (1 pc + Egg)', price: 289 },
          { id: 'v_special', name: 'Special (2 pcs + 2 Eggs)', price: 429 },
          { id: 'v_family', name: 'Family Pack (Serves 4)', price: 899 }
        ],
        addons: [
          { id: 'a_raita', name: 'Extra Boondi Raita', price: 35 },
          { id: 'a_salan', name: 'Extra Mirchi Ka Salan', price: 40 },
          { id: 'a_egg', name: 'Boiled Egg (2 pcs)', price: 30 }
        ],
        calories: 680
      },
      {
        id: 'item_pb_4',
        restaurantId: 'res_paradise',
        name: 'Butter Chicken',
        description: 'Succulent tandoor chicken simmered in a velvety tomato, cashew and butter gravy finished with dried fenugreek leaves.',
        price: 299,
        image: '/assets/Butter-Chicken-Tall-FS-34.webp',
        category: 'Main Course',
        cuisine: 'North Indian',
        isVeg: false,
        isPopular: true,
        spiceLevel: 'mild',
        rating: 4.7,
        preparationTimeMinutes: 20,
        inStock: true,
        variants: [
          { id: 'v_boneless', name: 'Boneless Cubes', price: 299 },
          { id: 'v_bone', name: 'Tandoori Bone-in', price: 319 }
        ],
        addons: [
          { id: 'a_butter', name: 'Extra Cream & White Butter', price: 35 }
        ],
        allergens: ['Dairy', 'Cashews'],
        calories: 540
      },
      {
        id: 'item_pb_5',
        restaurantId: 'res_paradise',
        name: 'Paneer Butter Masala',
        description: 'Fresh malai paneer simmered in rich satin makhani gravy enriched with fresh cream and butter.',
        price: 269,
        image: '/assets/paneerbuttermasala.jpg',
        category: 'Main Course',
        cuisine: 'North Indian',
        isVeg: true,
        isPopular: true,
        spiceLevel: 'mild',
        rating: 4.7,
        preparationTimeMinutes: 18,
        inStock: true,
        addons: [
          { id: 'a_extra_cheese', name: 'Grated Amul Cheese', price: 40 }
        ],
        allergens: ['Dairy'],
        calories: 490
      },
      {
        id: 'item_pb_6',
        restaurantId: 'res_paradise',
        name: 'Garlic Butter Naan',
        description: 'Traditional clay oven baked flatbread smeared with garlic chips, coriander and fresh melted butter.',
        price: 49,
        image: '/assets/Garlic Naan.jpg',
        category: 'Breads & Desserts',
        cuisine: 'North Indian',
        isVeg: true,
        rating: 4.8,
        preparationTimeMinutes: 10,
        inStock: true,
        calories: 160
      },
      {
        id: 'item_pb_7',
        restaurantId: 'res_paradise',
        name: 'Tandoori Chicken Skewers',
        description: 'Whole chicken cutlets marinated for 12 hours in smoked mustard oil, hung curd, ginger garlic and roasted cumin.',
        price: 320,
        image: '/assets/tandoori-chicken-hero.jpg',
        category: 'Starters',
        cuisine: 'North Indian',
        isVeg: false,
        spiceLevel: 'spicy',
        rating: 4.7,
        preparationTimeMinutes: 22,
        inStock: true,
        calories: 490
      },

      // Nawabi Dum House
      {
        id: 'item_nw_1',
        restaurantId: 'res_nawabi',
        name: 'Murgh Musallam',
        description: 'Royal court Mughlai delicacy cooked in rich brown onion, poppy seed and roasted almond paste.',
        price: 349,
        image: '/assets/Murgh Musallam.jpg',
        category: 'Nawabi Specials',
        cuisine: 'Mughlai',
        isVeg: false,
        isPopular: true,
        spiceLevel: 'medium',
        rating: 4.8,
        preparationTimeMinutes: 25,
        inStock: true,
        calories: 620
      },
      {
        id: 'item_nw_2',
        restaurantId: 'res_nawabi',
        name: 'Nawabi Chicken Korma',
        description: 'Mildly spiced aromatic stew infused with green cardamom, mace, rose water, and slow-fried cashews.',
        price: 299,
        image: '/assets/Nawabi Chicken Korma.jpg',
        category: 'Mughlai Curries',
        cuisine: 'Mughlai',
        isVeg: false,
        spiceLevel: 'mild',
        rating: 4.5,
        preparationTimeMinutes: 22,
        inStock: true,
        calories: 550
      },
      {
        id: 'item_nw_3',
        restaurantId: 'res_nawabi',
        name: 'Shahi Paneer',
        description: 'Royal cottage cheese triangles cooked in sweet and savoury saffron almond makhani sauce.',
        price: 279,
        image: '/assets/ShahiPaneer-3.jpg',
        category: 'Mughlai Curries',
        cuisine: 'Mughlai',
        isVeg: true,
        spiceLevel: 'mild',
        rating: 4.6,
        preparationTimeMinutes: 18,
        inStock: true,
        calories: 460
      },
      {
        id: 'item_nw_4',
        restaurantId: 'res_nawabi',
        name: 'Mutton Seekh Kebab',
        description: 'Minced lamb blended with royal spices, mint and chopped onions, skewered and char-grilled over embers.',
        price: 369,
        image: '/assets/Mutton-seekh-kabab-recipe-1-2.jpg',
        category: 'Tandoor & Starters',
        cuisine: 'Mughlai',
        isVeg: false,
        spiceLevel: 'spicy',
        rating: 4.9,
        preparationTimeMinutes: 20,
        inStock: true,
        calories: 510
      },

      // Burger Hub
      {
        id: 'item_bh_1',
        restaurantId: 'res_burgerhub',
        name: 'Double Patty Crunchy Burger',
        description: 'Two grilled seasoned patties layered with melted yellow cheddar, gherkins, crisp lettuce and secret rush sauce.',
        price: 169,
        image: '/assets/burger.jpg',
        category: 'Burgers',
        cuisine: 'Fast Food',
        isVeg: false,
        isPopular: true,
        rating: 4.6,
        preparationTimeMinutes: 15,
        inStock: true,
        variants: [
          { id: 'v_chick', name: 'Double Chicken Patty', price: 169 },
          { id: 'v_veg', name: 'Double Crispy Veg Patty', price: 149 }
        ],
        addons: [
          { id: 'a_cheese_slice', name: 'Extra Melted Cheddar', price: 25 },
          { id: 'a_fries_combo', name: 'Make it a Meal (Fries + Coke)', price: 89 }
        ],
        calories: 580
      },
      {
        id: 'item_bh_2',
        restaurantId: 'res_burgerhub',
        name: 'Cheese Burst Veggie Pizza',
        description: 'Fresh dough pizza loaded with gooey mozzarella in the crust, topped with capsicum, black olives, sweet corn and jalapeños.',
        price: 249,
        image: '/assets/pizza.jpg',
        category: 'Pizza',
        cuisine: 'Pizza',
        isVeg: true,
        isPopular: true,
        rating: 4.8,
        preparationTimeMinutes: 20,
        inStock: true,
        variants: [
          { id: 'v_med', name: 'Medium (Serves 2)', price: 249 },
          { id: 'v_large', name: 'Large (Serves 4)', price: 399 }
        ],
        calories: 720
      },
      {
        id: 'item_bh_3',
        restaurantId: 'res_burgerhub',
        name: 'Choco Lava Cupcake',
        description: 'Warm chocolate sponge cupcake with an indulgent flowing Belgian chocolate molten center.',
        price: 99,
        image: '/assets/lava-cupcake1.jpg',
        category: 'Sides & Drinks',
        cuisine: 'Fast Food',
        isVeg: true,
        rating: 4.9,
        preparationTimeMinutes: 10,
        inStock: true,
        calories: 320
      },

      // Sweet Tooth Bakery
      {
        id: 'item_st_1',
        restaurantId: 'res_sweettooth',
        name: 'Chocolate Truffle Cake (500g)',
        description: 'Rich moist dark chocolate sponge filled and frosted with silky dark chocolate ganache glaze.',
        price: 349,
        image: '/assets/chocolate-truffle-cake-8844.jpg',
        category: 'Cakes',
        cuisine: 'Bakery',
        isVeg: true,
        isPopular: true,
        rating: 4.9,
        preparationTimeMinutes: 15,
        inStock: true,
        calories: 820
      },
      {
        id: 'item_st_2',
        restaurantId: 'res_sweettooth',
        name: 'Blueberry Cheesecake Slice',
        description: 'New York style baked cream cheese over buttery biscuit crumble, topped with wild blueberry compote.',
        price: 189,
        image: '/assets/Blueberry-Cheesecake_1_1200x1200.webp',
        category: 'Pastries',
        cuisine: 'Desserts',
        isVeg: true,
        isPopular: true,
        rating: 4.9,
        preparationTimeMinutes: 10,
        inStock: true,
        calories: 390
      },
      {
        id: 'item_st_3',
        restaurantId: 'res_sweettooth',
        name: 'Warm Fudge Chocolate Brownie',
        description: 'Dense, chewy chocolate brownie loaded with toasted walnuts and drizzled with chocolate sauce.',
        price: 129,
        image: '/assets/chocolate brownie.jpg',
        category: 'Donuts & Brownies',
        cuisine: 'Desserts',
        isVeg: true,
        rating: 4.7,
        preparationTimeMinutes: 8,
        inStock: true,
        addons: [
          { id: 'a_icecream', name: 'Vanilla Ice Cream Scoop', price: 40 }
        ],
        calories: 310
      },
      {
        id: 'item_st_4',
        restaurantId: 'res_sweettooth',
        name: 'Rainbow Sprinkle Donut',
        description: 'Fresh glazed ring donut coated with pink strawberry icing and multi-color crispy sprinkles.',
        price: 79,
        image: '/assets/Rainbow Sprinkle Donut.jpg',
        category: 'Donuts & Brownies',
        cuisine: 'Desserts',
        isVeg: true,
        rating: 4.5,
        preparationTimeMinutes: 5,
        inStock: true,
        calories: 240
      },

      // Andhra Spice Kitchen / South Indian
      {
        id: 'item_as_1',
        restaurantId: 'res_andhra',
        name: 'Ghee Roast Masala Dosa',
        description: 'Golden crisp fermented crepe roasted in pure desi ghee, filled with spiced potato masala, served with 3 chutneys & piping hot sambar.',
        price: 99,
        image: '/assets/dosadelight.jpg',
        category: 'Tiffins',
        cuisine: 'South Indian',
        isVeg: true,
        isPopular: true,
        rating: 4.8,
        preparationTimeMinutes: 12,
        inStock: true,
        addons: [
          { id: 'a_podipodi', name: 'Gunpowder Podi & Ghee', price: 30 }
        ],
        calories: 350
      },
      {
        id: 'item_as_2',
        restaurantId: 'res_andhra',
        name: 'Steamed Idli Sambar (4 pcs)',
        description: 'Feather-light steamed rice cakes served with authentic drumstick sambar and fresh coconut chutney.',
        price: 59,
        image: '/assets/idly express.jpg',
        category: 'Tiffins',
        cuisine: 'South Indian',
        isVeg: true,
        rating: 4.7,
        preparationTimeMinutes: 10,
        inStock: true,
        calories: 210
      },
      {
        id: 'item_as_3',
        restaurantId: 'res_andhra',
        name: 'Royal Andhra Meals',
        description: 'Complete feast with steamed sona masoori rice, gongura pachadi, pappu, sambar, rasam, kootu, curd and crisp papad.',
        price: 199,
        image: '/assets/meals.jpg',
        category: 'Andhra Meals',
        cuisine: 'South Indian',
        isVeg: true,
        isPopular: true,
        rating: 4.7,
        preparationTimeMinutes: 15,
        inStock: true,
        calories: 650
      },

      // Dragon Wok
      {
        id: 'item_dw_1',
        restaurantId: 'res_dragonwok',
        name: 'Veg Hakka Noodles',
        description: 'Wok-tossed noodles with julienned cabbage, carrots, capsicum, spring onions and toasted sesame oil.',
        price: 179,
        image: '/assets/chineese.jpg',
        category: 'Hakka Noodles',
        cuisine: 'Chinese',
        isVeg: true,
        isPopular: true,
        rating: 4.6,
        preparationTimeMinutes: 15,
        inStock: true,
        calories: 390
      },
      {
        id: 'item_dw_2',
        restaurantId: 'res_dragonwok',
        name: 'Fiery Dragon Chilli Chicken',
        description: 'Crispy diced chicken tossed with red bird-eye chilies, capsicum, soy sauce and Chinese wine.',
        price: 249,
        image: '/assets/chilli chicken.jpg',
        category: 'Starters',
        cuisine: 'Chinese',
        isVeg: false,
        spiceLevel: 'spicy',
        rating: 4.7,
        preparationTimeMinutes: 18,
        inStock: true,
        calories: 440
      }
    ];

    const coupons: Coupon[] = [
      {
        code: 'FIRST50',
        title: '50% OFF First Order',
        discountPercent: 50,
        maxDiscount: 150,
        minOrderValue: 199,
        description: 'Flat 50% discount up to ₹150 for new FoodRush X users.',
        expiryDate: '2027-12-31'
      },
      {
        code: 'BIRYANI145',
        title: 'Weekend Biryani Feast',
        discountPercent: 40,
        maxDiscount: 145,
        minOrderValue: 299,
        description: '40% discount on Paradise Biryani & Nawabi Dum House.',
        expiryDate: '2027-12-31',
        applicableCategory: 'Biryani'
      },
      {
        code: 'SWEET30',
        title: 'Dessert Rush',
        discountPercent: 30,
        maxDiscount: 100,
        minOrderValue: 199,
        description: '30% off on cakes, pastries and brownies at Sweet Tooth Bakery.',
        expiryDate: '2027-12-31',
        applicableCategory: 'Desserts'
      },
      {
        code: 'SOUTH100',
        title: 'South Indian Super Saver',
        discountPercent: 40,
        maxDiscount: 100,
        minOrderValue: 199,
        description: '40% off on Andhra Meals, Dosas & Tiffins.',
        expiryDate: '2027-12-31'
      },
      {
        code: 'BURGER798',
        title: 'Burger Bonanza',
        discountPercent: 30,
        maxDiscount: 120,
        minOrderValue: 249,
        description: '30% off on all burgers & sides at Burger Hub.',
        expiryDate: '2027-12-31'
      },
      {
        code: 'CHICKEN453',
        title: 'Free Delivery Special',
        discountPercent: 10,
        maxDiscount: 50,
        minOrderValue: 199,
        description: 'Free delivery applied across all restaurants for orders above ₹199.',
        expiryDate: '2027-12-31'
      }
    ];

    // Seed realistic past & active orders
    const pastTimestamp = new Date(Date.now() - 3600000 * 24).toISOString();
    const recentTimestamp = new Date(Date.now() - 3600000 * 2).toISOString();
    const liveTimestamp = new Date(Date.now() - 600000).toISOString();

    const orders: Order[] = [
      {
        id: 'FRX-98214',
        userId: 'usr_customer',
        customerName: 'Bonasi Vyshnavi',
        customerPhone: '+91 9876543299',
        restaurantId: 'res_paradise',
        restaurantName: 'Paradise Biryani',
        restaurantAddress: 'MG Road, Central Food District',
        items: [
          {
            menuItemId: 'item_pb_3',
            name: 'Hyderabadi Chicken Biryani',
            price: 289,
            quantity: 1,
            image: '/assets/chickenbiriyani.jpg',
            isVeg: false,
            subtotal: 289
          },
          {
            menuItemId: 'item_pb_1',
            name: 'Chicken 65',
            price: 299,
            quantity: 1,
            image: '/assets/65.jpg',
            isVeg: false,
            subtotal: 299
          }
        ],
        subtotal: 588,
        tax: 29.4,
        deliveryFee: 30,
        discount: 145,
        couponCode: 'BIRYANI145',
        total: 502.4,
        status: 'DELIVERED',
        deliveryAddress: {
          fullName: 'Bonasi Vyshnavi',
          street: 'Apartment 402, Green Glen Residency, Anna Nagar',
          city: 'Chennai',
          pincode: '600040',
          phone: '+91 9876543299'
        },
        paymentMethod: 'UPI',
        paymentStatus: 'PAID',
        courierId: 'usr_courier',
        courierName: 'Rajesh Kumar',
        courierPhone: '+91 9876543210',
        estimatedDeliveryMinutes: 30,
        createdAt: pastTimestamp,
        updatedAt: pastTimestamp,
        timeline: [
          { status: 'PLACED', timestamp: pastTimestamp, description: 'Order successfully placed & paid via UPI' },
          { status: 'CONFIRMED', timestamp: pastTimestamp, description: 'Paradise Biryani accepted order' },
          { status: 'PREPARING', timestamp: pastTimestamp, description: 'Kitchen is preparing your dum biryani' },
          { status: 'READY_FOR_PICKUP', timestamp: pastTimestamp, description: 'Order packed with safety seals' },
          { status: 'OUT_FOR_DELIVERY', timestamp: pastTimestamp, description: 'Rajesh Kumar picked up your food' },
          { status: 'DELIVERED', timestamp: pastTimestamp, description: 'Order delivered safely. Enjoy your meal!' }
        ]
      },
      {
        id: 'FRX-98215',
        userId: 'usr_customer',
        customerName: 'Bonasi Vyshnavi',
        customerPhone: '+91 9876543299',
        restaurantId: 'res_sweettooth',
        restaurantName: 'Sweet Tooth Bakery',
        restaurantAddress: 'Baker Street, Pastel Corner',
        items: [
          {
            menuItemId: 'item_st_3',
            name: 'Warm Fudge Chocolate Brownie',
            price: 129,
            quantity: 2,
            image: '/assets/chocolate brownie.jpg',
            isVeg: true,
            subtotal: 258
          }
        ],
        subtotal: 258,
        tax: 12.9,
        deliveryFee: 25,
        discount: 50,
        couponCode: 'SWEET30',
        total: 245.9,
        status: 'OUT_FOR_DELIVERY',
        deliveryAddress: {
          fullName: 'Bonasi Vyshnavi',
          street: 'Apartment 402, Green Glen Residency, Anna Nagar',
          city: 'Chennai',
          pincode: '600040',
          phone: '+91 9876543299'
        },
        paymentMethod: 'CARD',
        paymentStatus: 'PAID',
        courierId: 'usr_courier',
        courierName: 'Rajesh Kumar',
        courierPhone: '+91 9876543210',
        courierCoords: { lat: 13.078, lng: 80.265 },
        estimatedDeliveryMinutes: 12,
        createdAt: liveTimestamp,
        updatedAt: liveTimestamp,
        timeline: [
          { status: 'PLACED', timestamp: liveTimestamp, description: 'Order placed & paid' },
          { status: 'CONFIRMED', timestamp: liveTimestamp, description: 'Sweet Tooth Bakery accepted order' },
          { status: 'PREPARING', timestamp: liveTimestamp, description: 'Baking and packing freshly' },
          { status: 'READY_FOR_PICKUP', timestamp: liveTimestamp, description: 'Order ready for dispatch' },
          { status: 'OUT_FOR_DELIVERY', timestamp: liveTimestamp, description: 'Rajesh Kumar is on the way to your door!' }
        ]
      }
    ];

    const auditLogs: AuditLog[] = [
      {
        id: 'log_init',
        action: 'SYSTEM_BOOTSTRAPPED',
        performedBy: 'system',
        details: { message: 'FoodRush X database initialized with authentic legacy menus and users' },
        timestamp: new Date().toISOString()
      }
    ];

    return {
      users,
      restaurants,
      menuItems,
      orders,
      coupons,
      auditLogs
    };
  }
}

export const db = new DatabaseStore();
