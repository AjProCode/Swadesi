import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Home, Briefcase, Heart, Navigation, Clock, Truck } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { toast } from 'sonner@2.0.3';

export type Address = {
  id: string;
  nickname: string;
  type: 'home' | 'work' | 'friend' | 'other';
  fullAddress: string;
  apartment?: string;
  landmark?: string;
  contactPerson?: string;
  contactPhone?: string;
  instructions?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isDefault: boolean;
  deliveryArea: string;
  estimatedDeliveryTime: number; // in minutes
  deliveryFee: number;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
};

interface AddressManagerProps {
  addresses: Address[];
  selectedAddress?: Address;
  onAddressChange: (addresses: Address[]) => void;
  onSelectAddress?: (address: Address) => void;
  mode?: 'manage' | 'select';
  showDeliveryInfo?: boolean;
}

const addressTypeIcons = {
  home: Home,
  work: Briefcase,
  friend: Heart,
  other: MapPin
};

const addressTypeColors = {
  home: 'bg-green-500',
  work: 'bg-blue-500',
  friend: 'bg-pink-500',
  other: 'bg-gray-500'
};

const deliveryAreas = [
  { name: 'Central Delhi', fee: 20, time: 25 },
  { name: 'South Delhi', fee: 30, time: 35 },
  { name: 'North Delhi', fee: 25, time: 30 },
  { name: 'East Delhi', fee: 35, time: 40 },
  { name: 'West Delhi', fee: 30, time: 35 },
  { name: 'Gurgaon', fee: 45, time: 50 },
  { name: 'Noida', fee: 40, time: 45 },
  { name: 'Faridabad', fee: 50, time: 55 },
  { name: 'Ghaziabad', fee: 45, time: 50 }
];

export function AddressManager({ 
  addresses, 
  selectedAddress, 
  onAddressChange, 
  onSelectAddress, 
  mode = 'manage',
  showDeliveryInfo = false
}: AddressManagerProps) {
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
    type: 'home' as Address['type'],
    fullAddress: '',
    apartment: '',
    landmark: '',
    contactPerson: '',
    contactPhone: '',
    instructions: '',
    deliveryArea: 'Central Delhi'
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!isAddingAddress && !editingAddress) {
      setFormData({
        nickname: '',
        type: 'home',
        fullAddress: '',
        apartment: '',
        landmark: '',
        contactPerson: '',
        contactPhone: '',
        instructions: '',
        deliveryArea: 'Central Delhi'
      });
    }
  }, [isAddingAddress, editingAddress]);

  // Populate form when editing
  useEffect(() => {
    if (editingAddress) {
      setFormData({
        nickname: editingAddress.nickname,
        type: editingAddress.type,
        fullAddress: editingAddress.fullAddress,
        apartment: editingAddress.apartment || '',
        landmark: editingAddress.landmark || '',
        contactPerson: editingAddress.contactPerson || '',
        contactPhone: editingAddress.contactPhone || '',
        instructions: editingAddress.instructions || '',
        deliveryArea: editingAddress.deliveryArea
      });
    }
  }, [editingAddress]);

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      // Simulate reverse geocoding (in real app, use Google Maps API)
      const mockAddress = `Near ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
      
      setFormData(prev => ({
        ...prev,
        fullAddress: mockAddress,
        landmark: 'Current location'
      }));

      toast.success('Location detected successfully!');
    } catch (error) {
      console.error('Error getting location:', error);
      toast.error('Could not get your location. Please enter address manually.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const validateForm = () => {
    if (!formData.nickname.trim()) {
      toast.error('Please enter a nickname for this address');
      return false;
    }
    if (!formData.fullAddress.trim()) {
      toast.error('Please enter the full address');
      return false;
    }
    return true;
  };

  const handleSaveAddress = () => {
    if (!validateForm()) return;

    const selectedArea = deliveryAreas.find(area => area.name === formData.deliveryArea);
    
    const newAddress: Address = {
      id: editingAddress?.id || `addr_${Date.now()}`,
      nickname: formData.nickname,
      type: formData.type,
      fullAddress: formData.fullAddress,
      apartment: formData.apartment || undefined,
      landmark: formData.landmark || undefined,
      contactPerson: formData.contactPerson || undefined,
      contactPhone: formData.contactPhone || undefined,
      instructions: formData.instructions || undefined,
      isDefault: addresses.length === 0, // First address is default
      deliveryArea: formData.deliveryArea,
      estimatedDeliveryTime: selectedArea?.time || 30,
      deliveryFee: selectedArea?.fee || 25,
      isActive: true,
      createdAt: editingAddress?.createdAt || new Date(),
      lastUsedAt: editingAddress?.lastUsedAt
    };

    let updatedAddresses;
    if (editingAddress) {
      updatedAddresses = addresses.map(addr => 
        addr.id === editingAddress.id ? newAddress : addr
      );
      toast.success('Address updated successfully!');
    } else {
      updatedAddresses = [newAddress, ...addresses];
      toast.success('Address added successfully!');
    }

    onAddressChange(updatedAddresses);
    setIsAddingAddress(false);
    setEditingAddress(null);
  };

  const handleDeleteAddress = (addressId: string) => {
    const addressToDelete = addresses.find(addr => addr.id === addressId);
    if (addressToDelete?.isDefault && addresses.length > 1) {
      // If deleting default address, make the next one default
      const updatedAddresses = addresses
        .filter(addr => addr.id !== addressId)
        .map((addr, index) => index === 0 ? { ...addr, isDefault: true } : addr);
      onAddressChange(updatedAddresses);
    } else {
      onAddressChange(addresses.filter(addr => addr.id !== addressId));
    }
    toast.success('Address deleted successfully!');
  };

  const handleSetDefault = (addressId: string) => {
    const updatedAddresses = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    }));
    onAddressChange(updatedAddresses);
    toast.success('Default address updated!');
  };

  const handleSelectAddress = (address: Address) => {
    if (onSelectAddress) {
      // Update last used timestamp
      const updatedAddresses = addresses.map(addr => 
        addr.id === address.id 
          ? { ...addr, lastUsedAt: new Date() }
          : addr
      );
      onAddressChange(updatedAddresses);
      onSelectAddress(address);
    }
  };

  const getAddressTypeIcon = (type: Address['type']) => {
    const Icon = addressTypeIcons[type];
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      {mode === 'manage' && (
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Saved Addresses</h3>
            <p className="text-sm text-muted-foreground">
              Manage your delivery addresses
            </p>
          </div>
          <Dialog open={isAddingAddress} onOpenChange={setIsAddingAddress}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Address
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Address</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nickname">Address Nickname</Label>
                  <Input
                    id="nickname"
                    placeholder="e.g., Home, Office"
                    value={formData.nickname}
                    onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="type">Address Type</Label>
                  <Select value={formData.type} onValueChange={(value: Address['type']) => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">🏠 Home</SelectItem>
                      <SelectItem value="work">💼 Work</SelectItem>
                      <SelectItem value="friend">❤️ Friend/Family</SelectItem>
                      <SelectItem value="other">📍 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="fullAddress">Full Address</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={getCurrentLocation}
                      disabled={isGettingLocation}
                      className="flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3" />
                      {isGettingLocation ? 'Getting...' : 'Use GPS'}
                    </Button>
                  </div>
                  <Textarea
                    id="fullAddress"
                    placeholder="Enter complete address"
                    value={formData.fullAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullAddress: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="apartment">Apartment/Floor</Label>
                    <Input
                      id="apartment"
                      placeholder="e.g., 4th Floor"
                      value={formData.apartment}
                      onChange={(e) => setFormData(prev => ({ ...prev, apartment: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="landmark">Landmark</Label>
                    <Input
                      id="landmark"
                      placeholder="e.g., Near Metro"
                      value={formData.landmark}
                      onChange={(e) => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="deliveryArea">Delivery Area</Label>
                  <Select value={formData.deliveryArea} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, deliveryArea: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryAreas.map(area => (
                        <SelectItem key={area.name} value={area.name}>
                          {area.name} - ₹{area.fee} ({area.time} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      placeholder="Name (optional)"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      placeholder="Phone (optional)"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="instructions">Delivery Instructions</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Special instructions for delivery (optional)"
                    value={formData.instructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSaveAddress} className="flex-1">
                    Save Address
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingAddress(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {addresses.length === 0 ? (
        <Card className="p-8 text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No addresses saved</h3>
          <p className="text-muted-foreground mb-4">
            Add your first delivery address to get started
          </p>
          {mode === 'manage' && (
            <Button onClick={() => setIsAddingAddress(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {addresses
            .sort((a, b) => {
              if (a.isDefault) return -1;
              if (b.isDefault) return 1;
              if (a.lastUsedAt && b.lastUsedAt) {
                return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
              }
              return 0;
            })
            .map((address) => (
              <Card 
                key={address.id} 
                className={`p-4 transition-all ${
                  mode === 'select' 
                    ? 'cursor-pointer hover:border-primary' + 
                      (selectedAddress?.id === address.id ? ' border-primary bg-primary/5' : '')
                    : ''
                }`}
                onClick={() => mode === 'select' && handleSelectAddress(address)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${addressTypeColors[address.type]}`}>
                      {getAddressTypeIcon(address.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{address.nickname}</h4>
                        {address.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {address.fullAddress}
                      </p>
                      {(address.apartment || address.landmark) && (
                        <div className="flex gap-2 mb-2">
                          {address.apartment && (
                            <Badge variant="outline" className="text-xs">
                              {address.apartment}
                            </Badge>
                          )}
                          {address.landmark && (
                            <Badge variant="outline" className="text-xs">
                              📍 {address.landmark}
                            </Badge>
                          )}
                        </div>
                      )}
                      {showDeliveryInfo && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {address.estimatedDeliveryTime} min
                          </div>
                          <div className="flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            ₹{address.deliveryFee}
                          </div>
                        </div>
                      )}
                      {address.instructions && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          "{address.instructions}"
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {mode === 'manage' && (
                    <div className="flex items-center gap-2">
                      {!address.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(address.id)}
                          className="text-xs"
                        >
                          Set Default
                        </Button>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setEditingAddress(address)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Address</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* Same form fields as add address */}
                            <div>
                              <Label htmlFor="edit-nickname">Address Nickname</Label>
                              <Input
                                id="edit-nickname"
                                placeholder="e.g., Home, Office"
                                value={formData.nickname}
                                onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                              />
                            </div>

                            <div>
                              <Label htmlFor="edit-type">Address Type</Label>
                              <Select value={formData.type} onValueChange={(value: Address['type']) => 
                                setFormData(prev => ({ ...prev, type: value }))
                              }>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="home">🏠 Home</SelectItem>
                                  <SelectItem value="work">💼 Work</SelectItem>
                                  <SelectItem value="friend">❤️ Friend/Family</SelectItem>
                                  <SelectItem value="other">📍 Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="edit-fullAddress">Full Address</Label>
                              <Textarea
                                id="edit-fullAddress"
                                placeholder="Enter complete address"
                                value={formData.fullAddress}
                                onChange={(e) => setFormData(prev => ({ ...prev, fullAddress: e.target.value }))}
                                rows={3}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor="edit-apartment">Apartment/Floor</Label>
                                <Input
                                  id="edit-apartment"
                                  placeholder="e.g., 4th Floor"
                                  value={formData.apartment}
                                  onChange={(e) => setFormData(prev => ({ ...prev, apartment: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-landmark">Landmark</Label>
                                <Input
                                  id="edit-landmark"
                                  placeholder="e.g., Near Metro"
                                  value={formData.landmark}
                                  onChange={(e) => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
                                />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="edit-deliveryArea">Delivery Area</Label>
                              <Select value={formData.deliveryArea} onValueChange={(value) => 
                                setFormData(prev => ({ ...prev, deliveryArea: value }))
                              }>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {deliveryAreas.map(area => (
                                    <SelectItem key={area.name} value={area.name}>
                                      {area.name} - ₹{area.fee} ({area.time} min)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="edit-instructions">Delivery Instructions</Label>
                              <Textarea
                                id="edit-instructions"
                                placeholder="Special instructions for delivery (optional)"
                                value={formData.instructions}
                                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                                rows={2}
                              />
                            </div>

                            <div className="flex gap-3 pt-4">
                              <Button onClick={handleSaveAddress} className="flex-1">
                                Update Address
                              </Button>
                              <Button variant="outline" onClick={() => setEditingAddress(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAddress(address.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}