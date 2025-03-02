
import React from 'react';
import { ChurnMetric as ChurnMetricType } from '@/types';
import { ArrowUpRight, ArrowDownRight, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChurnMetricProps {
  metric: ChurnMetricType;
}

const ChurnMetric: React.FC<ChurnMetricProps> = ({ metric }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card p-6 h-full"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          {metric.title}
          <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            <HelpCircle className="h-3 w-3" />
          </button>
        </h3>
        {metric.change !== 0 && (
          <div 
            className={`flex items-center text-xs font-semibold ${
              (metric.isPositive && metric.change > 0) || (!metric.isPositive && metric.change < 0)
                ? 'text-green-600' 
                : 'text-red-600'
            }`}
          >
            {(metric.isPositive && metric.change > 0) || (!metric.isPositive && metric.change < 0) ? (
              <ArrowUpRight className="h-3 w-3 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 mr-1" />
            )}
            {Math.abs(metric.change)}%
          </div>
        )}
      </div>
      
      <div className="mb-2">
        <span className="text-3xl font-semibold">
          {typeof metric.value === 'number' ? 
            (metric.value > 1 ? metric.value.toFixed(0) : metric.value.toFixed(2)) : 
            metric.value}
          {metric.title.includes('Rate') || metric.title.includes('Percentage') ? '%' : ''}
        </span>
      </div>
      
      <p className="text-xs text-muted-foreground">{metric.description}</p>
    </motion.div>
  );
};

export default ChurnMetric;
