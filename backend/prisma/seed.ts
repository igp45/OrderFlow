import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding menu items...');

  await prisma.menuItem.deleteMany();

  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Classic Cheeseburger',
        description: 'Juicy beef patty with cheddar cheese, lettuce, tomato, and our house sauce on a brioche bun.',
        price: 12.99,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
        category: 'Burgers',
        available: true,
      },
      {
        name: 'Margherita Pizza',
        description: 'Wood-fired pizza with San Marzano tomato sauce, fresh mozzarella, and basil.',
        price: 14.99,
        imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400',
        category: 'Pizza',
        available: true,
      },
      {
        name: 'Crispy Fries',
        description: 'Golden, hand-cut fries seasoned with sea salt and served with house dipping sauce.',
        price: 4.99,
        imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
        category: 'Sides',
        available: true,
      },
      {
        name: 'Southern Fried Chicken',
        description: 'Crispy buttermilk-marinated fried chicken with coleslaw and honey mustard.',
        price: 13.99,
        imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400',
        category: 'Chicken',
        available: true,
      },
      {
        name: 'Soft Drink',
        description: 'Your choice of Coke, Diet Coke, Sprite, or Lemonade. Served over ice.',
        price: 2.99,
        imageUrl: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400',
        category: 'Drinks',
        available: true,
      },
    ],
  });

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
