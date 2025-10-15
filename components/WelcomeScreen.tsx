import React, { useState, useEffect } from 'react';
import { ArrowRight, MapPin, TrendingUp, Users, Award, Heart, ShoppingBag, Star, Zap, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { InfoPanel, EconomicImpactPanel, StatsPanel, TipPanel } from './InfoPanel';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Heart className="w-8 h-8 text-red-500" />,
      title: "Support Local Heroes",
      description: "Every purchase directly supports Indian entrepreneurs and artisans across the country",
      bgGradient: "from-red-50 to-pink-50"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-green-500" />,
      title: "Track Your GDP Impact",
      description: "See exactly how your purchases contribute to India's economic growth in real-time",
      bgGradient: "from-green-50 to-emerald-50"
    },
    {
      icon: <Users className="w-8 h-8 text-blue-500" />,
      title: "Join the Community",
      description: "Connect with like-minded Indians who are passionate about supporting local businesses",
      bgGradient: "from-blue-50 to-indigo-50"
    },
    {
      icon: <Award className="w-8 h-8 text-yellow-500" />,
      title: "Earn Rewards",
      description: "Get points for every purchase and unlock exclusive benefits as you support India",
      bgGradient: "from-yellow-50 to-orange-50"
    }
  ];

  const stats = [
    { icon: <ShoppingBag />, label: "Local Vendors", value: "10,000+", color: "text-green-600" },
    { icon: <Users />, label: "Happy Customers", value: "50,000+", color: "text-blue-600" },
    { icon: <TrendingUp />, label: "GDP Contribution", value: "₹500Cr+", color: "text-purple-600" },
    { icon: <Star />, label: "Average Rating", value: "4.8/5", color: "text-yellow-600" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex flex-col">
      {/* Header */}
      <div className={`px-6 py-8 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-white">🇮🇳</span>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">
          Swa<span className="text-orange-500">Desi</span>
        </h1>
        <p className="text-center text-gray-600 text-lg">
          Made in India, Made for India
        </p>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className={`text-center mb-12 transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
            Transform Your Shopping Into
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
              Economic Empowerment
            </span>
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
            Discover authentic Indian products while tracking your real contribution to the nation's GDP growth
          </p>
        </div>

        {/* Feature Carousel */}
        <div className="w-full max-w-sm mb-12">
          <div className="relative h-48 rounded-2xl overflow-hidden shadow-lg">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} p-6 flex flex-col items-center justify-center text-center transition-all duration-500 ${
                  index === currentSlide 
                    ? 'translate-x-0 opacity-100' 
                    : index < currentSlide 
                      ? '-translate-x-full opacity-0' 
                      : 'translate-x-full opacity-0'
                }`}
              >
                <div className="mb-4 p-3 bg-white rounded-full shadow-md">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Carousel Indicators */}
          <div className="flex justify-center mt-4 space-x-2">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-orange-500 w-6' 
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className={`w-full max-w-md mb-12 transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-4 shadow-md text-center">
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 ${stat.color} mb-2`}>
                  {React.cloneElement(stat.icon, { className: "w-4 h-4" })}
                </div>
                <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Info Panels - New Apple-like Design Preview */}
        <div className={`w-full max-w-md mb-8 transition-all duration-1000 delay-900 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="space-y-4">
            <h3 className="text-center text-lg font-semibold text-gray-900 mb-4">
              🎉 New: Beautiful Info Panels
            </h3>
            
            {/* Demo Economic Impact Panel */}
            <div className="bg-black p-4 rounded-2xl">
              <EconomicImpactPanel
                totalSpent={15000}
                madeInIndiaSpent={11250}
                gdpContribution={2025}
                jobsSupported={3}
              />
            </div>

            {/* Demo Stats Panel */}
            <div className="bg-black p-2 rounded-2xl">
              <div className="grid grid-cols-2 gap-3">
                <StatsPanel
                  label="Your Impact"
                  value="₹2,025"
                  change={18}
                  icon={<TrendingUp className="w-5 h-5 text-green-400" />}
                />
                <StatsPanel
                  label="Points Earned"
                  value="1,250"
                  change={25}
                  icon={<Zap className="w-5 h-5 text-yellow-400" />}
                />
              </div>
            </div>

            {/* Demo Tip Panel */}
            <div className="bg-black p-4 rounded-2xl">
              <TipPanel
                tip="Every ₹1000 you spend on Made in India products contributes ₹180 to India's GDP!"
                category="💡 Did you know?"
                dismissible={false}
              />
            </div>

            {/* Demo Success Panel */}
            <div className="bg-black p-4 rounded-2xl">
              <InfoPanel
                variant="success"
                title="Ready to make an impact?"
                description="Join thousands of Indians who are already contributing to our economy!"
                badge="🇮🇳"
              />
            </div>
          </div>
        </div>

        {/* Traditional Key Benefits (kept for context) */}
        <div className={`w-full max-w-md mb-12 transition-all duration-1000 delay-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 bg-white rounded-xl p-4 shadow-sm">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">AI-Powered Smart Shopping</div>
                <div className="text-sm text-gray-600">Personalized recommendations with GDP impact insights</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 bg-white rounded-xl p-4 shadow-sm">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Authentic Local Products</div>
                <div className="text-sm text-gray-600">Verified Made in India goods from trusted vendors</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 bg-white rounded-xl p-4 shadow-sm">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Globe className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">GDP Impact Tracking</div>
                <div className="text-sm text-gray-600">See exactly how your purchases contribute to India's ₹500Cr+ economy</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className={`w-full max-w-md transition-all duration-1000 delay-1100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <Button
            onClick={onGetStarted}
            className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Start Your Journey
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <p className="text-center text-xs text-gray-500 mt-4">
            Join thousands of Indians supporting local businesses
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className={`px-6 py-6 text-center transition-all duration-1000 delay-1300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
          <span>Proudly</span>
          <Heart className="w-4 h-4 text-red-500" />
          <span>Made in India</span>
        </div>
      </div>
    </div>
  );
};

export { WelcomeScreen };
export default WelcomeScreen;
