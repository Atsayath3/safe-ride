import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Users, Car, Shield, MapPin, Clock, Star, ArrowRight, CheckCircle } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Top Navigation Bar */}
      <nav className="bg-gray-800 shadow-lg border-b-2 border-gray-700">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <img src="/logo.png" alt="Safe Ride" className="w-16 h-16 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-white">Safe Ride</h1>
                <p className="text-sm text-slate-300 font-medium">School Transportation Platform</p>
              </div>
            </div>
            
            {/* Admin Login */}
            <Button 
              onClick={() => navigate('/admin/login')}
              variant="outline"
              className="border-2 border-red-500 text-red-400 hover:bg-red-500 hover:text-white font-semibold px-6 py-2 h-11 bg-transparent"
            >
              Admin Login
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        
        {/* User Selection Cards Row */}
        <div className="grid lg:grid-cols-2 gap-8 mb-20">
          {/* Parent Card */}
          <Card className="bg-white border-2 border-gray-200 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-xl">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Parents</h2>
                    <p className="text-gray-600 font-semibold">Manage your child's rides</p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>
              
              <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                Book rides, track your child in real-time, and communicate directly with trusted drivers.
              </p>
              
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-800 font-medium text-sm">Live tracking</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-800 font-medium text-sm">Secure booking</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  <span className="text-gray-800 font-medium text-sm">Direct chat</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  <span className="text-gray-800 font-medium text-sm">Safe payments</span>
                </div>
              </div>
              
              <Button 
                onClick={() => navigate('/parent/login')}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white font-bold text-lg shadow-xl rounded-xl"
              >
                I'm a Parent
              </Button>
            </CardContent>
          </Card>

          {/* Driver Card */}
          <Card className="bg-white border-2 border-gray-200 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-xl">
                    <Car className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Drivers</h2>
                    <p className="text-gray-600 font-semibold">Grow your transport business</p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>
              
              <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                Connect with families and manage your routes efficiently with our professional platform.
              </p>
              
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-gray-800 font-medium text-sm">Flexible schedule</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-gray-800 font-medium text-sm">Steady income</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-gray-800 font-medium text-sm">Easy management</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-gray-800 font-medium text-sm">Secure payments</span>
                </div>
              </div>
              
              <Button 
                onClick={() => navigate('/driver/login')}
                className="w-full h-14 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold text-lg shadow-xl rounded-xl"
              >
                I'm a Driver
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Hero Content Section */}
        <div className="text-center space-y-12 mb-20">
          {/* Trust Badge */}
          <div className="inline-flex items-center px-6 py-3 bg-green-900/30 border border-green-400 rounded-full backdrop-blur-sm">
            <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
            <span className="text-green-300 font-semibold text-lg">Trusted by 1000+ families across Sri Lanka</span>
          </div>
          
          {/* Main Heading */}
          <div className="space-y-6">
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
              Safe School
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Transportation
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 leading-relaxed font-medium max-w-4xl mx-auto">
              Connect with verified drivers for reliable, secure school transportation. 
              Real-time tracking and complete peace of mind for every journey.
            </p>
            
            <p className="text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed mt-8 font-medium">
              We've built Sri Lanka's most trusted platform for school transportation, 
              prioritizing safety, reliability, and complete peace of mind.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
            <Card className="bg-slate-900/60 border-2 border-blue-400/30 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-400/30">
                  <Shield className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Verified Drivers</h3>
                <p className="text-slate-300 leading-relaxed text-lg">
                  Thorough background checks and verification for maximum safety and trust.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-2 border-green-400/30 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-600/20 to-green-700/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-green-400/30">
                  <MapPin className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Live Tracking</h3>
                <p className="text-slate-300 leading-relaxed text-lg">
                  Real-time GPS tracking lets you monitor every journey from pickup to school.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-2 border-purple-400/30 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600/20 to-purple-700/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-purple-400/30">
                  <Clock className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Reliable Schedule</h3>
                <p className="text-slate-300 leading-relaxed text-lg">
                  Consistent pickup and drop-off times you can count on, every single day.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-2 border-amber-400/30 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-600/20 to-amber-700/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-amber-400/30">
                  <Star className="w-10 h-10 text-amber-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Trusted Service</h3>
                <p className="text-slate-300 leading-relaxed text-lg">
                  Highly rated by parents and schools across Sri Lanka for exceptional service.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <img src="/logo.png" alt="Safe Ride" className="w-14 h-14 object-contain" />
            <span className="text-2xl font-bold">Safe Ride</span>
          </div>
          <p className="text-slate-400 text-lg mb-4">
            © 2025 Safe Ride. All rights reserved.
          </p>
          <p className="text-slate-500 text-lg font-semibold">
            Safe • Reliable • Trusted
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
