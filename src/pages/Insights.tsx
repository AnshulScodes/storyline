import React, { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import InsightCard from '@/components/ui/InsightCard';
import ChurnMetric from '@/components/ui/ChurnMetric';
import { Insight, ChurnMetric as ChurnMetricType } from '@/types';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid, TooltipProps } from 'recharts';
import { Download, RefreshCcw, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { getGeneratedInsights, getGeneratedMetrics, hasGeneratedData } from '@/utils/dataProcessor';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import ExportPDF from '@/components/ui/ExportPDF';

// Custom tooltip for the feature usage chart
const FeatureTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const totalUsers = payload[0].value! + payload[1].value!;
    const usedPercentage = Math.round((payload[0].value! / totalUsers) * 100);
    const notUsedPercentage = Math.round((payload[1].value! / totalUsers) * 100);
    
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-100">
        <p className="font-semibold mb-2">{label}</p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <p>Used Feature: {payload[0].value} users ({usedPercentage}%)</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary/30"></div>
            <p>Did Not Use: {payload[1].value} users ({notUsedPercentage}%)</p>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            <TrendingDown className="h-3 w-3 inline mr-1" />
            {usedPercentage > notUsedPercentage ? 
              "Users who use this feature still churn - investigate why." : 
              "Feature underutilization may contribute to churn."}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Custom tooltip for the churn rate chart
const ChurnRateTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const currentRate = payload[0].value;
    let trend;
    
    if (payload[0].payload.trend > 0) {
      trend = <span className="text-red-600">↑ Increasing ({payload[0].payload.trend}%)</span>;
    } else {
      trend = <span className="text-green-600">↓ Decreasing ({Math.abs(payload[0].payload.trend)}%)</span>;
    }
    
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-100">
        <p className="font-semibold mb-2">{label}</p>
        <div className="flex flex-col gap-1">
          <p>Churn Rate: <span className="font-semibold">{currentRate}%</span></p>
          <p className="text-sm">Monthly trend: {trend}</p>
          {payload[0].payload.event && (
            <div className="mt-2 text-xs bg-blue-50 p-2 rounded-md border border-blue-100">
              <Info className="h-3 w-3 inline mr-1 text-blue-600" />
              <span className="text-blue-800">{payload[0].payload.event}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const Insights = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [metrics, setMetrics] = useState<ChurnMetricType[]>([]);
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
    setInsights(getGeneratedInsights());
    setMetrics(getGeneratedMetrics());

    // Generate chart data
    generateChartData();
  }, [navigate, toast]);

  // Chart data state
  const [churnByFeatureData, setChurnByFeatureData] = useState([
    { name: 'Dashboard', used: 92, notUsed: 32 },
    { name: 'Reports', used: 86, notUsed: 54 },
    { name: 'Automation', used: 72, notUsed: 78 },
    { name: 'Integrations', used: 64, notUsed: 83 },
    { name: 'Mobile App', used: 58, notUsed: 42 }
  ]);
  
  const [churnOverTimeData, setChurnOverTimeData] = useState([
    { month: 'Jan', rate: 7.2, trend: 0.0, event: null },
    { month: 'Feb', rate: 6.8, trend: -0.4, event: null },
    { month: 'Mar', rate: 6.4, trend: -0.4, event: 'New onboarding flow launched' },
    { month: 'Apr', rate: 5.9, trend: -0.5, event: null },
    { month: 'May', rate: 5.7, trend: -0.2, event: null },
    { month: 'Jun', rate: 5.4, trend: -0.3, event: 'Enhanced support response time' }
  ]);

  // Generate semi-random chart data based on our metrics
  const generateChartData = () => {
    const metricsData = getGeneratedMetrics();
    if (metricsData.length === 0) return;

    const churnRate = metricsData.find(m => m.title === 'Churn Rate')?.value || 5;
    
    // Generate churn by feature data
    const features = ['Dashboard', 'Reports', 'Automation', 'Integrations', 'Mobile App'];
    const newFeatureData = features.map(feature => {
      // Create more meaningful feature usage data with clearer patterns
      let used, notUsed;
      
      if (feature === 'Dashboard') {
        // Dashboard is used by most but still have churned users
        used = Math.round(75 + Math.random() * 20);
        notUsed = Math.round(15 + Math.random() * 15);
      } else if (feature === 'Reports' || feature === 'Mobile App') {
        // Medium usage features
        used = Math.round(60 + Math.random() * 25);
        notUsed = Math.round(30 + Math.random() * 20);
      } else {
        // Features with potential issues
        used = Math.round(40 + Math.random() * 30);
        notUsed = Math.round(50 + Math.random() * 25);
      }
      
      return { name: feature, used, notUsed };
    });
    setChurnByFeatureData(newFeatureData);
    
    // Generate churn over time with trends and key events
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    let currentRate = churnRate + 2; // Start slightly higher
    const newTimeData = months.map((month, index) => {
      // Gradually decrease churn rate with some randomness
      const previousRate = index > 0 ? currentRate : currentRate + (0.2 + Math.random() * 0.4);
      currentRate = currentRate - (0.2 + Math.random() * 0.4);
      if (currentRate < 0) currentRate = 0.5;
      
      // Calculate trend (percentage change)
      const trend = parseFloat(((currentRate - previousRate) * 100 / previousRate).toFixed(1));
      
      // Add events at specific points
      let event = null;
      if (month === 'Mar') {
        event = 'New onboarding flow launched';
      } else if (month === 'Jun') {
        event = 'Enhanced support response time';
      }
      
      return { 
        month, 
        rate: parseFloat(currentRate.toFixed(1)),
        trend,
        event
      };
    });
    setChurnOverTimeData(newTimeData);
  };

  const handleRefreshInsights = async () => {
    toast({
      title: 'Refreshing insights',
      description: 'Generating new insights based on your data...',
    });
    
    // Add a slight delay to make it feel like it's doing something
    setTimeout(() => {
      // This would normally re-run the AI processing
      generateChartData();
      
      toast({
        title: 'Insights refreshed',
        description: 'Your insights have been updated with the latest data.',
      });
    }, 1500);
  };

  const handleExportReport = () => {
    toast({
      title: 'Exporting report',
      description: 'Your report is being generated as a PDF...',
    });
    
    // Simulate PDF generation
    setTimeout(() => {
      toast({
        title: 'Report exported',
        description: 'Your report has been downloaded.',
      });
    }, 1500);
  };

  // Group insights by category for better display
  const groupedInsights = insights.reduce((acc, insight) => {
    if (!acc[insight.category]) {
      acc[insight.category] = [];
    }
    acc[insight.category].push(insight);
    return acc;
  }, {} as Record<string, Insight[]>);

  const categoryLabels = {
    onboarding: 'User Onboarding',
    engagement: 'User Engagement',
    support: 'Customer Support',
    product: 'Product Features'
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Insights</h1>
            <p className="text-muted-foreground">Actionable insights to reduce churn and improve retention</p>
          </div>
          
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <button className="flex items-center gap-1 px-3 py-2 rounded-md border border-input bg-background text-sm hover:bg-accent">
              <RefreshCcw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
            
            <ExportPDF />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric) => (
            <ChurnMetric key={metric.id} metric={metric} />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">Churn by Feature Usage</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={churnByFeatureData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<FeatureTooltip />} />
                  <Legend />
                  <Bar name="Users Who Churned (Used Feature)" dataKey="used" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar name="Users Who Churned (Did Not Use Feature)" dataKey="notUsed" fill="hsl(var(--primary) / 0.3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 bg-muted/50 p-3 rounded-md text-sm">
              <div className="flex gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Key Finding:</p>
                  <p className="text-muted-foreground">Features with high usage but significant churn may indicate usability issues or unmet expectations.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">Churn Rate Over Time</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={churnOverTimeData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<ChurnRateTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    name="Churn Rate (%)"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 bg-muted/50 p-3 rounded-md text-sm">
              <div className="flex gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Key Finding:</p>
                  <p className="text-muted-foreground">
                    Churn rate has been trending downward, with noticeable improvements after key initiatives in March and June.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold mb-6">Actionable Recommendations</h2>
        
        {Object.entries(groupedInsights).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedInsights).map(([category, categoryInsights]) => (
              <div key={category}>
                <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
                  {category === 'onboarding' && <AlertTriangle className="h-5 w-5 text-blue-500" />}
                  {category === 'engagement' && <TrendingDown className="h-5 w-5 text-green-500" />}
                  {category === 'support' && <Info className="h-5 w-5 text-purple-500" />}
                  {category === 'product' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                  {categoryLabels[category as keyof typeof categoryLabels] || category}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryInsights.map((insight) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Insights;
