import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';

// Screens
import { WelcomeScreen } from './components/WelcomeScreen';
import { AboutScreen } from './components/AboutScreen';
import { AuthScreen } from './components/AuthScreen';
import { EnhancedHomeScreenV2 } from './components/EnhancedHomeScreenV2';
import { VendorScreen } from './components/VendorScreen';
import { ProductScreen } from './components/ProductScreen';
import { CartScreen } from './components/CartScreen';
import { OrdersScreen } from './components/OrdersScreen';
import { BillUploadScreen } from './components/BillUploadScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { SmartAssistant } from './components/SmartAssistant';
import { SocialHub } from './components/SocialHub';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { RewardsHub } from './components/RewardsHub';
import { MadeInIndiaFinder } from './components/MadeInIndiaFinder';
import { VendorAuthScreen } from './components/VendorAuthScreen';
import { VendorDashboard } from './components/VendorDashboard';

// Utils
import { initializeGeminiService } from './utils/gemini-ai';
import {
  getCurrentUser,
  signOut,
  getAccessToken,
} from './utils/supabase/auth';
import {
  getCurrentVendor,
  vendorSignOut,
  getVendorAccessToken,
  testVendorAccessToken,
  Vendor,
} from './utils/supabase/vendor-auth';
import {
  updateUser,
  createOrder,
  getUserOrders,
  updateOrder,
  createBillUpload,
  getUserBills,
  updateBillUpload,
  createPointsActivity,
  getUserPointsActivity,
  saveUserCart,
  getUserCart,
  clearUserCart,
  clearAllUserData,
  testAccessToken,
} from './utils/supabase/database';

// Types
import { Address } from './components/AddressManager';
import {
  getCurrentLevel,
  getTierMultiplier,
  ACHIEVEMENTS,
  DAILY_CHALLENGES,
} from './components/GameificationSystem';

// ==================== TYPE DEFINITIONS ====================

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  points: number;
  pointsLifetime: number;
  pointsTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'emerald' | 'ruby' | 'cosmic' | 'infinite';
  level: number;
  streakDays: number;
  lastLoginDate?: Date;
  address?: string;
  savedAddresses?: Address[];
  defaultAddressId?: string;
  achievements?: string[];
  completedChallenges?: string[];
  weeklyProgress?: Record<string, number>;
  dailyLoginCount?: number;
  referralCount?: number;
  reviewCount?: number;
  billUploadCount?: number;
  totalSpent: number;
  favoriteProducts: string[];
  wishlist: string[];
  recentSearches: string[];
  subscriptionTier?: 'free' | 'premium' | 'elite';
  subscriptionExpiry?: Date;
  preferences?: {
    favoriteVendors: string[];
    favoriteCategories: string[];
    dietaryRestrictions: string[];
    priceRange: [number, number];
    deliveryPreference: 'fast' | 'eco' | 'scheduled';
    notificationSettings: {
      orderUpdates: boolean;
      promotions: boolean;
      achievements: boolean;
      social: boolean;
    };
  };
  socialProfile?: {
    avatar?: string;
    bio?: string;
    isPublic: boolean;
    followersCount: number;
    followingCount: number;
    reviewsWritten: number;
    helpfulVotes: number;
  };
  personalizedOffers?: {
    id: string;
    title: string;
    description: string;
    discount: number;
    validUntil: Date;
    category?: string;
  }[];
  seasonalProgress?: Record<string, {
    points: number;
    tier: number;
    rewards: string[];
  }>;
  friendsList?: string[];
  blockedUsers?: string[];
  privacySettings?: {
    showRealName: boolean;
    showOrderHistory: boolean;
    showAchievements: boolean;
    allowFriendRequests: boolean;
  };
};

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  vendor: string;
  category: string;
  description: string;
  madeInIndia: boolean;
  rating: number;
  inStock: boolean;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Order = {
  id: string;
  items: CartItem[];
  total: number;
  status: 'placed' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  placedAt: Date;
  estimatedDelivery?: Date;
  deliveryTime?: Date;
  pointsEarned: number;
  pointsUsed: number;
  deliveryAddress?: {
    id: string;
    nickname: string;
    fullAddress: string;
    apartment?: string;
    landmark?: string;
    instructions?: string;
    contactPerson?: string;
    contactPhone?: string;
    deliveryArea: string;
    estimatedDeliveryTime: number;
    deliveryFee: number;
  };
  deliveryPerson?: {
    name: string;
    phone: string;
    photo: string;
  };
  trackingSteps: {
    status: string;
    timestamp: Date;
    location?: string;
    message: string;
  }[];
};

export type BillUpload = {
  id: string;
  vendorName: string;
  amount: number;
  image: File;
  pointsEarned: number;
  uploadedAt: Date;
  verified: boolean;
};

export type PointsActivity = {
  id: string;
  type: 'earned' | 'redeemed';
  amount: number;
  source: 'order' | 'bill_upload' | 'referral' | 'review' | 'streak' | 'first_purchase' | 'bonus' | 'achievement' | 'daily_challenge' | 'weekly_challenge' | 'level_up';
  description: string;
  date: Date;
  orderId?: string;
  achievementId?: string;
  challengeId?: string;
};

type Screen = 'welcome' | 'about' | 'auth' | 'vendor-auth' | 'vendor-dashboard' | 'home' | 'vendor' | 'product' | 'cart' | 'bills' | 'orders' | 'profile' | 'assistant' | 'social' | 'analytics' | 'rewards' | 'finder';

// ==================== MAIN APP COMPONENT ====================

export default function App() {
  // Screen state
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [previousScreen, setPreviousScreen] = useState<Screen>('home');
  
  // User state
  const [user, setUser] = useState<User | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  
  // Data state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [billUploads, setBillUploads] = useState<(Omit<BillUpload, 'image'> & { imageUrl: string })[]>([]);
  const [pointsActivity, setPointsActivity] = useState<PointsActivity[]>([]);
  
  // Selection state
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check for Gemini API key in localStorage
      const savedApiKey = localStorage.getItem('gemini_api_key');
      if (savedApiKey && savedApiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
        try {
          initializeGeminiService(savedApiKey);
          console.log('✅ Gemini AI initialized successfully');
        } catch (error) {
          console.warn('⚠️ Gemini AI initialization failed - AI features will use fallback responses');
        }
      } else {
        console.log('ℹ️ Gemini API key not configured - AI features will use fallback responses');
      }

      // Check for existing session
      await checkExistingSession();
    } catch (error) {
      console.error('❌ App initialization error:', error);
      handleInitializationError();
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingSession = async () => {
    try {
      console.log('🔍 Checking existing session...');
      
      // Check vendor session first
      const vendorToken = getVendorAccessToken();
      if (vendorToken) {
        console.log('🏪 Found vendor token, testing validity...');
        const isValid = await testVendorAccessToken();
        if (isValid) {
          const vendorData = await getCurrentVendor();
          if (vendorData) {
            console.log('✅ Valid vendor session found');
            setVendor(vendorData);
            setCurrentScreen('vendor-dashboard');
            return;
          }
        }
        console.log('❌ Invalid vendor token, clearing...');
        localStorage.removeItem('vendor_access_token');
      }

      // Check user session
      const userToken = getAccessToken();
      if (userToken) {
        console.log('👤 Found user token, testing validity...');
        const isValid = await testAccessToken();
        if (isValid) {
          console.log('✅ Valid user token found, getting user data...');
          const userData = await getCurrentUser();
          if (userData) {
            console.log('✅ Valid user session found, logging in...');
            await handleUserLogin(userData);
            return;
          }
        }
        console.log('❌ Invalid user token, clearing...');
        localStorage.removeItem('supabase_access_token');
      }

      // No valid session
      console.log('ℹ️ No valid session found, showing welcome screen');
      const hasSeenWelcome = localStorage.getItem('swadesi_seen_welcome');
      const hasSeenAbout = localStorage.getItem('swadesi_seen_about');
      
      if (!hasSeenWelcome) {
        setCurrentScreen('welcome');
      } else if (!hasSeenAbout) {
        setCurrentScreen('about');
      } else {
        setCurrentScreen('auth');
      }
    } catch (error) {
      console.error('❌ Error checking existing session:', error);
      // Clear all tokens and show appropriate screen
      localStorage.removeItem('supabase_access_token');
      localStorage.removeItem('vendor_access_token');
      const hasSeenWelcome = localStorage.getItem('swadesi_seen_welcome');
      const hasSeenAbout = localStorage.getItem('swadesi_seen_about');
      
      if (!hasSeenWelcome) {
        setCurrentScreen('welcome');
      } else if (!hasSeenAbout) {
        setCurrentScreen('about');
      } else {
        setCurrentScreen('auth');
      }
    }
  };

  const handleInitializationError = () => {
    localStorage.removeItem('supabase_access_token');
    localStorage.removeItem('vendor_access_token');
    const hasSeenWelcome = localStorage.getItem('swadesi_seen_welcome');
    const hasSeenAbout = localStorage.getItem('swadesi_seen_about');
    
    if (!hasSeenWelcome) {
      setCurrentScreen('welcome');
    } else if (!hasSeenAbout) {
      setCurrentScreen('about');
    } else {
      setCurrentScreen('auth');
    }
  };

  // ==================== USER MANAGEMENT ====================

  const handleUserLogin = async (userData: User) => {
    try {
      const lifetimePoints = userData.pointsLifetime || userData.points || 100;
      const { level, tier } = getCurrentLevel(lifetimePoints);

      const enhancedUser: User = {
        ...userData,
        pointsLifetime: lifetimePoints,
        pointsTier: tier as User['pointsTier'],
        level,
        streakDays: userData.streakDays || 0,
        lastLoginDate: userData.lastLoginDate ? new Date(userData.lastLoginDate) : new Date(),
        achievements: userData.achievements || [],
        completedChallenges: userData.completedChallenges || [],
        weeklyProgress: userData.weeklyProgress || {},
        dailyLoginCount: userData.dailyLoginCount || 0,
        referralCount: userData.referralCount || 0,
        reviewCount: userData.reviewCount || 0,
        billUploadCount: userData.billUploadCount || 0,
        totalSpent: userData.totalSpent || 0,
        favoriteProducts: userData.favoriteProducts || [],
        wishlist: userData.wishlist || [],
        recentSearches: userData.recentSearches || [],
      };

      setUser(enhancedUser);
      console.log('✅ User set, navigating to home screen');
      setCurrentScreen('home');

      // Check if in demo mode
      const isDemoMode = localStorage.getItem('swadesi_demo_mode') === 'true';
      if (isDemoMode) {
        toast.info('📱 Demo Mode: All data is stored locally. For production use, please deploy Supabase backend.', {
          duration: 5000,
        });
      }

      // Small delay to ensure the app state is stable before loading data
      setTimeout(async () => {
        try {
          console.log('Loading user data after login...');
          await loadUserData(userData.id);
          
          // Check daily login after data is loaded
          await checkDailyLogin(enhancedUser);
        } catch (error) {
          console.error('Error in post-login data loading:', error);
        }
      }, 100);

    } catch (error) {
      console.error('Error in handleUserLogin:', error);
      toast.error('Login completed but some data could not be loaded');
    }
  };

  const handleVendorLogin = async (vendorData: Vendor) => {
    setVendor(vendorData);
    setCurrentScreen('vendor-dashboard');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
      setCart([]);
      setOrders([]);
      setBillUploads([]);
      setPointsActivity([]);
      setCurrentScreen('auth');
      toast.success('Logged out successfully!');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  const handleVendorLogout = async () => {
    try {
      await vendorSignOut();
      setVendor(null);
      setCurrentScreen('auth');
      toast.success('Vendor logged out successfully!');
    } catch (error) {
      console.error('Vendor logout error:', error);
      toast.error('Failed to log out');
    }
  };

  // ==================== DATA LOADING ====================

  const loadUserData = async (userId: string) => {
    try {
      // Check if we have a valid access token before making requests
      const accessToken = getAccessToken();
      if (!accessToken) {
        console.warn('No access token available, skipping data load');
        return;
      }

      // Test if token is valid before making data requests
      const isTokenValid = await testAccessToken();
      if (!isTokenValid) {
        console.warn('Access token is invalid, skipping data load');
        return;
      }

      console.log('Loading user data with valid token...');
      
      // Load data with individual error handling
      const results = await Promise.allSettled([
        getUserCart(userId),
        getUserOrders(userId),
        getUserBills(userId),
        getUserPointsActivity(userId),
      ]);

      // Handle cart data
      if (results[0].status === 'fulfilled') {
        setCart(results[0].value || []);
      } else {
        console.warn('Failed to load cart:', results[0].reason);
        setCart([]);
      }

      // Handle orders data
      if (results[1].status === 'fulfilled') {
        setOrders(results[1].value || []);
      } else {
        console.warn('Failed to load orders:', results[1].reason);
        setOrders([]);
      }

      // Handle bills data
      if (results[2].status === 'fulfilled') {
        setBillUploads(results[2].value || []);
      } else {
        console.warn('Failed to load bills:', results[2].reason);
        setBillUploads([]);
      }

      // Handle points activity data
      if (results[3].status === 'fulfilled') {
        setPointsActivity(results[3].value || []);
      } else {
        console.warn('Failed to load points activity:', results[3].reason);
        setPointsActivity([]);
      }

      console.log('User data loading completed');
    } catch (error) {
      console.error('Error loading user data:', error);
      // Don't show error toast for data loading failures, just log them
      console.warn('Some user data could not be loaded, continuing with empty state');
    }
  };

  // ==================== CART MANAGEMENT ====================

  const addToCart = async (product: Product, quantity: number = 1) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    const newCart = existingItem
      ? cart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      : [...cart, { product, quantity }];

    setCart(newCart);

    if (user) {
      try {
        await saveUserCart(user.id, newCart);
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    }

    toast.success(`${product.name} added to cart!`, {
      duration: 2000,
    });
  };

  const updateCartQuantity = async (productId: string, quantity: number) => {
    const newCart = quantity <= 0
      ? cart.filter(item => item.product.id !== productId)
      : cart.map(item =>
          item.product.id === productId ? { ...item, quantity } : item
        );

    setCart(newCart);

    if (user) {
      try {
        await saveUserCart(user.id, newCart);
      } catch (error) {
        console.error('Error updating cart:', error);
      }
    }
  };

  // ==================== ORDER MANAGEMENT ====================

  const placeOrder = async (pointsUsed: number = 0, selectedAddress?: Address) => {
    if (cart.length === 0 || !user) return;

    try {
      const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const deliveryFee = selectedAddress?.deliveryFee || (total > 500 ? 0 : 40);
      const finalTotal = Math.max(0, total + deliveryFee - pointsUsed);

      // Calculate points
      const basePointsRate = 0.1;
      const madeInIndiaBonus = 0.05;
      const tierMultiplier = getTierMultiplier(user.pointsTier);

      const madeInIndiaTotal = cart.reduce(
        (sum, item) => (item.product.madeInIndia ? sum + item.product.price * item.quantity : sum),
        0
      );

      const basePoints = Math.floor(finalTotal * basePointsRate);
      const bonusPoints = Math.floor(madeInIndiaTotal * madeInIndiaBonus);
      const pointsEarned = Math.floor((basePoints + bonusPoints) * tierMultiplier);

      const estimatedDeliveryTime = selectedAddress?.estimatedDeliveryTime || 45;

      const order: Order = {
        id: '',
        items: [...cart],
        total: finalTotal,
        status: 'placed',
        placedAt: new Date(),
        estimatedDelivery: new Date(Date.now() + estimatedDeliveryTime * 60 * 1000),
        pointsEarned,
        pointsUsed,
        deliveryAddress: selectedAddress
          ? {
              id: selectedAddress.id,
              nickname: selectedAddress.nickname,
              fullAddress: selectedAddress.fullAddress,
              apartment: selectedAddress.apartment,
              landmark: selectedAddress.landmark,
              instructions: selectedAddress.instructions,
              contactPerson: selectedAddress.contactPerson,
              contactPhone: selectedAddress.contactPhone,
              deliveryArea: selectedAddress.deliveryArea,
              estimatedDeliveryTime: selectedAddress.estimatedDeliveryTime,
              deliveryFee: selectedAddress.deliveryFee,
            }
          : undefined,
        trackingSteps: [
          {
            status: 'placed',
            timestamp: new Date(),
            message: 'Order placed successfully',
            location: selectedAddress?.deliveryArea || 'Order Placed',
          },
        ],
      };

      const orderId = await createOrder(user.id, order);
      const orderWithId = { ...order, id: orderId };

      setOrders(prev => [orderWithId, ...prev]);
      setCart([]);
      await clearUserCart(user.id);

      if (pointsUsed > 0) {
        const newPoints = user.points - pointsUsed;
        await updateUser(user.id, { points: newPoints });
        setUser(prev => (prev ? { ...prev, points: newPoints } : null));

        await addPointsActivity({
          type: 'redeemed',
          amount: pointsUsed,
          source: 'order',
          description: `Points used for order ${orderId.slice(-6)}`,
          orderId,
        });
      }

      toast.success('🎉 Order placed successfully!');
      setCurrentScreen('orders');

      // Simulate order updates
      simulateOrderUpdates(orderWithId);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    }
  };

  const simulateOrderUpdates = (order: Order) => {
    const statuses: Order['status'][] = ['confirmed', 'preparing', 'out_for_delivery', 'delivered'];
    const delays = [3000, 8000, 15000, 25000];

    statuses.forEach((status, index) => {
      setTimeout(async () => {
        await updateOrderStatus(order.id, status);
      }, delays[index]);
    });
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const trackingMessages: Record<string, string> = {
        confirmed: 'Order confirmed by restaurant',
        preparing: 'Food is being prepared',
        out_for_delivery: 'Order picked up by delivery partner',
        delivered: 'Order delivered successfully',
      };

      const newTrackingStep = {
        status: newStatus,
        timestamp: new Date(),
        location: newStatus === 'out_for_delivery' ? 'Restaurant' : newStatus === 'delivered' ? user?.address || 'Delivery Address' : '',
        message: trackingMessages[newStatus] || '',
      };

      const updatedOrder = {
        ...order,
        status: newStatus,
        deliveryTime: newStatus === 'delivered' ? new Date() : order.deliveryTime,
        trackingSteps: [...(order.trackingSteps || []), newTrackingStep],
        deliveryPerson:
          newStatus === 'out_for_delivery'
            ? {
                name: ['Rajesh Kumar', 'Priya Singh', 'Arjun Patel', 'Meera Sharma'][Math.floor(Math.random() * 4)],
                phone: '+91 9876543210',
                photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
              }
            : order.deliveryPerson,
      };

      await updateOrder(orderId, updatedOrder);
      setOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));

      if (newStatus === 'delivered' && user) {
        const multiplier = getTierMultiplier(user.pointsTier);
        const bonusPoints = Math.floor(order.pointsEarned * multiplier);

        const newPoints = user.points + bonusPoints;
        const newLifetimePoints = user.pointsLifetime + bonusPoints;
        const { level, tier } = getCurrentLevel(newLifetimePoints);

        await updateUser(user.id, {
          points: newPoints,
          pointsLifetime: newLifetimePoints,
          pointsTier: tier,
          level,
        });

        setUser(prev =>
          prev
            ? {
                ...prev,
                points: newPoints,
                pointsLifetime: newLifetimePoints,
                pointsTier: tier as User['pointsTier'],
                level,
              }
            : null
        );

        await addPointsActivity({
          type: 'earned',
          amount: bonusPoints,
          source: 'order',
          description: `Order ${orderId.slice(-6)} delivered`,
          orderId,
        });

        toast.success(`✅ Order delivered! You earned ${bonusPoints} points!`);
      } else {
        toast.info(`📦 Order ${newStatus.replace('_', ' ')}`);
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  // ==================== BILL UPLOAD ====================

  const uploadBill = async (vendorName: string, amount: number, image: File) => {
    if (!user) return;

    try {
      const baseRate = 0.05;
      const tierMultiplier = getTierMultiplier(user.pointsTier);
      const pointsEarned = Math.floor(amount * baseRate * tierMultiplier);

      await createBillUpload(user.id, {
        vendorName,
        amount,
        pointsEarned,
        uploadedAt: new Date(),
        verified: false,
        imageUrl: '',
        image,
      } as any);

      const updatedBills = await getUserBills(user.id);
      setBillUploads(updatedBills);

      toast.success('📄 Bill uploaded! Verification in progress...');

      // Simulate verification
      setTimeout(async () => {
        await verifyBill(updatedBills[0].id, pointsEarned, vendorName);
      }, Math.random() * 5000 + 2000);
    } catch (error) {
      console.error('Error uploading bill:', error);
      toast.error('Failed to upload bill. Please try again.');
    }
  };

  const verifyBill = async (billId: string, pointsEarned: number, vendorName: string) => {
    try {
      await updateBillUpload(billId, { verified: true });
      setBillUploads(prev => prev.map(b => (b.id === billId ? { ...b, verified: true } : b)));

      if (user) {
        const newPoints = user.points + pointsEarned;
        const newLifetimePoints = user.pointsLifetime + pointsEarned;
        const { level, tier } = getCurrentLevel(newLifetimePoints);
        const newBillCount = (user.billUploadCount || 0) + 1;

        await updateUser(user.id, {
          points: newPoints,
          pointsLifetime: newLifetimePoints,
          pointsTier: tier,
          level,
          billUploadCount: newBillCount,
        });

        setUser(prev =>
          prev
            ? {
                ...prev,
                points: newPoints,
                pointsLifetime: newLifetimePoints,
                pointsTier: tier as User['pointsTier'],
                level,
                billUploadCount: newBillCount,
              }
            : null
        );

        await addPointsActivity({
          type: 'earned',
          amount: pointsEarned,
          source: 'bill_upload',
          description: `Bill from ${vendorName} verified`,
        });

        toast.success(`✅ Bill verified! You earned ${pointsEarned} points!`);
      }
    } catch (error) {
      console.error('Error verifying bill:', error);
    }
  };

  // ==================== ACHIEVEMENTS & GAMIFICATION ====================

  const checkDailyLogin = async (userData: User) => {
    const today = new Date().toDateString();
    const lastLogin = userData.lastLoginDate?.toDateString();

    if (lastLogin !== today && !userData.completedChallenges?.includes('daily_login')) {
      const dailyChallenge = DAILY_CHALLENGES.find(c => c.id === 'daily_login');
      if (dailyChallenge) {
        const newPoints = userData.points + dailyChallenge.points;
        const newLifetimePoints = userData.pointsLifetime + dailyChallenge.points;
        const { level, tier } = getCurrentLevel(newLifetimePoints);

        await updateUser(userData.id, {
          completedChallenges: [...(userData.completedChallenges || []), 'daily_login'],
          points: newPoints,
          pointsLifetime: newLifetimePoints,
          level,
          pointsTier: tier,
          dailyLoginCount: (userData.dailyLoginCount || 0) + 1,
        });

        setUser(prev =>
          prev
            ? {
                ...prev,
                completedChallenges: [...(prev.completedChallenges || []), 'daily_login'],
                points: newPoints,
                pointsLifetime: newLifetimePoints,
                level,
                pointsTier: tier as User['pointsTier'],
                dailyLoginCount: (prev.dailyLoginCount || 0) + 1,
              }
            : null
        );

        await addPointsActivity({
          type: 'earned',
          amount: dailyChallenge.points,
          source: 'daily_challenge',
          description: 'Daily login completed',
          challengeId: 'daily_login',
        });

        toast.success(`🌟 Daily Challenge Complete: +${dailyChallenge.points} points!`);
      }
    }
  };

  const addPointsActivity = async (activity: Omit<PointsActivity, 'id' | 'date'>) => {
    if (!user) return;

    const newActivity: PointsActivity = {
      ...activity,
      id: `activity_${Date.now()}`,
      date: new Date(),
    };

    try {
      await createPointsActivity(user.id, newActivity);
      setPointsActivity(prev => [newActivity, ...prev]);
    } catch (error) {
      console.error('Error adding points activity:', error);
    }
  };

  const updateUserAddresses = async (addresses: Address[]) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      savedAddresses: addresses,
      defaultAddressId: addresses.find(addr => addr.isDefault)?.id,
    };
    setUser(updatedUser);

    try {
      await updateUser(user.id, {
        savedAddresses: addresses,
        defaultAddressId: addresses.find(addr => addr.isDefault)?.id,
      });
    } catch (error) {
      console.error('Error updating user addresses:', error);
    }
  };

  const handleClearAllData = async () => {
    if (!user) return;

    try {
      await clearAllUserData(user.id);
      setCart([]);
      setOrders([]);
      setBillUploads([]);
      setPointsActivity([]);
      setUser(prev =>
        prev
          ? {
              ...prev,
              points: 100,
              pointsLifetime: 100,
              pointsTier: 'bronze',
              streakDays: 0,
            }
          : null
      );
      toast.success('All user data cleared successfully!');
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Failed to clear data. Please try again.');
    }
  };

  // ==================== NAVIGATION ====================

  const handleSelectVendor = (vendor: string) => {
    setSelectedVendor(vendor);
    setCurrentScreen('vendor');
  };

  const handleSelectProduct = (product: Product, from: Screen = 'home') => {
    setSelectedProduct(product);
    setPreviousScreen(from);
    setCurrentScreen('product');
  };

  // ==================== LOADING SCREEN ====================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl flex items-center justify-center shadow-2xl mb-6 mx-auto"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <span className="text-3xl">🇮🇳</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Swa<span className="text-orange-500">Desi</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 mb-4">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-orange-500 rounded-full"
                animate={{
                  y: [0, -10, 0],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
          <p className="text-gray-400">Connecting to your marketplace...</p>
        </motion.div>
      </div>
    );
  }

  // ==================== SCREEN RENDERING ====================

  const renderScreen = () => {
    // Vendor screens
    if (currentScreen === 'vendor-auth') {
      return <VendorAuthScreen onLogin={handleVendorLogin} onBack={() => setCurrentScreen('auth')} />;
    }

    if (currentScreen === 'vendor-dashboard' && vendor) {
      return <VendorDashboard vendor={vendor} onLogout={handleVendorLogout} />;
    }

    // Public screens
    if (!user) {
      if (currentScreen === 'welcome') {
        return (
          <WelcomeScreen
            onGetStarted={() => {
              localStorage.setItem('swadesi_seen_welcome', 'true');
              setCurrentScreen('about');
            }}
          />
        );
      }

      if (currentScreen === 'about') {
        return (
          <AboutScreen
            onGetStarted={() => {
              localStorage.setItem('swadesi_seen_about', 'true');
              setCurrentScreen('auth');
            }}
            onBack={() => {
              setCurrentScreen('welcome');
            }}
          />
        );
      }

      return <AuthScreen onLogin={handleUserLogin} onVendorLogin={() => setCurrentScreen('vendor-auth')} />;
    }

    // User screens
    switch (currentScreen) {
      case 'home':
        return (
          <EnhancedHomeScreenV2
            user={user}
            cart={cart}
            onNavigate={setCurrentScreen}
            onSelectVendor={handleSelectVendor}
            onSelectProduct={product => handleSelectProduct(product, 'home')}
          />
        );

      case 'vendor':
        return (
          <VendorScreen
            vendor={selectedVendor}
            cart={cart}
            onNavigate={setCurrentScreen}
            onAddToCart={addToCart}
            onSelectProduct={product => handleSelectProduct(product, 'vendor')}
          />
        );

      case 'product':
        return selectedProduct ? (
          <ProductScreen
            product={selectedProduct}
            cart={cart}
            user={user}
            onNavigate={setCurrentScreen}
            onGoBack={() => {
              setCurrentScreen(previousScreen);
              setSelectedProduct(null);
            }}
            onAddToCart={addToCart}
          />
        ) : null;

      case 'cart':
        return (
          <CartScreen
            cart={cart}
            user={user}
            onNavigate={setCurrentScreen}
            onUpdateQuantity={updateCartQuantity}
            onPlaceOrder={placeOrder}
            onUpdateUserAddresses={updateUserAddresses}
          />
        );

      case 'orders':
        return <OrdersScreen orders={orders} onNavigate={setCurrentScreen} />;

      case 'bills':
        return <BillUploadScreen billUploads={billUploads} user={user} onNavigate={setCurrentScreen} onUploadBill={uploadBill} />;

      case 'profile':
        return (
          <ProfileScreen
            user={user}
            billUploads={billUploads}
            orders={orders}
            pointsActivity={pointsActivity}
            onNavigate={setCurrentScreen}
            onLogout={handleLogout}
            onClearAllData={handleClearAllData}
          />
        );

      case 'assistant':
        return (
          <SmartAssistant
            user={user}
            cart={cart}
            onNavigate={setCurrentScreen}
            onAddToCart={addToCart}
            onSelectVendor={handleSelectVendor}
          />
        );

      case 'social':
        return <SocialHub user={user} onNavigate={setCurrentScreen} />;

      case 'analytics':
        return <AnalyticsDashboard user={user} orders={orders} pointsActivity={pointsActivity} onNavigate={setCurrentScreen} />;

      case 'rewards':
        return (
          <RewardsHub
            user={user}
            onNavigate={setCurrentScreen}
            onRedeemReward={async (rewardId: string, pointsCost: number) => {
              if (user && user.points >= pointsCost) {
                const newPoints = user.points - pointsCost;
                await updateUser(user.id, { points: newPoints });
                setUser(prev => (prev ? { ...prev, points: newPoints } : null));

                await addPointsActivity({
                  type: 'redeemed',
                  amount: pointsCost,
                  source: 'order',
                  description: `Redeemed reward: ${rewardId}`,
                  orderId: rewardId,
                });

                toast.success(`🎁 Reward redeemed successfully! -${pointsCost} points`);
              } else {
                toast.error('Insufficient points to redeem this reward.');
              }
            }}
          />
        );

      case 'finder':
        return (
          <MadeInIndiaFinder
            user={user}
            onNavigate={setCurrentScreen}
            onAddToCart={addToCart}
            onSelectProduct={product => handleSelectProduct(product, 'home')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1c1c1e',
            color: '#fff',
            border: '1px solid #38383a',
            borderRadius: '12px',
          },
        }}
      />
    </div>
  );
}
