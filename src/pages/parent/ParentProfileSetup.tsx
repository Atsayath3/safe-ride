import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import MobileLayout from '@/components/mobile/MobileLayout';

const ParentProfileSetup = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: userProfile?.firstName || '',
    lastName: userProfile?.lastName || '',
    phone: userProfile?.phone || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserProfile({ ...form, profileComplete: true });
      toast({ title: 'Profile updated', description: 'Your details have been saved.' });
      navigate('/parent/dashboard');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout title="Complete Your Profile">
      <form className="space-y-6 p-4" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" name="phone" value={form.phone} onChange={handleChange} required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Saving...' : 'Save & Continue'}</Button>
      </form>
    </MobileLayout>
  );
};

export default ParentProfileSetup;
