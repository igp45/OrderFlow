import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ITEMS = [
  // Burgers
  { name: 'Classic Cheeseburger', description: 'Juicy beef patty with cheddar cheese, lettuce, tomato, and our house sauce on a brioche bun.', price: 12.99, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', category: 'Burgers' },
  { name: 'Bacon BBQ Burger', description: 'Double beef patty loaded with crispy bacon, BBQ sauce, caramelised onions, and pickles.', price: 15.99, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400', category: 'Burgers' },
  { name: 'Veggie Burger', description: 'House-made black bean and chickpea patty with avocado, roasted peppers, and herb aioli.', price: 11.99, imageUrl: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400', category: 'Burgers' },
  // Pizza
  { name: 'Margherita Pizza', description: 'Wood-fired pizza with San Marzano tomato sauce, fresh mozzarella, and basil.', price: 14.99, imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400', category: 'Pizza' },
  { name: 'Pepperoni Pizza', description: 'Classic tomato base loaded with generous pepperoni slices and melted mozzarella.', price: 16.99, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', category: 'Pizza' },
  { name: 'BBQ Chicken Pizza', description: 'Smoky BBQ sauce, grilled chicken, red onions, corn, and mozzarella on a crispy base.', price: 17.99, imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', category: 'Pizza' },
  // Chicken
  { name: 'Southern Fried Chicken', description: 'Crispy buttermilk-marinated fried chicken with coleslaw and honey mustard.', price: 13.99, imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400', category: 'Chicken' },
  { name: 'Chicken Wings (8pc)', description: 'Crispy wings tossed in your choice of buffalo, honey garlic, or BBQ sauce.', price: 11.99, imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400', category: 'Chicken' },
  { name: 'Grilled Chicken Wrap', description: 'Herb-marinated grilled chicken, lettuce, tomato, and garlic mayo in a toasted flour wrap.', price: 10.99, imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400', category: 'Chicken' },
  // Mains
  { name: 'Fish & Chips', description: 'Beer-battered cod fillet with thick-cut chips, mushy peas, and tartar sauce.', price: 15.99, imageUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=400', category: 'Mains' },
  { name: 'Grilled Salmon', description: 'Atlantic salmon fillet with lemon butter sauce, seasonal vegetables, and garlic mash.', price: 18.99, imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400', category: 'Mains' },
  { name: 'Caesar Salad', description: 'Crisp romaine lettuce, parmesan, house croutons, and classic Caesar dressing.', price: 9.99, imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400', category: 'Mains' },
  // Sides
  { name: 'Crispy Fries', description: 'Golden, hand-cut fries seasoned with sea salt and served with house dipping sauce.', price: 4.99, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', category: 'Sides' },
  { name: 'Onion Rings', description: 'Thick-cut onion rings in a crispy golden batter with smoky chipotle dip.', price: 5.99, imageUrl: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400', category: 'Sides' },
  { name: 'Sweet Potato Fries', description: 'Crispy sweet potato fries with a sprinkle of smoked paprika and sour cream dip.', price: 5.49, imageUrl: 'https://images.unsplash.com/photo-1629689782037-4ae5e97f4e3e?w=400', category: 'Sides' },
  { name: 'Mac & Cheese', description: 'Creamy three-cheese macaroni baked with a golden breadcrumb crust.', price: 7.99, imageUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400', category: 'Sides' },
  // Drinks
  { name: 'Soft Drink', description: 'Your choice of Coke, Diet Coke, Sprite, or Lemonade. Served over ice.', price: 2.99, imageUrl: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400', category: 'Drinks' },
  { name: 'Fresh Lemonade', description: 'House-squeezed lemonade with fresh mint and a hint of ginger. Refreshing and sweet.', price: 3.99, imageUrl: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400', category: 'Drinks' },
  { name: 'Iced Coffee', description: 'Double-shot espresso over ice with your choice of milk. Add syrup for 50p extra.', price: 4.49, imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', category: 'Drinks' },
  { name: 'Mango Smoothie', description: 'Blended fresh mango, yoghurt, and honey — thick, creamy, and tropical.', price: 5.49, imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400', category: 'Drinks' },
  { name: 'Milkshake', description: 'Thick, creamy milkshake in chocolate, vanilla, or strawberry. Topped with whipped cream.', price: 5.99, imageUrl: 'https://images.unsplash.com/photo-1572490122747-3e9197aa5e7d?w=400', category: 'Drinks' },
  // Desserts
  { name: 'Chocolate Brownie', description: 'Warm gooey chocolate brownie served with vanilla ice cream and chocolate drizzle.', price: 6.99, imageUrl: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400', category: 'Desserts' },
  { name: 'New York Cheesecake', description: 'Classic creamy cheesecake on a buttery biscuit base with seasonal berry coulis.', price: 7.49, imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400', category: 'Desserts' },
  { name: 'Vanilla Ice Cream', description: 'Three scoops of rich Madagascar vanilla ice cream with your choice of sauce.', price: 4.99, imageUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400', category: 'Desserts' },
];

async function main() {
  console.log('Seeding menu items...');
  const existing = await prisma.menuItem.findMany({ select: { name: true } });
  const existingNames = new Set(existing.map(i => i.name));
  const newItems = ITEMS.filter(i => !existingNames.has(i.name));

  if (newItems.length > 0) {
    await prisma.menuItem.createMany({ data: newItems.map(i => ({ ...i, available: true })) });
    console.log(`Added ${newItems.length} new items.`);
  } else {
    console.log('All items already exist.');
  }
  console.log('Done!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
