export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  display_order: number;
  created_at: string;
}

export interface FoodItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem extends FoodItem {
  quantity: number;
}

export interface MongoFoodItem {
  _id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  image?: string;
  available: boolean;
  preparationTime: number;
  spicy: boolean;
  vegetarian: boolean;
  rating: number;
  totalOrders: number;
  createdAt: string;
  updatedAt: string;
}

export interface MongoCategoryItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

let globalCategoryMap: Record<string, string> = {
  'pizza': '2',
  'burgers': '3',
  'pasta': '4',
  'salads': '5',
  'drinks': '6',
  'desserts': '7',
};

export function setCategoryMap(mongoCategories: MongoCategoryItem[]): void {
  globalCategoryMap = { 'all': '1' };
  mongoCategories.forEach((cat, index) => {
    globalCategoryMap[cat.name.toLowerCase()] = String(index + 2);
  });
}

export function mongoFoodToFoodItem(mongoFood: MongoFoodItem): FoodItem {
  console.log('Converting MongoDB food item to FoodItem:', {
    id: mongoFood._id,
    name: mongoFood.name,
    image: mongoFood.image
  });

  const categoryId = globalCategoryMap[mongoFood.category.toLowerCase()] || '1';

  return {
    id: mongoFood._id,
    name: mongoFood.name,
    description: mongoFood.description || null,
    price: mongoFood.price,
    image_url: mongoFood.image || null,
    category_id: categoryId,
    is_available: mongoFood.available,
    created_at: mongoFood.createdAt,
    updated_at: mongoFood.updatedAt,
  };
}

export function mongoCategoriesToFrontendCategories(mongoCategories: MongoCategoryItem[]): Category[] {
  const iconMap: Record<string, string> = {
    'pizza': 'Pizza',
    'burgers': 'Beef',
    'pasta': 'Cookie',
    'salads': 'Salad',
    'drinks': 'Coffee',
    'desserts': 'Cake',
  };

  const categories: Category[] = [
    {
      id: '1',
      name: 'All',
      slug: 'all',
      icon: 'UtensilsCrossed',
      display_order: 0,
      created_at: new Date().toISOString(),
    },
  ];

  mongoCategories.forEach((mongoCat, index) => {
    categories.push({
      id: String(index + 2),
      name: mongoCat.name,
      slug: mongoCat.slug,
      icon: iconMap[mongoCat.slug] || 'UtensilsCrossed',
      display_order: index + 1,
      created_at: mongoCat.createdAt,
    });
  });

  return categories;
}

export const categories: Category[] = [
  {
    id: '1',
    name: 'All',
    slug: 'all',
    icon: 'UtensilsCrossed',
    display_order: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Pizza',
    slug: 'pizza',
    icon: 'Pizza',
    display_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Burgers',
    slug: 'burgers',
    icon: 'Beef',
    display_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Pasta',
    slug: 'pasta',
    icon: 'Cookie',
    display_order: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Salads',
    slug: 'salads',
    icon: 'Salad',
    display_order: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Drinks',
    slug: 'drinks',
    icon: 'Coffee',
    display_order: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: '7',
    name: 'Desserts',
    slug: 'desserts',
    icon: 'Cake',
    display_order: 6,
    created_at: new Date().toISOString(),
  },
];

export const foodItems: FoodItem[] = [
  {
    id: '1',
    name: 'Margherita Pizza',
    description: 'Classic pizza with fresh mozzarella, tomatoes, and basil',
    price: 499,
    image_url: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg?auto=compress&cs=tinysrgb&w=800',
    category_id: '2',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Pepperoni Pizza',
    description: 'Loaded with pepperoni slices and mozzarella cheese',
    price: 599,
    image_url: 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=800',
    category_id: '2',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Classic Cheeseburger',
    description: 'Juicy beef patty with cheese, lettuce, tomato, and special sauce',
    price: 399,
    image_url: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800',
    category_id: '3',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Bacon Deluxe Burger',
    description: 'Double patty with crispy bacon, cheese, and caramelized onions',
    price: 499,
    image_url: 'https://images.pexels.com/photos/1556698/pexels-photo-1556698.jpeg?auto=compress&cs=tinysrgb&w=800',
    category_id: '3',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Carbonara Pasta',
    description: 'Creamy pasta with bacon, parmesan, and egg yolk',
    price: 449,
    image_url: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=800',
    category_id: '4',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Spaghetti Bolognese',
    description: 'Traditional Italian pasta with rich meat sauce',
    price: 10.99,
    image_url: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=800',
    category_id: '4',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7',
    name: 'Caesar Salad',
    description: 'Crisp romaine lettuce with Caesar dressing and croutons',
    price: 8.99,
    image_url: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=800',
    category_id: '5',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '8',
    name: 'Greek Salad',
    description: 'Fresh vegetables with feta cheese and olives',
    price: 9.99,
    image_url: 'https://images.pexels.com/photos/1213710/pexels-photo-1213710.jpeg?auto=compress&cs=tinysrgb&w=800',
    category_id: '5',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '9',
    name: 'Fresh Orange Juice',
    description: 'Freshly squeezed orange juice',
    price: 4.99,
    image_url: 'https://images.pexels.com/photos/1337825/pexels-photo-1337825.jpeg?auto=compress&cs=tinysrgb&w=800',
    category_id: '6',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '10',
    name: 'Iced Coffee',
    description: 'Cold brewed coffee with ice and milk',
    price: 5.99,
    image_url: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=800',
    category_id: '6',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '11',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with melted chocolate center',
    price: 7.99,
    image_url: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=800',
    category_id: '7',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '12',
    name: 'Tiramisu',
    description: 'Classic Italian dessert with coffee and mascarpone',
    price: 8.99,
    image_url: 'https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg?auto=compress&cs=tinysrgb&w=800',
    category_id: '7',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
