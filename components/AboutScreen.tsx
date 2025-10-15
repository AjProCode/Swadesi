import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, TrendingUp, Users, Award, Heart, ShoppingBag, Star, Zap, Globe, Target, Shield, Smartphone, Coins, Crown, Gift, ChevronDown, Play } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface AboutScreenProps {
  onGetStarted: () => void;
  onBack: () => void;
}

const AboutScreen: React.FC<AboutScreenProps> = ({ onGetStarted, onBack }) => {
  const [activeSection, setActiveSection] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const sections = [
    {
      id: 'mission',
      title: 'Our Mission',
      subtitle: 'Empowering India, One Purchase at a Time',
      content: [
        {
          icon: <Heart className="w-6 h-6 text-red-500" />,
          title: 'Support Local Heroes',
          description: 'Every purchase directly impacts Indian entrepreneurs, artisans, and small businesses across the nation.'
        },
        {
          icon: <TrendingUp className="w-6 h-6 text-green-500" />,
          title: 'Track Real GDP Impact',
          description: 'See exactly how your spending contributes to India\'s economic growth with transparent analytics.'
        },
        {
          icon: <Globe className="w-6 h-6 text-blue-500" />,
          title: 'Authentic Made in India',
          description: 'Discover genuine Indian products with verified authenticity and cultural significance.'
        }
      ]
    },
    {
      id: 'features',
      title: 'Key Features',
      subtitle: 'Everything You Need in One App',
      content: [
        {
          icon: <Zap className="w-6 h-6 text-yellow-500" />,
          title: 'AI-Powered Shopping',
          description: 'Smart recommendations based on your preferences and economic impact goals.'
        },
        {
          icon: <Coins className="w-6 h-6 text-orange-500" />,
          title: 'Points & Rewards',
          description: 'Earn points for every purchase and unlock exclusive benefits as you support India.'
        },
        {
          icon: <Shield className="w-6 h-6 text-purple-500" />,
          title: 'Bill Verification',
          description: 'Upload bills from local stores and earn points while tracking your economic impact.'
        },
        {
          icon: <Users className="w-6 h-6 text-blue-500" />,
          title: 'Community Hub',
          description: 'Connect with like-minded Indians passionate about supporting local businesses.'
        }
      ]
    },
    {
      id: 'impact',
      title: 'Your Impact',
      subtitle: 'Making a Real Difference',
      content: [
        {
          icon: <Target className="w-6 h-6 text-green-500" />,
          title: 'GDP Contribution Tracking',
          description: 'Every ₹1000 spent contributes approximately ₹180 to India\'s GDP growth.'
        },
        {
          icon: <Award className="w-6 h-6 text-yellow-500" />,
          title: 'Job Creation Support',
          description: 'Your purchases create and sustain jobs across India\'s supply chain ecosystem.'
        },
        {
          icon: <Crown className="w-6 h-6 text-purple-500" />,
          title: 'Artisan Empowerment',
          description: 'Direct support to traditional craftspeople and their centuries-old skills.'
        }
      ]
    }
  ];

  const benefits = [
    {
      icon: <ShoppingBag className="w-5 h-5 text-green-500" />,
      text: '10,000+ Verified Local Vendors'
    },
    {
      icon: <Star className="w-5 h-5 text-yellow-500" />,
      text: '4.8/5 Average Customer Rating'
    },
    {
      icon: <Users className="w-5 h-5 text-blue-500" />,
      text: '50,000+ Happy Customers'
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-purple-500" />,
      text: '₹500Cr+ GDP Contribution'
    }
  ];

  const gamificationFeatures = [
    {
      title: '25-Level Progression',
      description: 'Advance through levels by supporting Made in India businesses',
      color: 'bg-blue-500'
    },
    {
      title: 'Tier-Based Rewards',
      description: 'From Bronze to Cosmic - unlock better benefits as you grow',
      color: 'bg-purple-500'
    },
    {
      title: 'Daily Challenges',
      description: 'Complete tasks to earn bonus points and achievements',
      color: 'bg-green-500'
    },
    {
      title: 'Premium Benefits',
      description: 'Exclusive offers, early access, and VIP customer support',
      color: 'bg-orange-500'
    }
  ];

  const nextSection = () => {
    setActiveSection((prev) => (prev + 1) % sections.length);
  };

  const prevSection = () => {
    setActiveSection((prev) => (prev - 1 + sections.length) % sections.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col">
      {/* Header */}
      <div className={`px-6 py-6 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-gray-400 hover:text-white p-2"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl">🇮🇳</span>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            About Swa<span className="text-orange-500">Desi</span>
          </h1>
          <p className="text-gray-400">
            Discover how we're revolutionizing Made in India shopping
          </p>
        </div>
      </div>

      {/* Hero Stats */}
      <div className={`px-6 mb-8 transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="grid grid-cols-2 gap-3">
          {benefits.map((benefit, index) => (
            <Card key={index} className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  {benefit.icon}
                </div>
                <p className="text-sm text-gray-300">{benefit.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="flex-1 px-6">
        <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {/* Section Navigation */}
          <div className="flex justify-center mb-6">
            <div className="flex space-x-2 bg-gray-800/50 rounded-xl p-1">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(index)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    activeSection === index
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </div>

          {/* Active Section Content */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {sections[activeSection].title}
              </h2>
              <p className="text-gray-400">
                {sections[activeSection].subtitle}
              </p>
            </div>

            <div className="space-y-4">
              {sections[activeSection].content.map((item, index) => (
                <Card key={index} className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-5">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-gray-700 rounded-lg">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">
                          {item.title}
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Gamification Section */}
        <div className={`mb-8 transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/30">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-white mb-2">
                  Gamified Experience
                </h3>
                <p className="text-gray-300 text-sm">
                  Turn your shopping into an exciting journey of impact and rewards
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {gamificationFeatures.map((feature, index) => (
                  <div key={index} className="bg-black/30 rounded-lg p-3">
                    <div className={`w-3 h-3 ${feature.color} rounded-full mb-2`}></div>
                    <h4 className="font-semibold text-white text-sm mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Special Features Highlight */}
        <div className={`mb-8 transition-all duration-1000 delay-900 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <Card className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-green-500/20 rounded-full">
                  <Smartphone className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Revolutionary Features
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Technology meets tradition for maximum impact
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300 text-sm">AI-powered smart assistant with 3 unique personalities</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-gray-300 text-sm">Real-time GDP impact tracking and analytics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-gray-300 text-sm">Social community hub for Made in India enthusiasts</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span className="text-gray-300 text-sm">Advanced bill scanner with vendor verification</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className={`px-6 py-8 transition-all duration-1000 delay-1100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-2">
              Ready to Make an Impact?
            </h3>
            <p className="text-gray-400 text-sm">
              Join thousands of Indians who are already contributing to our economy
            </p>
          </div>

          <Button
            onClick={onGetStarted}
            className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Your Journey
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Free to join • No hidden charges • 100% Made in India focus
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Pride Footer */}
      <div className={`px-6 py-4 text-center border-t border-gray-800 transition-all duration-1000 delay-1300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <span>Proudly</span>
          <Heart className="w-4 h-4 text-red-500" />
          <span>Made in India</span>
          <span className="text-orange-500">🇮🇳</span>
        </div>
      </div>
    </div>
  );
};

export { AboutScreen };
export default AboutScreen;
