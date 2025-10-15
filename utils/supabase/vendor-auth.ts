import { projectId, publicAnonKey } from './info';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server`;

export type Vendor = {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  category: string;
  address: string;
  gstNumber?: string;
  fssaiNumber?: string;
  isVerified: boolean;
  rating: number;
  totalOrders: number;
  totalRevenue: number;
  isActive: boolean;
  createdAt: Date;
  profileImage?: string;
  description?: string;
  operatingHours?: {
    open: string;
    close: string;
    days: string[];
  };
  deliveryRadius: number;
  minimumOrder: number;
  deliveryFee: number;
  avgPreparationTime: number; // in minutes
  specializations: string[];
  certifications: string[];
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
};

export const vendorSignUp = async (
  email: string, 
  password: string, 
  businessName: string,
  ownerName: string,
  phone: string,
  category: string,
  address: string
): Promise<Vendor> => {
  try {
    const response = await fetch(`${SERVER_URL}/vendor/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ 
        email, 
        password, 
        businessName,
        ownerName,
        phone,
        category,
        address
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Vendor signup API error:', data);
      throw new Error(data.error || 'Vendor signup failed');
    }

    // Store vendor access token if provided
    if (data.access_token) {
      localStorage.setItem('vendor_access_token', data.access_token);
      console.log('✅ Vendor access token stored successfully');
    }

    return data.profile;
  } catch (error: any) {
    console.error('Vendor signup error:', error);
    throw new Error(error.message || 'Vendor signup failed');
  }
};

export const vendorSignIn = async (email: string, password: string): Promise<{ vendor: Vendor; accessToken: string }> => {
  try {
    console.log('🔐 Signing in vendor with email:', email);
    
    const response = await fetch(`${SERVER_URL}/vendor/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Vendor sign in API error:', data);
      throw new Error(data.error || 'Vendor sign in failed');
    }

    // Store vendor access token in localStorage
    if (data.access_token) {
      localStorage.setItem('vendor_access_token', data.access_token);
      console.log('✅ Vendor access token stored successfully');
    } else {
      console.error('❌ No vendor access token received from signin');
    }

    return {
      vendor: data.profile,
      accessToken: data.access_token
    };
  } catch (error: any) {
    console.error('Vendor sign in error:', error);
    throw new Error(error.message || 'Vendor sign in failed');
  }
};

export const vendorSignOut = async (): Promise<void> => {
  try {
    // Clear local storage
    localStorage.removeItem('vendor_access_token');
    console.log('✅ Vendor signed out successfully');
  } catch (error: any) {
    console.error('Vendor sign out error:', error);
    // Don't throw - always clear the token
    localStorage.removeItem('vendor_access_token');
  }
};

export const getCurrentVendor = async (): Promise<Vendor | null> => {
  try {
    const accessToken = localStorage.getItem('vendor_access_token');
    if (!accessToken) {
      return null;
    }

    const response = await fetch(`${SERVER_URL}/vendor/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid, clear it
        localStorage.removeItem('vendor_access_token');
        return null;
      }
      throw new Error('Failed to get current vendor');
    }

    const vendorData = await response.json();
    return {
      ...vendorData,
      createdAt: new Date(vendorData.createdAt)
    };
  } catch (error: any) {
    console.error('Get current vendor error:', error);
    return null;
  }
};

export const getVendorAccessToken = (): string | null => {
  return localStorage.getItem('vendor_access_token');
};

export const testVendorAccessToken = async (): Promise<boolean> => {
  try {
    const vendor = await getCurrentVendor();
    return vendor !== null;
  } catch (error) {
    console.error('Vendor access token test failed:', error);
    return false;
  }
};
