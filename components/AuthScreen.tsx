import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { User } from '../App';
import { signUp, signIn } from '../utils/supabase/auth';

interface AuthScreenProps {
  onLogin: (user: User) => void;
  onVendorLogin?: () => void;
}

export function AuthScreen({ onLogin, onVendorLogin }: AuthScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [debugClickCount, setDebugClickCount] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);

    try {
      const { user } = await signIn(formData.email, formData.password);
      onLogin(user);
      toast.success('Welcome back!');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Login failed. Please try again.';
      
      if (errorMessage.includes('No account found with this email')) {
        toast.error('No account found. Please sign up first!', {
          duration: 4000,
        });
        // Auto-switch to signup tab after a delay
        setTimeout(() => {
          const signupTab = document.querySelector('[value="signup"]') as HTMLElement;
          signupTab?.click();
        }, 2000);
      } else if (errorMessage.includes('Failed to retrieve user profile')) {
        toast.error('Account issue detected. Please try signing in again or contact support.');
      } else if (errorMessage.includes('Incorrect password')) {
        toast.error('Incorrect password. Please try again.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.name || !formData.phone) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const user = await signUp(formData.email, formData.password, formData.name, formData.phone);
      
      // Check if user has an access token (successful auto-signin)
      const hasAccessToken = localStorage.getItem('supabase_access_token');
      
      if (hasAccessToken) {
        onLogin(user);
        toast.success('Welcome! You got 100 welcome points!');
      } else {
        // Account created but needs manual signin
        toast.success('Account created successfully! Please sign in with your credentials.');
        // Auto-switch to login tab
        setTimeout(() => {
          const loginTab = document.querySelector('[value="login"]') as HTMLElement;
          loginTab?.click();
          // Pre-fill the email
          setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        }, 1000);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      const errorMessage = error.message || 'Signup failed. Please try again.';
      
      if (errorMessage.includes('already exists') || errorMessage.includes('already been registered')) {
        toast.error('An account with this email already exists. Please sign in instead.');
        // Auto-switch to login tab
        setTimeout(() => {
          const loginTab = document.querySelector('[value="login"]') as HTMLElement;
          loginTab?.click();
        }, 2000);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md apple-card apple-shadow-lg">
        <div className="text-center bg-apple-blue p-8 rounded-t-2xl">
          <h1 
            className="text-3xl font-black text-white tracking-tight cursor-pointer select-none"
            onClick={() => {
              setDebugClickCount(prev => prev + 1);
              if (debugClickCount >= 6) {
                const token = localStorage.getItem('supabase_access_token');
                toast.info(`Debug: Token ${token ? 'present' : 'missing'}`);
                setDebugClickCount(0);
              }
            }}
          >
            SwaDesi
          </h1>
          <p className="text-white/90 font-semibold mt-2 text-base">
            Shop local, earn rewards, support Made in India
          </p>
        </div>
        
        <div className="p-8">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/50 rounded-2xl p-1">
              <TabsTrigger value="login" className="font-bold rounded-xl">Login</TabsTrigger>
              <TabsTrigger value="signup" className="font-bold rounded-xl">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-6 mt-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-base font-semibold">Email or Phone</Label>
                  <Input
                    id="email"
                    type="text"
                    placeholder="Enter email or phone"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="rounded-2xl h-12 bg-secondary border-none text-base"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-base font-semibold">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="rounded-2xl h-12 bg-secondary border-none text-base"
                  />
                </div>
                
                <Button type="submit" className="w-full bg-apple-blue hover:bg-apple-blue/90 font-bold h-12 rounded-2xl apple-button" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full font-bold border-apple-orange text-apple-orange hover:bg-apple-orange hover:text-white h-12 rounded-2xl apple-button"
                  onClick={() => {
                    const demoUser: User = {
                      id: 'demo_user',
                      name: 'Demo User',
                      email: 'demo@swadesi.com',
                      phone: '+91 9876543210',
                      points: 250,
                      pointsLifetime: 500,
                      pointsTier: 'bronze',
                      streakDays: 3
                    };
                    onLogin(demoUser);
                    toast.success('Welcome to the demo!');
                  }}
                >
                  Try Demo
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-5 mt-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-base font-semibold">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="rounded-2xl h-12 bg-secondary border-none text-base"
                    required
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="signup-email" className="text-base font-semibold">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="rounded-2xl h-12 bg-secondary border-none text-base"
                    required
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-base font-semibold">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="rounded-2xl h-12 bg-secondary border-none text-base"
                    required
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="signup-password" className="text-base font-semibold">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="rounded-2xl h-12 bg-secondary border-none text-base"
                    required
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="confirm-password" className="text-base font-semibold">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="rounded-2xl h-12 bg-secondary border-none text-base"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full bg-apple-green hover:bg-apple-green/90 font-bold h-12 rounded-2xl apple-button mt-6" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          {onVendorLogin && (
            <div className="mt-6 pt-6 border-t border-border">
              <Button
                variant="ghost"
                onClick={onVendorLogin}
                className="w-full font-semibold text-muted-foreground hover:text-swadesi-orange"
              >
                🏪 Are you a vendor? Login here
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
