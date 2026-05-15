import express, { Request, Response } from 'express';
import { db } from '../services/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  deleteDoc, 
  addDoc,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { checkDuplicateStoreName, getLowItemStores } from '../lib/storeValidation';

const router = express.Router();

/**
 * Validate store name uniqueness
 * GET /api/stores/validate-name?name=X&ownerId=Y
 */
router.get('/validate-name', async (req: Request, res: Response) => {
  try {
    const { name, ownerId, excludeStoreId } = req.query as { name: string; ownerId: string; excludeStoreId?: string };

    if (!name || !ownerId) {
      return res.status(400).json({ error: 'Missing name or ownerId' });
    }

    const isDuplicate = await checkDuplicateStoreName(name, ownerId, excludeStoreId);

    if (isDuplicate) {
      return res.status(409).json({ 
        error: 'A store with this name already exists',
        isDuplicate: true 
      });
    }

    res.json({ isDuplicate: false, message: 'Store name is available' });
  } catch (error) {
    console.error('Error validating store name:', error);
    res.status(500).json({ error: 'Failed to validate store name' });
  }
});

/**
 * Get low-item stores for an owner
 * GET /api/stores/low-item/:ownerId
 */
router.get('/low-item/:ownerId', async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params;

    if (!ownerId) {
      return res.status(400).json({ error: 'Missing ownerId' });
    }

    const lowItemStores = await getLowItemStores(ownerId);

    res.json({ stores: lowItemStores, count: lowItemStores.length });
  } catch (error) {
    console.error('Error fetching low-item stores:', error);
    res.status(500).json({ error: 'Failed to fetch low-item stores' });
  }
});

/**
 * Create a new store
 * POST /api/stores
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, ownerId, description, items } = req.body;

    if (!name || !ownerId) {
      return res.status(400).json({ error: 'Missing required fields: name, ownerId' });
    }

    // Check for duplicates
    const isDuplicate = await checkDuplicateStoreName(name, ownerId);
    if (isDuplicate) {
      return res.status(409).json({ error: 'A store with this name already exists' });
    }

    // Create store document
    const storesRef = collection(db, 'stores');
    const newStore = {
      name,
      ownerId,
      description: description || '',
      items: items || [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(storesRef, newStore);

    res.status(201).json({
      id: docRef.id,
      ...newStore,
      createdAt: new Date((newStore.createdAt as any).toMillis()).toISOString(),
      updatedAt: new Date((newStore.updatedAt as any).toMillis()).toISOString(),
    });
  } catch (error) {
    console.error('Error creating store:', error);
    res.status(500).json({ error: 'Failed to create store' });
  }
});

/**
 * Delete a store
 * DELETE /api/stores/:storeId
 */
router.delete('/:storeId', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { ownerId } = req.body;

    if (!storeId || !ownerId) {
      return res.status(400).json({ error: 'Missing storeId or ownerId' });
    }

    // Verify ownership
    const storeRef = doc(db, 'stores', storeId);
    const storeDoc = await getDoc(storeRef);

    if (!storeDoc.exists()) {
      return res.status(404).json({ error: 'Store not found' });
    }

    if (storeDoc.data().ownerId !== ownerId) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this store' });
    }

    // Delete the store
    await deleteDoc(storeRef);

    res.json({ message: 'Store deleted successfully', storeId });
  } catch (error) {
    console.error('Error deleting store:', error);
    res.status(500).json({ error: 'Failed to delete store' });
  }
});

/**
 * Fetch daily sales statistics
 * GET /api/stores/:storeId/sales?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/:storeId/sales', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate } = req.query as { startDate: string; endDate: string };

    if (!storeId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Query orders for this store within the date range
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('storeId', '==', storeId),
      where('createdAt', '>=', new Date(startDate)),
      where('createdAt', '<=', new Date(endDate))
    );

    const querySnapshot = await getDocs(q);
    
    // Group by date and calculate metrics
    const dailyStats: Record<string, any> = {};

    querySnapshot.forEach(doc => {
      const order = doc.data();
      const date = new Date((order.createdAt as any).toDate()).toISOString().split('T')[0];

      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          revenue: 0,
          orders: 0,
          items: 0,
          avgOrderValue: 0,
        };
      }

      dailyStats[date].revenue += order.total || 0;
      dailyStats[date].orders += 1;
      dailyStats[date].items += (order.items?.length || 0);
    });

    // Calculate average order values
    const stats = Object.values(dailyStats).map((day: any) => ({
      ...day,
      avgOrderValue: day.orders > 0 ? day.revenue / day.orders : 0,
    }));

    // Sort by date
    stats.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({
      storeId,
      startDate,
      endDate,
      dailyStats: stats,
      totalDays: stats.length,
      totalRevenue: stats.reduce((sum: number, d: any) => sum + d.revenue, 0),
      totalOrders: stats.reduce((sum: number, d: any) => sum + d.orders, 0),
      totalItems: stats.reduce((sum: number, d: any) => sum + d.items, 0),
    });
  } catch (error) {
    console.error('Error fetching sales statistics:', error);
    res.status(500).json({ error: 'Failed to fetch sales statistics' });
  }
});

export default router;
