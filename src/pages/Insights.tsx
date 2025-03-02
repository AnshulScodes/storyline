
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import InsightCard from '@/components/ui/InsightCard';
import ChurnMetric from '@/components/ui/ChurnMetric';
import { Insight, ChurnMetric as ChurnMetricType } from '@/types';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import { Download, RefreshCcw } from 'lucide-react';

const Insights = () => {
  // Mock data for demonstration purposes
  const insights: Insight[] = [
    {
      id: '1',
      title: 'Simplify Onboarding Process',
      description: 'Users who complete less than 60% of the onboarding steps are 3x more likely to churn within the first month.',
      impact: 'high',
      recommendation: 'Reduce onboarding steps from 7 to 4, focusing only on essential features. Add clear progress indicators.',
      category: 'onboarding'
    },
    {
      id: '2',
      title: 'Implement Re-engagement Campaigns',
      description: 'Users who haven\'t logged in for more than 14 days show a 68% higher probability of churning.',
      impact: 'high',
      recommendation: 'Create targeted email campaigns for users who haven\'t logged in for 10+ days with personalized content based on their past usage.',
      category: 'engagement'
    },
    {
      id: '3',
      title: 'Improve Mobile Experience',
      description: '42% of churned users primarily accessed your product via mobile, where feature adoption is 30% lower than desktop.',
      impact: 'medium',
      recommendation: 'Optimize the mobile interface for the most commonly used features and improve navigation on smaller screens.',
      category: 'product'
    },
    {
      id: '4',
      title: 'Address Payment Friction',
      description: '23% of users who attempted to upgrade to a paid plan abandoned the process before completion.',
      impact: 'medium',
      recommendation: 'Simplify the payment process by reducing form fields and adding more payment options like Apple Pay and Google Pay.',
      category: 'engagement'
    },
    {
      id: '5',
      title: 'Enhance Support Response Time',
      description: 'Users who wait more than 8 hours for support responses have a 34% higher churn rate than those who receive quick assistance.',
      impact: 'medium',
      recommendation: 'Implement a chatbot for immediate responses to common questions and set up automated follow-ups for unresolved tickets.',
      category: 'support'
    },
    {
      id: '6',
      title: 'Create Feature Adoption Program',
      description: 'Users who utilize less than 3 core features have a 52% higher churn rate compared to those who use 5+ features.',
      impact: 'high',
      recommendation: 'Develop an in-app guided tour program that introduces new features based on the user\'s current usage patterns.',
      category: 'engagement'
    }
  ];
  
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
  
  const churnByFeatureData = [
    { name: 'Dashboard', used: 92, notUsed: 32 },
    { name: 'Reports', used: 86, notUsed: 54 },
    { name: 'Automation', used: 72, notUsed: 78 },
    { name: 'Integrations', used: 64, notUsed: 83 },
    { name: 'Mobile App', used: 58, notUsed: 42 }
  ];
  
  const churnOverTimeData = [
    { month: 'Jan', rate: 7.2 },
    { month: 'Feb', rate: 6.8 },
    { month: 'Mar', rate: 6.4 },
    { month: 'Apr', rate: 5.9 },
    { month: 'May', rate: 5.7 },
    { month: 'Jun', rate: 5.4 }
  ];

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
            <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors">
              <RefreshCcw className="h-4 w-4" />
              <span>Refresh Insights</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
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
