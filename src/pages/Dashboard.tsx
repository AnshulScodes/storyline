
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import ChurnMetric from '@/components/ui/ChurnMetric';
import PersonaCard from '@/components/ui/PersonaCard';
import StoryDetail from '@/components/ui/StoryDetail';
import { Persona, UserStory, ChurnMetric as ChurnMetricType } from '@/types';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { 
  getGeneratedPersonas,
  getGeneratedStories,
  getGeneratedMetrics,
  hasGeneratedData
} from '@/utils/dataProcessor';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);
  const [metrics, setMetrics] = useState<ChurnMetricType[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [stories, setStories] = useState<UserStory[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have data
    if (!hasGeneratedData()) {
      toast({
        title: 'No data found',
        description: 'Please upload a CSV or Excel file to generate insights.',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    // Load data from our processor
    setMetrics(getGeneratedMetrics());
    setPersonas(getGeneratedPersonas());
    setStories(getGeneratedStories());
  }, [navigate, toast]);
  
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
              <h3 className="text-lg font-semibold mb-1">
                {metrics.length > 0 && Math.round(metrics[0].value * 10)}% of churned users left after the onboarding flow
              </h3>
              <p className="text-muted-foreground mb-4">
                Users who abandon your product during onboarding represent a significant portion of your overall churn. 
                Focus on simplifying the initial experience.
              </p>
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
