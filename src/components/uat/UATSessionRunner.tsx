'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { UAT_SCENARIOS } from '@/constants/uat-scenarios';

interface UATSession {
  sessionId: string;
  scenarioId: string;
  userPersona: string;
  device: string;
  browser: string;
  startTime: string;
  status: 'in_progress' | 'completed' | 'abandoned';
}

interface Task {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  expectedOutcome: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  startTime?: string;
  endTime?: string;
  completionTime?: number;
  errorCount: number;
  helpRequests: number;
  notes?: string;
}

interface UATSessionRunnerProps {
  onSessionComplete?: (sessionId: string, analytics: any) => void;
}

export default function UATSessionRunner({ onSessionComplete }: UATSessionRunnerProps) {
  const [currentSession, setCurrentSession] = useState<UATSession | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [currentTasks, setCurrentTasks] = useState<Task[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Detect browser and device automatically
  useEffect(() => {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    let device = 'desktop';

    // Detect browser
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // Detect device type
    if (/Mobi|Android/i.test(userAgent)) device = 'mobile';
    else if (/Tablet|iPad/i.test(userAgent)) device = 'tablet';

    setSelectedDevice(device);
  }, []);

  const startSession = async () => {
    if (!selectedScenario || !selectedPersona || !selectedDevice) {
      toast.error('Please select scenario, persona, and device');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/uat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: selectedScenario,
          userPersona: selectedPersona,
          device: selectedDevice,
          browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                  navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                  navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown',
          metadata: {
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        const session: UATSession = {
          sessionId: result.data.sessionId,
          scenarioId: selectedScenario,
          userPersona: selectedPersona,
          device: selectedDevice,
          browser: 'Chrome', // Simplified for demo
          startTime: new Date().toISOString(),
          status: 'in_progress',
        };

        setCurrentSession(session);
        loadScenarioTasks(selectedScenario);
        toast.success('UAT session started successfully');
      } else {
        toast.error('Failed to start UAT session');
      }
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start UAT session');
    } finally {
      setIsLoading(false);
    }
  };

  const loadScenarioTasks = (scenarioId: string) => {
    const scenario = UAT_SCENARIOS.find(s => s.id === scenarioId);
    if (scenario) {
      const tasks: Task[] = scenario.tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        instructions: task.instructions,
        expectedOutcome: task.expectedOutcome,
        status: 'not_started',
        errorCount: 0,
        helpRequests: 0,
      }));
      setCurrentTasks(tasks);
      setCurrentTaskIndex(0);
    }
  };

  const startTask = async (taskIndex: number) => {
    if (!currentSession) return;

    const task = currentTasks[taskIndex];
    const updatedTasks = [...currentTasks];
    updatedTasks[taskIndex] = {
      ...task,
      status: 'in_progress',
      startTime: new Date().toISOString(),
    };
    setCurrentTasks(updatedTasks);

    // Record task start in backend
    try {
      await fetch('/api/uat/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.sessionId,
          taskId: task.id,
          scenarioId: currentSession.scenarioId,
          status: 'in_progress',
        }),
      });
    } catch (error) {
      console.error('Error recording task start:', error);
    }
  };

  const completeTask = async (taskIndex: number, status: 'completed' | 'failed' | 'skipped', notes?: string) => {
    if (!currentSession) return;

    const task = currentTasks[taskIndex];
    const endTime = new Date().toISOString();
    const completionTime = task.startTime ? 
      (new Date(endTime).getTime() - new Date(task.startTime).getTime()) / 1000 : 0;

    const updatedTasks = [...currentTasks];
    updatedTasks[taskIndex] = {
      ...task,
      status,
      endTime,
      completionTime,
      notes,
    };
    setCurrentTasks(updatedTasks);

    // Record task completion in backend
    try {
      await fetch('/api/uat/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.sessionId,
          taskId: task.id,
          scenarioId: currentSession.scenarioId,
          status,
          completionTime,
          errorCount: task.errorCount,
          helpRequests: task.helpRequests,
          notes,
        }),
      });

      toast.success(`Task ${status} successfully`);
    } catch (error) {
      console.error('Error recording task completion:', error);
      toast.error('Failed to record task completion');
    }
  };

  const recordError = async (taskIndex: number) => {
    const updatedTasks = [...currentTasks];
    updatedTasks[taskIndex].errorCount += 1;
    setCurrentTasks(updatedTasks);
  };

  const requestHelp = async (taskIndex: number) => {
    const updatedTasks = [...currentTasks];
    updatedTasks[taskIndex].helpRequests += 1;
    setCurrentTasks(updatedTasks);
  };

  const endSession = async (status: 'completed' | 'abandoned') => {
    if (!currentSession) return;

    setIsLoading(true);
    try {
      await fetch(`/api/uat/sessions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.sessionId,
          status,
        }),
      });

      // Get session analytics
      const analyticsResponse = await fetch(`/api/uat/sessions/${currentSession.sessionId}/analytics`);
      const analyticsResult = await analyticsResponse.json();

      if (onSessionComplete && analyticsResult.success) {
        onSessionComplete(currentSession.sessionId, analyticsResult.data);
      }

      setCurrentSession(null);
      setCurrentTasks([]);
      setCurrentTaskIndex(0);
      
      toast.success(`Session ${status} successfully`);
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'skipped': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const completedTasks = currentTasks.filter(task => 
    ['completed', 'failed', 'skipped'].includes(task.status)
  ).length;

  if (!currentSession) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Start UAT Session</CardTitle>
          <CardDescription>
            Configure and start a new User Acceptance Testing session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Test Scenario</label>
            <Select value={selectedScenario} onValueChange={setSelectedScenario}>
              <SelectTrigger>
                <SelectValue placeholder="Select a test scenario" />
              </SelectTrigger>
              <SelectContent>
                {UAT_SCENARIOS.map(scenario => (
                  <SelectItem key={scenario.id} value={scenario.id}>
                    {scenario.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">User Persona</label>
            <Select value={selectedPersona} onValueChange={setSelectedPersona}>
              <SelectTrigger>
                <SelectValue placeholder="Select user persona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new_user">New User (Beginner)</SelectItem>
                <SelectItem value="intermediate_user">Intermediate User</SelectItem>
                <SelectItem value="expert_user">Expert User</SelectItem>
                <SelectItem value="administrator">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Device Type</label>
            <Select value={selectedDevice} onValueChange={setSelectedDevice}>
              <SelectTrigger>
                <SelectValue placeholder="Select device type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={startSession} 
            disabled={!selectedScenario || !selectedPersona || !selectedDevice || isLoading}
            className="w-full"
          >
            {isLoading ? 'Starting...' : 'Start UAT Session'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentTask = currentTasks[currentTaskIndex];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>UAT Session in Progress</CardTitle>
              <CardDescription>
                Scenario: {UAT_SCENARIOS.find(s => s.id === currentSession.scenarioId)?.title} | 
                Persona: {currentSession.userPersona.replace('_', ' ')} | 
                Device: {currentSession.device}
              </CardDescription>
            </div>
            <Badge variant="secondary">
              Session ID: {currentSession.sessionId.slice(0, 8)}...
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{completedTasks} / {currentTasks.length} tasks</span>
            </div>
            <Progress value={(completedTasks / currentTasks.length) * 100} />
          </div>
        </CardContent>
      </Card>

      {/* Current Task */}
      {currentTask && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Task {currentTaskIndex + 1}: {currentTask.title}
                <Badge className={getStatusColor(currentTask.status)}>
                  {currentTask.status.replace('_', ' ')}
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {currentTask.description}
            </p>

            <div>
              <h4 className="font-medium mb-2">Instructions:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {currentTask.instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-1">Expected Outcome:</h4>
              <p className="text-sm text-blue-800">{currentTask.expectedOutcome}</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Errors: {currentTask.errorCount}</span>
              <span>•</span>
              <span>Help Requests: {currentTask.helpRequests}</span>
            </div>

            <div className="flex gap-2 flex-wrap">
              {currentTask.status === 'not_started' && (
                <Button onClick={() => startTask(currentTaskIndex)}>
                  Start Task
                </Button>
              )}
              
              {currentTask.status === 'in_progress' && (
                <>
                  <Button 
                    onClick={() => completeTask(currentTaskIndex, 'completed')}
                    variant="default"
                  >
                    Mark Complete
                  </Button>
                  <Button 
                    onClick={() => completeTask(currentTaskIndex, 'failed')}
                    variant="destructive"
                  >
                    Mark Failed
                  </Button>
                  <Button 
                    onClick={() => completeTask(currentTaskIndex, 'skipped')}
                    variant="outline"
                  >
                    Skip Task
                  </Button>
                  <Button 
                    onClick={() => recordError(currentTaskIndex)}
                    variant="outline"
                    size="sm"
                  >
                    Record Error
                  </Button>
                  <Button 
                    onClick={() => requestHelp(currentTaskIndex)}
                    variant="outline"
                    size="sm"
                  >
                    Request Help
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {currentTasks.map((task, index) => (
              <Button
                key={task.id}
                variant={index === currentTaskIndex ? "default" : "outline"}
                onClick={() => setCurrentTaskIndex(index)}
                className="justify-start h-auto p-3"
              >
                <div className="flex items-center gap-2 w-full">
                  <Badge className={getStatusColor(task.status)} />
                  <span className="text-left">
                    {index + 1}. {task.title}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Session Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={() => endSession('completed')}
              disabled={isLoading}
              variant="default"
            >
              Complete Session
            </Button>
            <Button 
              onClick={() => endSession('abandoned')}
              disabled={isLoading}
              variant="outline"
            >
              Abandon Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}