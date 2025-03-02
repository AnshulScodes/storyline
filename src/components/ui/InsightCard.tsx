
import React from 'react';
import { Insight } from '@/types';
import { ArrowRight, Lightbulb, AlertTriangle, BarChart3, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';

interface InsightCardProps {
  insight: Insight;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'onboarding':
      return <BarChart3 className="h-4 w-4" />;
    case 'engagement':
      return <Lightbulb className="h-4 w-4" />;
    case 'support':
      return <Headphones className="h-4 w-4" />;
    case 'product':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return null;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'onboarding':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'engagement':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'support':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'product':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'high':
      return 'bg-red-50 text-red-700';
    case 'medium':
      return 'bg-orange-50 text-orange-700';
    case 'low':
      return 'bg-green-50 text-green-700';
    default:
      return 'bg-gray-50 text-gray-700';
  }
};

const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const categoryClass = getCategoryColor(insight.category);
  const categoryIcon = getCategoryIcon(insight.category);
  const impactClass = getImpactColor(insight.impact);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card h-full flex flex-col"
    >
      <div className="p-6 flex-grow">
        <div className="flex items-start justify-between mb-4">
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${categoryClass}`}>
            {categoryIcon}
            {insight.category.charAt(0).toUpperCase() + insight.category.slice(1)}
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${impactClass}`}>
            {insight.impact.charAt(0).toUpperCase() + insight.impact.slice(1)} Impact
          </div>
        </div>
        
        <h3 className="text-lg font-semibold mb-2">{insight.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{insight.description}</p>
      </div>
      
      <div className="border-t border-border p-6">
        <h4 className="text-sm font-medium mb-2">Recommendation</h4>
        <p className="text-sm text-muted-foreground mb-4">{insight.recommendation}</p>
        <div className="flex justify-end">
          <button className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
            Implement
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default InsightCard;
