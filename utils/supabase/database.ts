import { projectId, publicAnonKey } from './info';
import { User, Order, CartItem, BillUpload, PointsActivity } from '../../App';
import { getAccessToken } from './auth';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server`;
const DEMO_MODE_KEY = 'swadesi_demo_mode';
const DEMO_DATA_KEY = 'swadesi_demo_data';

// Demo data storage
const getDemoData = () => {
  const stored = localStorage.getItem(DEMO_DATA_KEY);
  return stored ? JSON.parse(stored) : {
    cart: [],
    orders: [],
    bills: [],
    pointsActivity: []
  };
};

const saveDemoData = (data: any) => {
  localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(data));
};

const isDemoMode = () => {
  return localStorage.getItem(DEMO_MODE_KEY) === 'true';
};

// Helper function to make authenticated requests
const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
  const accessToken = getAccessToken();
  
  // Require access token for authenticated endpoints
  if (!accessToken && !endpoint.includes('/public/')) {
    console.warn('⚠️ No access token available, skipping data load');
    // Return empty data instead of throwing error for data loading endpoints
    if (endpoint.includes('/cart') || endpoint.includes('/orders') || endpoint.includes('/bills') || endpoint.includes('/points')) {
      return null;
    }
    throw new Error('Authentication required - no access token available');
  }
  
  console.log(`🔄 Making request to ${endpoint} with ${accessToken ? 'valid' : 'no'} token`);
  
  try {
    const response = await fetch(`${SERVER_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken || publicAnonKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: `Request failed with status ${response.status}` 
      }));
      
      console.error(`❌ API error for ${endpoint}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      // Handle specific error cases
      if (response.status === 401) {
        if (accessToken) {
          console.error('🔑 Access token appears to be invalid or expired, clearing it');
          localStorage.removeItem('supabase_access_token');
          throw new Error('Authentication expired - please log in again');
        } else {
          throw new Error('Authentication required - please log in');
        }
      } else if (response.status === 403) {
        throw new Error('Access denied - insufficient permissions');
      } else if (response.status === 404) {
        throw new Error('Resource not found');
      } else if (response.status >= 500) {
        throw new Error('Server error - please try again later');
      }
      
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Request to ${endpoint} successful`);
    return data;
  } catch (error: any) {
    // If it's a network error and we're in demo mode, handle it gracefully
    if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
      console.warn('⚠️ Network error, using demo mode fallback');
      localStorage.setItem(DEMO_MODE_KEY, 'true');
      throw error; // Re-throw to be caught by individual functions
    }
    throw error;
  }
};

// User operations
export const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
  try {
    if (isDemoMode()) {
      // In demo mode, update user data in localStorage
      const demoUsers = JSON.parse(localStorage.getItem('swadesi_demo_users') || '{}');
      for (const email in demoUsers) {
        if (demoUsers[email].user.id === userId) {
          demoUsers[email].user = { ...demoUsers[email].user, ...userData };
          localStorage.setItem('swadesi_demo_users', JSON.stringify(demoUsers));
          console.log('✅ Demo user updated in localStorage');
          return;
        }
      }
      return;
    }
    
    await makeRequest('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  } catch (error: any) {
    if (error.message && error.message.includes('Failed to fetch')) {
      console.warn('⚠️ Using demo mode fallback for user update');
      // Fallback handled above
      return;
    }
    console.error('Error updating user:', error);
    throw error;
  }
};

export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const userData = await makeRequest('/user/profile');
    return userData;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

// Orders operations
export const createOrder = async (userId: string, order: Omit<Order, 'id'>): Promise<string> => {
  try {
    if (isDemoMode()) {
      const orderId = `demo_order_${Date.now()}`;
      const demoData = getDemoData();
      demoData.orders = demoData.orders || [];
      demoData.orders.unshift({ ...order, id: orderId });
      saveDemoData(demoData);
      console.log('✅ Demo order created');
      return orderId;
    }
    
    const response = await makeRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(order)
    });
    return response.orderId;
  } catch (error: any) {
    if (error.message && error.message.includes('Failed to fetch')) {
      const orderId = `demo_order_${Date.now()}`;
      const demoData = getDemoData();
      demoData.orders = demoData.orders || [];
      demoData.orders.unshift({ ...order, id: orderId });
      saveDemoData(demoData);
      return orderId;
    }
    console.error('Error creating order:', error);
    throw error;
  }
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    if (isDemoMode()) {
      const demoData = getDemoData();
      console.log('✅ Demo orders retrieved');
      return (demoData.orders || []).map((order: any) => ({
        ...order,
        placedAt: new Date(order.placedAt),
        estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery) : undefined,
        deliveryTime: order.deliveryTime ? new Date(order.deliveryTime) : undefined,
        trackingSteps: order.trackingSteps?.map((step: any) => ({
          ...step,
          timestamp: new Date(step.timestamp)
        })) || []
      }));
    }
    
    const orders = await makeRequest('/orders');
    if (!Array.isArray(orders)) {
      console.warn('Orders response is not an array:', orders);
      return [];
    }
    
    return orders.map((order: any) => ({
      ...order,
      placedAt: new Date(order.placedAt),
      estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery) : undefined,
      deliveryTime: order.deliveryTime ? new Date(order.deliveryTime) : undefined,
      trackingSteps: order.trackingSteps?.map((step: any) => ({
        ...step,
        timestamp: new Date(step.timestamp)
      })) || []
    }));
  } catch (error: any) {
    if (error.message && error.message.includes('Failed to fetch')) {
      const demoData = getDemoData();
      return (demoData.orders || []).map((order: any) => ({
        ...order,
        placedAt: new Date(order.placedAt),
        estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery) : undefined,
        deliveryTime: order.deliveryTime ? new Date(order.deliveryTime) : undefined,
        trackingSteps: order.trackingSteps?.map((step: any) => ({
          ...step,
          timestamp: new Date(step.timestamp)
        })) || []
      }));
    }
    console.error('Error getting user orders:', error);
    // Return empty array for graceful degradation
    return [];
  }
};

export const updateOrder = async (orderId: string, orderData: Partial<Order>): Promise<void> => {
  try {
    if (isDemoMode()) {
      const demoData = getDemoData();
      demoData.orders = demoData.orders.map((order: Order) => 
        order.id === orderId ? { ...order, ...orderData } : order
      );
      saveDemoData(demoData);
      console.log('✅ Demo order updated');
      return;
    }
    
    // Convert dates to ISO strings for API
    const updateData = {
      ...orderData,
      estimatedDelivery: orderData.estimatedDelivery?.toISOString(),
      deliveryTime: orderData.deliveryTime?.toISOString(),
      trackingSteps: orderData.trackingSteps?.map(step => ({
        ...step,
        timestamp: step.timestamp.toISOString()
      }))
    };

    await makeRequest(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  } catch (error: any) {
    if (error.message && error.message.includes('Failed to fetch')) {
      const demoData = getDemoData();
      demoData.orders = demoData.orders.map((order: Order) => 
        order.id === orderId ? { ...order, ...orderData } : order
      );
      saveDemoData(demoData);
      return;
    }
    console.error('Error updating order:', error);
    throw error;
  }
};

// Bill uploads operations
export const uploadBillImage = async (userId: string, file: File): Promise<string> => {
  try {
    if (isDemoMode()) {
      // In demo mode, create a local object URL
      const imageUrl = URL.createObjectURL(file);
      console.log('✅ Demo bill image URL created');
      return imageUrl;
    }
    
    const accessToken = getAccessToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${SERVER_URL}/bills/upload-file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken || publicAnonKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'File upload failed' }));
      throw new Error(errorData.error || 'File upload failed');
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error: any) {
    if (error.message && error.message.includes('Failed to fetch')) {
      const imageUrl = URL.createObjectURL(file);
      return imageUrl;
    }
    console.error('Error uploading bill image:', error);
    throw error;
  }
};

export const createBillUpload = async (
  userId: string, 
  billData: any // Accept any type to handle the File properly
): Promise<string> => {
  try {
    if (isDemoMode()) {
      const billId = `demo_bill_${Date.now()}`;
      const imageUrl = billData.image instanceof File ? URL.createObjectURL(billData.image) : '';
      const demoData = getDemoData();
      demoData.bills = demoData.bills || [];
      demoData.bills.unshift({
        id: billId,
        vendorName: billData.vendorName,
        amount: billData.amount,
        pointsEarned: billData.pointsEarned,
        uploadedAt: new Date(),
        verified: false,
        imageUrl
      });
      saveDemoData(demoData);
      console.log('✅ Demo bill created');
      return billId;
    }
    
    const accessToken = getAccessToken();
    const formData = new FormData();
    
    // Add the file if it exists
    if (billData.image instanceof File) {
      formData.append('file', billData.image);
    }
    
    formData.append('vendorName', billData.vendorName);
    formData.append('amount', billData.amount.toString());
    formData.append('pointsEarned', billData.pointsEarned.toString());

    const response = await fetch(`${SERVER_URL}/bills/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken || publicAnonKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Bill upload failed' }));
      throw new Error(errorData.error || 'Bill upload failed');
    }

    const data = await response.json();
    return data.billId;
  } catch (error: any) {
    if (error.message && error.message.includes('Failed to fetch')) {
      const billId = `demo_bill_${Date.now()}`;
      const imageUrl = billData.image instanceof File ? URL.createObjectURL(billData.image) : '';
      const demoData = getDemoData();
      demoData.bills = demoData.bills || [];
      demoData.bills.unshift({
        id: billId,
        vendorName: billData.vendorName,
        amount: billData.amount,
        pointsEarned: billData.pointsEarned,
        uploadedAt: new Date(),
        verified: false,
        imageUrl
      });
      saveDemoData(demoData);
      return billId;
    }
    console.error('Error creating bill upload:', error);
    throw error;
  }
};

export const getUserBills = async (userId: string): Promise<(Omit<BillUpload, 'image'> & { imageUrl: string })[]> => {
  try {
    if (isDemoMode()) {
      const demoData = getDemoData();
      console.log('✅ Demo bills retrieved');
      return (demoData.bills || []).map((bill: any) => ({
        ...bill,
        uploadedAt: new Date(bill.uploadedAt)
      }));
    }
    
    const bills = await makeRequest('/bills');
    if (!Array.isArray(bills)) {
      console.warn('Bills response is not an array:', bills);
      return [];
    }
    
    return bills.map((bill: any) => ({
      ...bill,
      uploadedAt: new Date(bill.uploadedAt)
    }));
  } catch (error: any) {
    if (error.message && error.message.includes('Failed to fetch')) {
      const demoData = getDemoData();
      return (demoData.bills || []).map((bill: any) => ({
        ...bill,
        uploadedAt: new Date(bill.uploadedAt)
      }));
    }
    console.error('Error getting user bills:', error);
    // Return empty array for graceful degradation
    return [];
  }
};

export const updateBillUpload = async (billId: string, billData: Partial<BillUpload>): Promise<void> => {
  try {
    if (isDemoMode()) {
      const demoData = getDemoData();
      demoData.bills = demoData.bills.map((bill: any) => 
        bill.id === billId ? { ...bill, ...billData } : bill
      );
      saveDemoData(demoData);
      console.log('✅ Demo bill updated');
      return;
    }
    
    await makeRequest(`/bills/${billId}`, {
      method: 'PUT',
      body: JSON.stringify(billData)
    });
  } catch (error: any) {
    if (error.message && error.message.includes('Failed to fetch')) {
      const demoData = getDemoData();
      demoData.bills = demoData.bills.map((bill: any) => 
        bill.id === billId ? { ...bill, ...billData } : bill
      );
      saveDemoData(demoData);
      return;
    }
    console.error('Error updating bill upload:', error);
    throw error;
  }
};

// Points activity operations
export const createPointsActivity = async (userId: string, activity: Omit<PointsActivity, 'id'>): Promise<string> => {
  try {
    if (isDemoMode()) {
      const activityId = `demo_activity_${Date.now()}`;
      const demoData = getDemoData();
      demoData.pointsActivity = demoData.pointsActivity || [];
      demoData.pointsActivity.unshift({ ...activity, id: activityId });
      saveDemoData(demoData);
      console.log('✅ Demo points activity created');
      return activityId;
    }
    
    const response = await makeRequest('/points/activity', {
      method: 'POST',
      body: JSON.stringify({
        ...activity,
        date: activity.date.toISOString()
      })
    });
    return response.activityId;
  } catch (error: any) {
    if (error.message && error.message.includes('Failed to fetch')) {
      const activityId = `demo_activity_${Date.now()}`;
      const demoData = getDemoData();
      demoData.pointsActivity = demoData.pointsActivity || [];
      demoData.pointsActivity.unshift({ ...activity, id: activityId });
      saveDemoData(demoData);
      return activityId;
    }
    console.error('Error creating points activity:', error);
    throw error;
  }
};

export const getUserPointsActivity = async (userId: string): Promise<PointsActivity[]> => {
  try {
    if (isDemoMode()) {
      const demoData = getDemoData();
      console.log('✅ Demo points activity retrieved');
      return (demoData.pointsActivity || []).map((activity: any) => ({
        ...activity,
        date: new Date(activity.date)
      }));
    }
    
    const activities = await makeRequest('/points/activity');
    if (!Array.isArray(activities)) {
      console.warn('Points activity response is not an array:', activities);
      return [];
    }
    
    return activities.map((activity: any) => ({
      ...activity,
      date: new Date(activity.date)
    }));
  } catch (error: any) {
    if (error.message && error.message.includes('Failed to fetch')) {
      const demoData = getDemoData();
      return (demoData.pointsActivity || []).map((activity: any) => ({
        ...activity,
        date: new Date(activity.date)
      }));
    }
    console.error('Error getting user points activity:', error);
    // Return empty array for graceful degradation
    return [];
  }
};

// Cart operations
export const saveUserCart = async (userId: string, cart: CartItem[]): Promise<void> => {
  try {
    if (isDemoMode()) {
      const demoData = getDemoData();
      demoData.cart = cart;
      saveDemoData(demoData);
      console.log('✅ Demo cart saved');
      return;
    }
    
    await makeRequest('/cart', {
      method: 'POST',
      body: JSON.stringify({ items: cart })
    });
  } catch (error: any) {
    if (error.message && error.message.includes('Failed to fetch')) {
      const demoData = getDemoData();
      demoData.cart = cart;
      saveDemoData(demoData);
      return;
    }
    console.error('Error saving cart:', error);
    throw error;
  }
};

export const getUserCart = async (userId: string): Promise<CartItem[]> => {
  try {
    if (isDemoMode()) {
      const demoData = getDemoData();
      console.log('✅ Demo cart retrieved');
      return demoData.cart || [];
    }
    
    const cartItems = await makeRequest('/cart');
    return Array.isArray(cartItems) ? cartItems : [];
  } catch (error: any) {
    if (error.message && error.message.includes('Failed to fetch')) {
      const demoData = getDemoData();
      return demoData.cart || [];
    }
    console.error('Error getting cart:', error);
    // Return empty cart for graceful degradation
    return [];
  }
};

export const clearUserCart = async (userId: string): Promise<void> => {
  try {
    if (isDemoMode()) {
      const demoData = getDemoData();
      demoData.cart = [];
      saveDemoData(demoData);
      console.log('✅ Demo cart cleared');
      return;
    }
    
    await makeRequest('/cart', {
      method: 'DELETE'
    });
  } catch (error: any) {
    if (error.message && error.message.includes('Failed to fetch')) {
      const demoData = getDemoData();
      demoData.cart = [];
      saveDemoData(demoData);
      return;
    }
    console.error('Error clearing cart:', error);
    throw error;
  }
};

// Clear all user data
export const clearAllUserData = async (userId: string): Promise<void> => {
  try {
    if (isDemoMode()) {
      saveDemoData({
        cart: [],
        orders: [],
        bills: [],
        pointsActivity: []
      });
      console.log('✅ Demo data cleared successfully');
      return;
    }
    
    await makeRequest('/user/data', {
      method: 'DELETE'
    });
    console.log('✅ All user data cleared successfully');
  } catch (error: any) {
    if (error.message && error.message.includes('Failed to fetch')) {
      saveDemoData({
        cart: [],
        orders: [],
        bills: [],
        pointsActivity: []
      });
      return;
    }
    console.error('Error clearing user data:', error);
    throw error;
  }
};

// Test if current access token is valid
export const testAccessToken = async (): Promise<boolean> => {
  try {
    const accessToken = getAccessToken();
    
    // In demo mode, check if token is a valid demo token
    if (isDemoMode() && accessToken && accessToken.startsWith('demo_token_')) {
      console.log('✅ Demo token is valid');
      return true;
    }
    
    await makeRequest('/user/profile');
    return true;
  } catch (error: any) {
    if (error.message && error.message.includes('Failed to fetch')) {
      const accessToken = getAccessToken();
      if (accessToken && accessToken.startsWith('demo_token_')) {
        localStorage.setItem(DEMO_MODE_KEY, 'true');
        return true;
      }
    }
    console.error('Access token test failed:', error);
    return false;
  }
};
