import fs from 'fs/promises';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'database.json');

export interface Database {
  users: any[];
  stores: any[];
  products: any[];
  orders: any[];
}

const initialData: Database = {
  users: [],
  stores: [
    {
      id: "demo-store-1",
      name: "Corner Grocery",
      phone: "9998887776",
      ownerId: "system",
      address: "Downtown Market Square",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  products: [
    {
      id: "dp1",
      name: "Premium Coffee Beans",
      price: 599,
      unit: "Pack",
      description: "Dark roast, 500g pack.",
      storeId: "demo-store-1",
      stock: 100,
      imageUrl: "https://images.unsplash.com/photo-1559056191-7417f245847e?w=400",
      isAvailable: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "dp2",
      name: "Whole Grain Bread",
      price: 60,
      unit: "Nos",
      description: "Artisan sourdough bread.",
      storeId: "demo-store-1",
      stock: 30,
      imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
      isAvailable: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "dp3",
      name: "Green Tea Pack",
      price: 250,
      unit: "Pack",
      description: "Organic jasmine green tea.",
      storeId: "demo-store-1",
      stock: 45,
      imageUrl: "https://images.unsplash.com/photo-1544787210-2213d4b12fe0?w=400",
      isAvailable: true,
      createdAt: new Date().toISOString(),
    }
  ],
  orders: []
};

export async function readDb(): Promise<Database> {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return initialData;
  }
}

export async function writeDb(data: Database): Promise<void> {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}
