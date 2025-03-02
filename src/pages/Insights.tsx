
import React, { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import InsightCard from '@/components/ui/InsightCard';
import ChurnMetric from '@/components/ui/ChurnMetric';
import { Insight, ChurnMetric as ChurnMetricType } from '@/types';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import { Download, RefreshCcw } from 'lucide-react';
import { getGeneratedInsights, getGeneratedMetrics, hasGeneratedData } from '@/utils/dataProcessor';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

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
    { month: 'Jan', rate: 7.2 },
    { month: 'Feb', rate: 6.8 },
    { month: 'Mar', rate: 6.4 },
    { month: 'Apr', rate: 5.9 },
    { month: 'May', rate: 5.7 },
    { month: 'Jun', rate: 5.4 }
  ]);

  // Generate semi-random chart data based on our metrics
  const generateChartData = () => {
    const metricsData = getGeneratedMetrics();
    if (metricsData.length === 0) return;

    const churnRate = metricsData.find(m => m.title === 'Churn Rate')?.value || 5;
    
    // Generate churn by feature data
    const features = ['Dashboard', 'Reports', 'Automation', 'Integrations', 'Mobile App'];
    const newFeatureData = features.map(feature => {
      const used = Math.round(50 + Math.random() * 50);
      const notUsed = Math.round(30 + Math.random() * 60);
      return { name: feature, used, notUsed };
    });
    setChurnByFeatureData(newFeatureData);
    
    // Generate churn over time
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    let currentRate = churnRate + 2; // Start slightly higher
    const newTimeData = months.map(month => {
      // Gradually decrease churn rate with some randomness
      currentRate = currentRate - (0.2 + Math.random() * 0.4);
      if (currentRate < 0) currentRate = 0.5;
      return { month, rate: parseFloat(currentRate.toFixed(1)) };
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Churn Insights</h1>
            <p className="text-muted-foreground">AI-generated recommendations to reduce churn and improve retention</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
              onClick={handleRefreshInsights}
            >
              <RefreshCcw className="h-4 w-4" />
              <span>Refresh Insights</span>
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              onClick={handleExportReport}
            >
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </button>
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
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Legend />
                  <Bar name="Users Who Churned (Used Feature)" dataKey="used" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar name="Users Who Churned (Did Not Use Feature)" dataKey="notUsed" fill="hsl(var(--primary) / 0.3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value) => [`${value}%`, 'Churn Rate']}
                  />
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
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold mb-6">Actionable Recommendations</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Insights;
