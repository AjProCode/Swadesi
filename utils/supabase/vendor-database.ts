import { projectId, publicAnonKey } from './info';
import { getVendorAccessToken } from './vendor-auth';
import { Vendor } from './vendor-auth';
import { Order, Product } from '../../App';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server`;

export type VendorProduct = Product & {
  vendorId: string;
  cost: number;
  margin: number;
  preparationTime: number; // in minutes
  isAvailable: boolean;
  inventoryCount?: number;
  allergens?: string[];
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  variants?: {
    name: string;
    price: number;
    available: boolean;
  }[];
};

export type VendorOrder = Order & {
  vendorId: string;
  commissionAmount: number;
  vendorEarnings: number;
  customerNote?: string;
  vendorNote?: string;
  preparationStarted?: Date;
  readyForPickup?: Date;
  pickedUpByDelivery?: Date;
};

export type VendorAnalytics = {
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  averageOrderValue: number;
  topSellingProducts: Array<{
    product: VendorProduct;
    totalSold: number;
    revenue: number;
  }>;
  ordersByStatus: Record<string, number>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  customerSatisfaction: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  };
};

// Helper function to make authenticated vendor requests
const makeVendorRequest = async (endpoint: string, options: RequestInit = {}) => {
  const accessToken = getVendorAccessToken();
  
  if (!accessToken) {
    console.warn(`⚠️ Making vendor request to ${endpoint} without access token`);
    throw new Error('Vendor authentication required');
  }
  
  const response = await fetch(`${SERVER_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    console.error(`❌ Vendor API error for ${endpoint}:`, errorData);
    
    if (response.status === 401) {
      localStorage.removeItem('vendor_access_token');
      throw new Error('Vendor authentication expired');
    }
    
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
};

// Vendor operations
export const updateVendor = async (vendorId: string, vendorData: Partial<Vendor>): Promise<void> => {
  try {
    await makeVendorRequest('/vendor/profile', {
      method: 'PUT',
      body: JSON.stringify(vendorData)
    });
  } catch (error) {
    console.error('Error updating vendor:', error);
    throw error;
  }
};

// Product operations
export const createProduct = async (productData: Omit<VendorProduct, 'id' | 'vendorId'>): Promise<string> => {
  try {
    const response = await makeVendorRequest('/vendor/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
    return response.productId;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const getVendorProducts = async (): Promise<VendorProduct[]> => {
  try {
    const products = await makeVendorRequest('/vendor/products');
    return products;
  } catch (error) {
    console.error('Error getting vendor products:', error);
    throw error;
  }
};

export const updateProduct = async (productId: string, productData: Partial<VendorProduct>): Promise<void> => {
  try {
    await makeVendorRequest(`/vendor/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    await makeVendorRequest(`/vendor/products/${productId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Order operations
export const getVendorOrders = async (): Promise<VendorOrder[]> => {
  try {
    const orders = await makeVendorRequest('/vendor/orders');
    return orders.map((order: any) => ({
      ...order,
      placedAt: new Date(order.placedAt),
      estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery) : undefined,
      deliveryTime: order.deliveryTime ? new Date(order.deliveryTime) : undefined,
      preparationStarted: order.preparationStarted ? new Date(order.preparationStarted) : undefined,
      readyForPickup: order.readyForPickup ? new Date(order.readyForPickup) : undefined,
      pickedUpByDelivery: order.pickedUpByDelivery ? new Date(order.pickedUpByDelivery) : undefined,
      trackingSteps: order.trackingSteps?.map((step: any) => ({
        ...step,
        timestamp: new Date(step.timestamp)
      })) || []
    }));
  } catch (error) {
    console.error('Error getting vendor orders:', error);
    throw error;
  }
};

export const updateVendorOrder = async (orderId: string, orderData: Partial<VendorOrder>): Promise<void> => {
  try {
    // Convert dates to ISO strings for API
    const updateData = {
      ...orderData,
      estimatedDelivery: orderData.estimatedDelivery?.toISOString(),
      deliveryTime: orderData.deliveryTime?.toISOString(),
      preparationStarted: orderData.preparationStarted?.toISOString(),
      readyForPickup: orderData.readyForPickup?.toISOString(),
      pickedUpByDelivery: orderData.pickedUpByDelivery?.toISOString(),
      trackingSteps: orderData.trackingSteps?.map(step => ({
        ...step,
        timestamp: step.timestamp.toISOString()
      }))
    };

    await makeVendorRequest(`/vendor/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  } catch (error) {
    console.error('Error updating vendor order:', error);
    throw error;
  }
};

export const acceptOrder = async (orderId: string): Promise<void> => {
  try {
    await makeVendorRequest(`/vendor/orders/${orderId}/accept`, {
      method: 'POST'
    });
  } catch (error) {
    console.error('Error accepting order:', error);
    throw error;
  }
};

export const rejectOrder = async (orderId: string, reason: string): Promise<void> => {
  try {
    await makeVendorRequest(`/vendor/orders/${orderId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  } catch (error) {
    console.error('Error rejecting order:', error);
    throw error;
  }
};

export const markOrderReady = async (orderId: string): Promise<void> => {
  try {
    await makeVendorRequest(`/vendor/orders/${orderId}/ready`, {
      method: 'POST'
    });
  } catch (error) {
    console.error('Error marking order ready:', error);
    throw error;
  }
};

// Analytics operations
export const getVendorAnalytics = async (period: 'today' | 'week' | 'month' | 'year' = 'week'): Promise<VendorAnalytics> => {
  try {
    const analytics = await makeVendorRequest(`/vendor/analytics?period=${period}`);
    return analytics;
  } catch (error) {
    console.error('Error getting vendor analytics:', error);
    throw error;
  }
};

// Inventory operations
export const updateInventory = async (productId: string, count: number): Promise<void> => {
  try {
    await makeVendorRequest(`/vendor/products/${productId}/inventory`, {
      method: 'PUT',
      body: JSON.stringify({ count })
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw error;
  }
};

export const toggleProductAvailability = async (productId: string, isAvailable: boolean): Promise<void> => {
  try {
    await makeVendorRequest(`/vendor/products/${productId}/availability`, {
      method: 'PUT',
      body: JSON.stringify({ isAvailable })
    });
  } catch (error) {
    console.error('Error toggling product availability:', error);
    throw error;
  }
};
