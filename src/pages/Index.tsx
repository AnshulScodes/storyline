
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from '@/components/ui/FileUpload';
import { motion } from 'framer-motion';
import { FileUp, BarChart3, Users, Lightbulb } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const [showFeatures, setShowFeatures] = useState(false);

  const handleUploadComplete = () => {
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  const features = [
    {
      icon: FileUp,
      title: 'Simple Data Upload',
      description: 'Upload your user data in CSV or Excel format and let our AI do the rest.'
    },
    {
      icon: Users,
      title: 'AI-Generated Personas',
      description: 'Automatically identify key user segments and create detailed personas.'
    },
    {
      icon: BarChart3,
      title: 'Churn Prediction',
      description: 'Identify at-risk users before they leave with our predictive analytics.'
    },
    {
      icon: Lightbulb,
      title: 'Strategic Insights',
      description: 'Get actionable recommendations to reduce churn and improve retention.'
    }
  ];

  return (
    <div className="min-h-screen pt-16 pb-12 flex flex-col">
      <div className="flex-grow flex flex-col items-center justify-center px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 max-w-3xl"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            Generate User Stories. Reduce Churn.
          </h1>
          <p className="text-xl text-muted-foreground">
            Transform your user data into actionable insights and personalized user stories to help you understand and retain your customers.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full max-w-3xl mb-16"
        >
          <FileUpload onUploadComplete={handleUploadComplete} />
        </motion.div>
        
        <button
          className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1"
          onClick={() => setShowFeatures(!showFeatures)}
        >
          {showFeatures ? 'Hide Features' : 'Show Features'}
          <motion.span
            animate={{ rotate: showFeatures ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            ↓
          </motion.span>
        </button>
        
        {showFeatures && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-4xl mx-auto"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.3 }}
                className="glass-card p-6 flex flex-col items-center text-center"
              >
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      
      <footer className="text-center text-sm text-muted-foreground py-6">
        <p>© {new Date().getFullYear()} StoryChurn. Your data is processed privately and deleted for security.</p>
      </footer>
    </div>
  );
};

export default Index;
