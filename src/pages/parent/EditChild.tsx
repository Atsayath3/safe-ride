import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import MobileLayout from '@/components/mobile/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';

interface ChildFormData {
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  schoolName: string;
  studentId: string;
}

const EditChild = () => {
  const navigate = useNavigate();
  const { childId } = useParams<{ childId: string }>();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState<ChildFormData>({
    fullName: '',
    dateOfBirth: '',
    gender: 'male',
    schoolName: '',
    studentId: '',
  });

  useEffect(() => {
    const fetchChildData = async () => {
      if (!childId || !currentUser) return;
      
      try {
        const childDocRef = doc(db, 'children', childId);
        const childDoc = await getDoc(childDocRef);
        
        if (childDoc.exists()) {
          const data = childDoc.data();
          // Verify this child belongs to the current parent
          if (data.parentId !== currentUser.uid) {
            toast({
              title: "Error",
              description: "You don't have permission to edit this child",
              variant: "destructive"
            });
            navigate('/parent/dashboard');
            return;
          }
          
          setFormData({
            fullName: data.fullName || '',
            dateOfBirth: data.dateOfBirth?.toDate?.() 
              ? data.dateOfBirth.toDate().toISOString().split('T')[0] 
              : data.dateOfBirth || '',
            gender: data.gender || 'male',
            schoolName: data.schoolName || '',
            studentId: data.studentId || '',
          });
        } else {
          toast({
            title: "Error",
            description: "Child not found",
            variant: "destructive"
          });
          navigate('/parent/dashboard');
        }
      } catch (error: any) {
        console.error('Error fetching child data:', error);
        toast({
          title: "Error",
          description: "Failed to load child data",
          variant: "destructive"
        });
        navigate('/parent/dashboard');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchChildData();
  }, [childId, currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!childId) return;
    
    // Validation
    if (!formData.fullName.trim()) {
      toast({
        title: "Error",
        description: "Please enter the child's full name",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.dateOfBirth) {
      toast({
        title: "Error",
        description: "Please enter the child's date of birth",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.schoolName.trim()) {
      toast({
        title: "Error",
        description: "Please enter the school name",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const childDocRef = doc(db, 'children', childId);
      await updateDoc(childDocRef, {
        fullName: formData.fullName.trim(),
        dateOfBirth: new Date(formData.dateOfBirth),
        gender: formData.gender,
        schoolName: formData.schoolName.trim(),
        studentId: formData.studentId.trim(),
        updatedAt: new Date()
      });

      toast({
        title: "Success!",
        description: "Child information updated successfully",
      });
      
      navigate('/parent/dashboard');
    } catch (error: any) {
      console.error('Error updating child:', error);
      toast({
        title: "Error",
        description: "Failed to update child information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/parent/dashboard');
  };

  if (initialLoading) {
    return (
      <MobileLayout 
        title="Edit Child" 
        showBack={true} 
        onBack={handleBack}
      >
        <div className="p-4 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading child information...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title="Edit Child" 
      showBack={true} 
      onBack={handleBack}
    >
      <div className="p-4">
        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="font-nunito text-xl text-center">
              Edit Child Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter child's full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <select
                  id="gender"
                  className="w-full h-12 rounded-md border border-input bg-background px-3 text-base"
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'other' }))}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name *</Label>
                <Input
                  id="schoolName"
                  type="text"
                  placeholder="Enter school name"
                  value={formData.schoolName}
                  onChange={(e) => setFormData(prev => ({ ...prev, schoolName: e.target.value }))}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  type="text"
                  placeholder="Enter student ID (optional)"
                  value={formData.studentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                  className="h-12"
                />
              </div>

              <div className="space-y-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 font-medium rounded-xl"
                  size="lg"
                >
                  {loading ? 'Updating...' : 'Update Child Information'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="w-full h-12 font-medium rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default EditChild;
