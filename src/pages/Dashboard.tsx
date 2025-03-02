
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import ChurnMetric from '@/components/ui/ChurnMetric';
import PersonaCard from '@/components/ui/PersonaCard';
import StoryDetail from '@/components/ui/StoryDetail';
import { Persona, UserStory, ChurnMetric as ChurnMetricType } from '@/types';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Dashboard = () => {
  const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);
  
  // Mock data for demonstration purposes
  const metrics: ChurnMetricType[] = [
    {
      id: '1',
      title: 'Churn Rate',
      value: 5.4,
      change: -2.1,
      isPositive: false,
      description: 'Monthly user churn has decreased compared to last month'
    },
    {
      id: '2',
      title: 'At-Risk Users',
      value: 42,
      change: 12,
      isPositive: false,
      description: 'Users flagged with >70% probability of churning'
    },
    {
      id: '3',
      title: 'Avg. Engagement',
      value: 14.3,
      change: 3.2,
      isPositive: true,
      description: 'Average sessions per active user this month'
    },
    {
      id: '4',
      title: 'Retention Rate',
      value: 87.5,
      change: 1.8,
      isPositive: true,
      description: '3-month retention rate across all user segments'
    }
  ];
  
  const personas: Persona[] = [
    {
      id: '1',
      name: 'Power Partner Patty',
      segment: 'power',
      description: 'Daily user who relies on your product for critical work tasks. Engaged with most features and has a high feature adoption rate.',
      painPoints: ['Complex workflows', 'Performance issues'],
      goals: ['Save time', 'Improve workflow efficiency'],
      churnRisk: 0.15
    },
    {
      id: '2',
      name: 'At-Risk Andy',
      segment: 'atrisk',
      description: 'Previously active user whose engagement has declined over the past month. Hasn\'t logged in for 14 days.',
      painPoints: ['Confusing interface', 'Missing features', 'Technical issues'],
      goals: ['Simplify daily tasks', 'Better support'],
      churnRisk: 0.85
    },
    {
      id: '3',
      name: 'Occasional Olivia',
      segment: 'occasional',
      description: 'Logs in infrequently, typically once every few weeks. Only uses a small subset of features.',
      painPoints: ['Forgetting how to use features', 'Value perception'],
      goals: ['Quick, occasional tasks', 'Easy reengagement'],
      churnRisk: 0.45
    }
  ];
  
  const stories: UserStory[] = [
    {
      id: '1',
      personaId: '2',
      title: 'Simplified Onboarding Flow',
      description: 'As At-Risk Andy, I want a more intuitive onboarding experience so that I can quickly understand the value of the product and how to use its key features.',
      priority: 'high',
      acceptanceCriteria: [
        'Reduce onboarding steps from 7 to maximum 4',
        'Include interactive tutorials for core features',
        'Add progress indicators for completed onboarding tasks',
        'Implement a "skip for now" option that doesn\'t abandon the user'
      ]
    },
    {
      id: '2',
      personaId: '3',
      title: 'Re-engagement Notifications',
      description: 'As Occasional Olivia, I want timely, relevant notifications so that I remember to return to the platform when I would find it most valuable.',
      priority: 'medium',
      acceptanceCriteria: [
        'Send personalized notifications based on user behavior patterns',
        'Limit notifications to maximum 2 per week',
        'Include quick-action buttons in notification emails',
        'Allow granular control over notification frequency and types'
      ]
    }
  ];
  
  const handlePersonaClick = (persona: Persona) => {
    const story = stories.find(s => s.personaId === persona.id);
    if (story) {
      setSelectedStory(story);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your user churn metrics and key personas</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric) => (
            <ChurnMetric key={metric.id} metric={metric} />
          ))}
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Key User Personas</h2>
          <Link to="/user-stories" className="text-primary flex items-center gap-1 text-sm font-medium hover:underline">
            See all personas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {personas.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              onClick={handlePersonaClick}
            />
          ))}
        </div>
        
        {selectedStory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedStory(null)}
          >
            <div 
              className="w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <StoryDetail 
                story={selectedStory} 
                onClose={() => setSelectedStory(null)} 
              />
            </div>
          </motion.div>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Insights</h2>
          <Link to="/insights" className="text-primary flex items-center gap-1 text-sm font-medium hover:underline">
            See all insights
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="glass-card p-6 mb-4">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-orange-50 p-2 mt-1">
              <ArrowRight className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">28% of churned users left after the onboarding flow</h3>
              <p className="text-muted-foreground mb-4">Users who abandon your product during onboarding represent a significant portion of your overall churn. Focus on simplifying the initial experience.</p>
              <div className="flex items-center gap-4">
                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                  View Onboarding Flow
                </button>
                <button className="text-primary font-medium hover:underline">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
