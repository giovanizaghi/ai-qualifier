'use client';

import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Star,
  TrendingUp,
  Download
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface UATAnalytics {
  overview: {
    totalSessions: number;
    totalUsers: number;
    totalScenarios: number;
    overallCompletionRate: number;
  };
  scenarioAnalytics: Array<{
    scenarioId: string;
    analytics: {
      totalSessions: number;
      completedSessions: number;
      sessionCompletionRate: number;
      averageSessionDuration: number;
      taskCompletionRate: number;
      averageTaskTime: number;
      totalErrors: number;
      averageRating: number;
      feedbackSentiment: {
        positive: number;
        negative: number;
        neutral: number;
        total: number;
        sentiment: string;
      };
      deviceBreakdown: Record<string, number>;
      browserBreakdown: Record<string, number>;
    };
  }>;
  recommendations: string[];
  criticalIssues: string[];
}

export default function UATAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<UATAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState<string>('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/uat/reports');
      const result = await response.json();
      
      if (result.success) {
        setAnalytics(result.data);
        if (result.data.scenarioAnalytics.length > 0) {
          setSelectedScenario(result.data.scenarioAnalytics[0].scenarioId);
        }
      } else {
        toast.error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const response = await fetch('/api/uat/reports');
      const result = await response.json();
      
      if (result.success) {
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `uat-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('Report exported successfully');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
        <p className="text-muted-foreground mb-4">No UAT sessions have been conducted yet.</p>
        <Button onClick={fetchAnalytics}>Refresh</Button>
      </div>
    );
  }

  const selectedScenarioData = analytics.scenarioAnalytics.find(s => s.scenarioId === selectedScenario);

  // Prepare chart data
  const scenarioCompletionData = analytics.scenarioAnalytics.map(scenario => ({
    name: scenario.scenarioId.replace(/-/g, ' '),
    completionRate: Math.round(scenario.analytics.sessionCompletionRate * 100),
    sessions: scenario.analytics.totalSessions,
  }));

  const deviceData = selectedScenarioData ? 
    Object.entries(selectedScenarioData.analytics.deviceBreakdown).map(([device, count]) => ({
      name: device,
      value: count,
    })) : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">UAT Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive analysis of User Acceptance Testing sessions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchAnalytics} variant="outline">
            Refresh Data
          </Button>
          <Button onClick={exportReport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              Across {analytics.overview.totalScenarios} scenarios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(analytics.overview.overallCompletionRate * 100)}%
            </div>
            <Progress value={analytics.overview.overallCompletionRate * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Participated in testing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analytics.criticalIssues.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scenario Completion Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Completion Rates by Scenario</CardTitle>
                <CardDescription>
                  Success rates across different test scenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={scenarioCompletionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completionRate" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Device Breakdown */}
            {deviceData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Device Distribution</CardTitle>
                  <CardDescription>
                    Test sessions by device type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={deviceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {deviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <select 
              value={selectedScenario} 
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              {analytics.scenarioAnalytics.map(scenario => (
                <option key={scenario.scenarioId} value={scenario.scenarioId}>
                  {scenario.scenarioId.replace(/-/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {selectedScenarioData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Session Completion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(selectedScenarioData.analytics.sessionCompletionRate * 100)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedScenarioData.analytics.completedSessions} of {selectedScenarioData.analytics.totalSessions} sessions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Average Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatDuration(selectedScenarioData.analytics.averageSessionDuration)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per completed session
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Task Completion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(selectedScenarioData.analytics.taskCompletionRate * 100)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Individual task success rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Average Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {selectedScenarioData.analytics.averageRating?.toFixed(1) || 'N/A'}
                    {selectedScenarioData.analytics.averageRating && (
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Out of 5 stars
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Error Count</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {selectedScenarioData.analytics.totalErrors}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total errors recorded
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Feedback Sentiment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">
                    {selectedScenarioData.analytics.feedbackSentiment.sentiment}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedScenarioData.analytics.feedbackSentiment.positive} positive, {' '}
                    {selectedScenarioData.analytics.feedbackSentiment.negative} negative
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Analysis</CardTitle>
              <CardDescription>
                User feedback sentiment and patterns across all scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.scenarioAnalytics.map(scenario => (
                  <div key={scenario.scenarioId} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">
                      {scenario.scenarioId.replace(/-/g, ' ')}
                    </h4>
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="secondary">
                        {scenario.analytics.feedbackSentiment.sentiment}
                      </Badge>
                      <span className="text-green-600">
                        +{scenario.analytics.feedbackSentiment.positive}
                      </span>
                      <span className="text-red-600">
                        -{scenario.analytics.feedbackSentiment.negative}
                      </span>
                      <span className="text-gray-600">
                        ={scenario.analytics.feedbackSentiment.neutral}
                      </span>
                      {scenario.analytics.averageRating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{scenario.analytics.averageRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recommendations
                </CardTitle>
                <CardDescription>
                  Suggested improvements based on analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.recommendations.length > 0 ? (
                  <ul className="space-y-3">
                    {analytics.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5">
                          {index + 1}
                        </Badge>
                        <span className="text-sm">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No specific recommendations at this time.</p>
                )}
              </CardContent>
            </Card>

            {/* Critical Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Critical Issues
                </CardTitle>
                <CardDescription>
                  Issues requiring immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.criticalIssues.length > 0 ? (
                  <ul className="space-y-3">
                    {analytics.criticalIssues.map((issue, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{issue}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">No critical issues detected</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}