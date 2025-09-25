import React from 'react';
import { OnboardingProvider, useOnboarding } from '@/contexts/ParentOnboardingContext';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import step components
import Step1Authentication from './steps/Step1Authentication';
import Step2PersonalInfo from './steps/Step2PersonalInfo';
import Step3HomeLocation from './steps/Step3HomeLocation';
import Step4ChildrenSetup from './steps/Step4ChildrenSetup';
import Step5ReviewConfirm from './steps/Step5ReviewConfirm';

const OnboardingContent: React.FC = () => {
  const { currentStep, previousStep } = useOnboarding();
  const navigate = useNavigate();

  const stepTitles = [
    'Create Account',
    'Personal Information', 
    'Home Location',
    'Children Setup',
    'Review & Confirm'
  ];

  const progress = (currentStep / 5) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1Authentication />;
      case 2: return <Step2PersonalInfo />;
      case 3: return <Step3HomeLocation />;
      case 4: return <Step4ChildrenSetup />;
      case 5: return <Step5ReviewConfirm />;
      default: return <Step1Authentication />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src="/logo.png" alt="SafeRide" className="w-16 h-16 object-contain" />
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-blue-900">SafeRide Parent Setup</h1>
              <p className="text-blue-600">Complete your profile to get started</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">
              Step {currentStep} of 5: {stepTitles[currentStep - 1]}
            </span>
            <span className="text-sm text-blue-600">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {stepTitles.map((title, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index + 1 < currentStep 
                    ? 'bg-green-500 text-white' 
                    : index + 1 === currentStep 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1 < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs text-gray-600 mt-1 text-center max-w-20">
                  {title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="shadow-xl border-0">
          <CardContent className="p-8">
            {/* Back button */}
            {currentStep > 1 && (
              <Button
                variant="ghost"
                onClick={previousStep}
                className="mb-6 text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}

            {/* Step Content */}
            {renderStep()}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <button 
              onClick={() => navigate('/parent/login')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const ParentOnboarding: React.FC = () => {
  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  );
};

export default ParentOnboarding;