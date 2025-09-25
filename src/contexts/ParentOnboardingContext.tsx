import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ParentOnboardingData {
  // Step 1: Authentication (handled by existing auth)
  email: string;
  password: string;
  
  // Step 2: Personal Information
  firstName: string;
  lastName: string;
  phoneNumber: string;
  nicNumber: string;
  
  // Step 3: Home Location
  homeLocation: {
    lat: number;
    lng: number;
    address: string;
  } | null;
  
  // Step 4: Children Information
  numberOfChildren: number;
  children: Array<{
    id: string;
    firstName: string;
    lastName: string;
    schoolLocation: {
      lat: number;
      lng: number;
      address: string;
    } | null;
    age?: number;
    grade?: string;
  }>;
}

interface OnboardingContextType {
  data: ParentOnboardingData;
  currentStep: number;
  updateData: (updates: Partial<ParentOnboardingData>) => void;
  nextStep: () => void;
  previousStep: () => void;
  setStep: (step: number) => void;
  resetOnboarding: () => void;
}

const initialData: ParentOnboardingData = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  nicNumber: '',
  homeLocation: null,
  numberOfChildren: 1,
  children: []
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [data, setData] = useState<ParentOnboardingData>(initialData);
  const [currentStep, setCurrentStep] = useState(1);

  const updateData = (updates: Partial<ParentOnboardingData>) => {
    console.log('🔥 CONTEXT: updateData called with:', updates); // Debug log
    
    // Special handling for children updates
    if (updates.children) {
      console.log('🔥 CONTEXT: Children update detected');
      console.log('🔥 CONTEXT: Previous children:', data.children.map((c, i) => ({ index: i, schoolLocation: c.schoolLocation?.address || 'None' })));
      console.log('🔥 CONTEXT: New children:', updates.children.map((c, i) => ({ index: i, schoolLocation: c.schoolLocation?.address || 'None' })));
    }
    
    setData(prev => {
      const newData = { ...prev, ...updates };
      
      if (updates.children) {
        console.log('🔥 CONTEXT: Final data after merge:', newData.children.map((c, i) => ({ index: i, schoolLocation: c.schoolLocation?.address || 'None' })));
      }
      
      console.log('🔥 CONTEXT: Complete updated data:', newData); // Debug log
      return newData;
    });
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const previousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const setStep = (step: number) => {
    setCurrentStep(Math.max(1, Math.min(step, 5)));
  };

  const resetOnboarding = () => {
    setData(initialData);
    setCurrentStep(1);
  };

  const value = {
    data,
    currentStep,
    updateData,
    nextStep,
    previousStep,
    setStep,
    resetOnboarding
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};