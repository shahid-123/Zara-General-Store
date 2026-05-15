import api from './api';

/**
 * Validate store name uniqueness
 */
export async function validateStoreName(name: string, ownerId: string, excludeStoreId?: string) {
  try {
    const response = await api.get('/stores/validate-name', {
      params: {
        name,
        ownerId,
        excludeStoreId,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error validating store name:', error);
    throw error;
  }
}

/**
 * Fetch low-item stores for an owner
 */
export async function fetchLowItemStores(ownerId: string) {
  try {
    const response = await api.get(`/stores/low-item/${ownerId}`);
    return response.data.stores;
  } catch (error) {
    console.error('Error fetching low-item stores:', error);
    throw error;
  }
}

/**
 * Create a new store
 */
export async function createStore(storeData: {
  name: string;
  ownerId: string;
  description?: string;
  items?: Array<any>;
}) {
  try {
    const response = await api.post('/stores', storeData);
    return response.data;
  } catch (error) {
    console.error('Error creating store:', error);
    throw error;
  }
}

/**
 * Delete a store
 */
export async function deleteStore(storeId: string, ownerId: string) {
  try {
    const response = await api.delete(`/stores/${storeId}`, {
      data: { ownerId },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting store:', error);
    throw error;
  }
}

/**
 * Fetch daily sales statistics
 */
export async function fetchSalesStatistics(
  storeId: string,
  startDate: string,
  endDate: string
) {
  try {
    const response = await api.get(`/stores/${storeId}/sales`, {
      params: { startDate, endDate },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching sales statistics:', error);
    throw error;
  }
}
