import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Loader2,
  Send,
  Brain,
  Target,
  DollarSign
} from 'lucide-react';
import { ProjectData } from '@/lib/types/projectTypes';
import { calculateProjectSummary } from '@/lib/calculations/projectSummary';
import { generateInsights, Insight as EngineInsight } from '@/lib/calculations/insightsEngine';
import { generateForecast, ForecastResult } from '@/lib/calculations/forecastEngine';
import { generateWeeklyForecast } from '@/lib/calculations/weeklyForecastEngine';
import { Autocomplete } from '@react-google-maps/api';
import { getTownFromPlace } from '@/lib/addressUtils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface BusinessPlanningProps {
  projectData: ProjectData;
  onUpdateProject: (data: ProjectData) => void;
  isLoaded?: boolean;
}

export function BusinessPlanning({ projectData, onUpdateProject, isLoaded = false }: BusinessPlanningProps) {
  const [activeSubTab, setActiveSubTab] = useState('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI business planning assistant. I can help you analyze your business model, generate scenarios, and provide insights. Try describing your business idea in plain English, or ask me questions about your numbers!",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [insights, setInsights] = useState<EngineInsight[]>([]);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');

  const townAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [localTownValue, setLocalTownValue] = useState(projectData.storeTown || '');

  useEffect(() => {
    setLocalTownValue(projectData.storeTown || '');
  }, [projectData.storeTown]);

  const summary = calculateProjectSummary(projectData);

  const handleTownSelect = async () => {
    if (townAutocompleteRef.current) {
      const place = townAutocompleteRef.current.getPlace();
      if (place.formatted_address) {
        const town = await getTownFromPlace(place);
        if (town) {
          setLocalTownValue(town);
          onUpdateProject({ ...projectData, storeTown: town });
        }
      }
    }
  };

  const analyzeScenario = () => {
    const newInsights = generateInsights(projectData, summary);
    setInsights(newInsights);
  };

  const generatePredictions = () => {
    const newForecast = generateForecast(projectData, summary);
    setForecast(newForecast);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    setTimeout(() => {
      const response = generateAIResponse(inputMessage, projectData);
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsProcessing(false);
    }, 1000);
  };

  const generateAIResponse = (input: string, data: any): string => {
    const lowerInput = input.toLowerCase();
    const simpleData = data.simpleBreakEven;

    if (lowerInput.includes('coffee shop') || lowerInput.includes('cafe') || lowerInput.includes('restaurant')) {
      return `Great! I can help you plan your food service business. Based on industry standards:

• Typical food cost: 28-35% of sales
• Labor cost: 25-35% of sales
• Rent should be under 10% of sales
• Target break-even within 6-12 months

Your current numbers show ${simpleData.variableCogs}% COGS and ${simpleData.variableLabour}% labor. Would you like me to suggest optimizations?`;
    }

    if (lowerInput.includes('reduce') && lowerInput.includes('cost')) {
      return `Here are actionable ways to reduce costs:

1. **Negotiate with suppliers** - Aim for 5-10% reduction in COGS
2. **Optimize labor scheduling** - Use your Hours of Operation data to match staff to demand
3. **Review rent options** - Consider location alternatives or renegotiation
4. **Reduce waste** - Track inventory closely to minimize spoilage
5. **Energy efficiency** - LED lighting and efficient equipment can save 15-20% on utilities

Which area would you like to explore first?`;
    }

    if (lowerInput.includes('increase') && (lowerInput.includes('sales') || lowerInput.includes('revenue'))) {
      return `Smart! Here are proven strategies to increase sales:

1. **Marketing investment** - Allocate 3-5% of revenue to marketing
2. **Upselling & cross-selling** - Train staff to increase average ticket by 10-15%
3. **Extended hours** - Review your Hours of Operation for underutilized time slots
4. **Loyalty programs** - Retain customers (5% retention increase = 25% profit increase)
5. **Seasonal promotions** - Leverage peak demand periods

Based on your current ${simpleData.enteredSales.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} in sales, a 15% increase would add ${(simpleData.enteredSales * 0.15).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} in revenue.`;
    }

    if (lowerInput.includes('break') || lowerInput.includes('profitable')) {
      const totalVariableCost = simpleData.variableCogs + simpleData.variableLabour + simpleData.variableOther;
      const contributionMargin = 100 - totalVariableCost;
      const breakEvenSales = simpleData.rent / (contributionMargin / 100);

      return `Your break-even analysis:

• **Break-even sales**: ${breakEvenSales.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
• **Current sales**: ${simpleData.enteredSales.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
• **Safety margin**: ${(((simpleData.enteredSales - breakEvenSales) / simpleData.enteredSales) * 100).toFixed(1)}%
• **Contribution margin**: ${contributionMargin.toFixed(1)}%

${simpleData.enteredSales > breakEvenSales
  ? `Good news! You're ${((simpleData.enteredSales / breakEvenSales - 1) * 100).toFixed(1)}% above break-even. Focus on maintaining this while optimizing costs.`
  : `You need ${((breakEvenSales - simpleData.enteredSales) / simpleData.enteredSales * 100).toFixed(1)}% more sales to break even. Let's work on increasing revenue or reducing fixed costs.`}`;
    }

    if (lowerInput.includes('scenario') || lowerInput.includes('what if')) {
      return `I can help you create multiple scenarios! Here are some useful ones to consider:

**Optimistic Scenario**: 20% higher sales, 5% lower costs
**Realistic Scenario**: Current numbers with minor adjustments
**Pessimistic Scenario**: 15% lower sales, seasonal variations

Would you like me to generate these scenarios for you? I can also create custom scenarios based on specific changes you want to test.`;
    }

    if (lowerInput.includes('risk')) {
      return `Let me identify key risks in your business model:

1. **Market Risk**: Economic downturns could reduce customer spending
2. **Cost Risk**: Supplier price increases or labor shortages
3. **Competition**: New competitors entering your market
4. **Operational Risk**: Equipment failures, staffing issues

**Mitigation strategies**:
• Build a cash reserve of 3-6 months operating expenses
• Diversify suppliers and revenue streams
• Maintain strong customer relationships
• Regular equipment maintenance and staff training

Would you like me to analyze specific risks based on your numbers?`;
    }

    return `I understand you're asking about "${input}". Here's what I can help you with:

• **Business Analysis**: I can review your current numbers and provide insights
• **Scenario Planning**: Generate optimistic, realistic, and pessimistic scenarios
• **Cost Optimization**: Identify areas to reduce expenses
• **Revenue Growth**: Strategies to increase sales
• **Risk Assessment**: Identify and mitigate potential risks

Try asking me things like:
- "How can I increase my profit margin?"
- "What if my sales drop by 20%?"
- "Help me reduce my costs"
- "Generate some scenarios for me"

What would you like to explore?`;
  };

  const generateOptimisticScenario = () => {
    const baseData = projectData.simpleBreakEven;
    const optimisticData = {
      ...baseData,
      enteredSales: Math.round(baseData.enteredSales * 1.25),
      variableCogs: Math.max(20, baseData.variableCogs - 3),
      variableLabour: Math.max(20, baseData.variableLabour - 2),
      rent: baseData.rent * 0.95,
    };
    return optimisticData;
  };

  const generatePessimisticScenario = () => {
    const baseData = projectData.simpleBreakEven;
    const pessimisticData = {
      ...baseData,
      enteredSales: Math.round(baseData.enteredSales * 0.8),
      variableCogs: Math.min(40, baseData.variableCogs + 3),
      variableLabour: Math.min(35, baseData.variableLabour + 2),
      rent: baseData.rent * 1.05,
    };
    return pessimisticData;
  };

  const getInsightIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-warning-foreground" />;
      case 'info': return <Lightbulb className="h-5 w-5 text-info" />;
      default: return <Sparkles className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'warning': return 'bg-warning/10 text-warning-foreground border-warning/30';
      case 'info': return 'bg-info/10 text-info border-info/30';
      default: return 'bg-muted text-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-info/10 to-info/20 border-info/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-info" />
              AI-Powered Insights
            </CardTitle>
            <CardDescription>Smart analysis of your business model</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => {
              analyzeScenario();
              setActiveSubTab('insights');
            }} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze My Business
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/20 border-success/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-success" />
              Smart Scenarios
            </CardTitle>
            <CardDescription>Generate multiple business scenarios</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => {
              const optimistic = generateOptimisticScenario();
              const pessimistic = generatePessimisticScenario();
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: `I've generated three scenarios for you:

**Optimistic Scenario:**
- Sales: ${optimistic.enteredSales.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} (+25%)
- COGS: ${optimistic.variableCogs}% (-3%)
- Labor: ${optimistic.variableLabour}% (-2%)

**Pessimistic Scenario:**
- Sales: ${pessimistic.enteredSales.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} (-20%)
- COGS: ${pessimistic.variableCogs}% (+3%)
- Labor: ${pessimistic.variableLabour}% (+2%)

Would you like to apply any of these to your Detailed Break-Even scenarios?`,
                timestamp: new Date()
              }]);
              setActiveSubTab('chat');
            }} className="w-full" variant="default">
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Scenarios
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/20 border-success/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              Revenue Forecast
            </CardTitle>
            <CardDescription>12-month deterministic modeling</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => {
              generatePredictions();
              setActiveSubTab('predictions');
              setViewMode('monthly');
            }} className="w-full" variant="default">
              <TrendingUp className="h-4 w-4 mr-2" />
              Generate Forecast
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Lightbulb className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="predictions">
            <TrendingUp className="h-4 w-4 mr-2" />
            Predictions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Business Planning Assistant
              </CardTitle>
              <CardDescription>
                Describe your business in plain English, ask questions, or request scenario analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-brand text-brand-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                        <div
                          className={`text-xs mt-2 ${
                            message.role === 'user' ? 'text-brand-foreground/70' : 'text-muted-foreground'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <Separator />

              <div className="flex gap-2">
                <Textarea
                  placeholder="Describe your business idea, ask a question, or request analysis..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="min-h-[80px]"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isProcessing}
                  size="lg"
                  className="px-8"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => setInputMessage("I'm planning to open a coffee shop with $80k startup costs. What should I know?")}
                >
                  Coffee shop example
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => setInputMessage("How can I reduce my costs?")}
                >
                  Reduce costs
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => setInputMessage("What if my sales drop by 20%?")}
                >
                  Sales scenario
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => setInputMessage("Help me understand my break-even point")}
                >
                  Break-even help
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Insights & Recommendations</CardTitle>
              <CardDescription>
                Analysis based on your complete business data including Break-Even, Fitout, Hours, and Sales Mix
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insights.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/60 mb-4" />
                  <p className="text-muted-foreground mb-4">No insights generated yet</p>
                  <Button onClick={analyzeScenario}>
                    Analyze My Business
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.map((insight) => (
                    <Card key={insight.id} className={`border-l-4 ${
                      insight.severity === 'critical' ? 'border-l-destructive' :
                      insight.severity === 'warning' ? 'border-l-warning' :
                      'border-l-info'
                    }`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {getInsightIcon(insight.severity)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {insight.category}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={getSeverityColor(insight.severity)}
                                >
                                  {insight.severity}
                                </Badge>
                              </div>
                              <CardTitle className="text-base">{insight.title}</CardTitle>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm text-muted-foreground">{insight.message}</p>
                        {insight.suggestion && (
                          <div className="mt-3 p-3 bg-info/10 rounded-md border border-info/30">
                            <p className="text-sm text-info">
                              <strong>Suggestion:</strong> {insight.suggestion}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>12-Month Revenue Forecast</CardTitle>
              <CardDescription>
                Deterministic 12-month forecast based on your Expected Sales and cost assumptions, with a ramp from 40% to 100% of target annual sales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Which town is your new store located?</label>
                  {projectData.location?.address ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={localTownValue}
                        onChange={(e) => {
                          setLocalTownValue(e.target.value);
                          onUpdateProject({ ...projectData, storeTown: e.target.value });
                        }}
                        className="border rounded px-3 py-2 w-full max-w-md"
                        placeholder="e.g. Port Macquarie"
                      />
                      <p className="text-xs text-muted-foreground">
                        Using town from Location Suitability. You can edit this manually if needed.
                      </p>
                    </div>
                  ) : (
                    <>
                      {isLoaded ? (
                        <Autocomplete
                          onLoad={(autocomplete) => {
                            townAutocompleteRef.current = autocomplete;
                          }}
                          onPlaceChanged={handleTownSelect}
                        >
                          <input
                            type="text"
                            value={localTownValue}
                            onChange={(e) => {
                              setLocalTownValue(e.target.value);
                              onUpdateProject({ ...projectData, storeTown: e.target.value });
                            }}
                            className="border rounded px-3 py-2 w-full max-w-md"
                            placeholder="Start typing to search for a town..."
                          />
                        </Autocomplete>
                      ) : (
                        <input
                          type="text"
                          value={localTownValue}
                          onChange={(e) => {
                            setLocalTownValue(e.target.value);
                            onUpdateProject({ ...projectData, storeTown: e.target.value });
                          }}
                          className="border rounded px-3 py-2 w-full max-w-md"
                          placeholder="e.g. Port Macquarie"
                        />
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {isLoaded
                          ? 'Type to search for your town using Google Places'
                          : 'Enter town name manually'}
                      </p>
                    </>
                  )}
                  {projectData.storeTown && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Town set to <strong>{projectData.storeTown}</strong>. In future, MojoBusiness.ai
                      will use this to detect local events and adjust forecasts.
                    </p>
                  )}
                  {!projectData.storeTown && !projectData.location?.address && (
                    <p className="text-xs text-warning-foreground mt-2">
                      💡 Tip: Enter an address in Location Suitability to auto-populate this field
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">What type of venue is this?</label>
                  <select
                    value={projectData.venueType || 'QSRBurger'}
                    onChange={(e) =>
                      onUpdateProject({
                        ...projectData,
                        venueType: e.target.value as any,
                      })
                    }
                    className="border rounded px-3 py-2 w-full max-w-md"
                  >
                    <option value="QSRBurger">QSR / Burger / Fast Casual</option>
                    <option value="CafeBrunch">Café / Brunch</option>
                    <option value="Restaurant">Restaurant (Table Service)</option>
                    <option value="BarPub">Bar / Pub / Taproom</option>
                    <option value="CoffeeGrabAndGo">Coffee / Grab-&-Go</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Used to benchmark your required sales per trading hour
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Expected Opening Date</label>
                  <input
                    type="date"
                    value={projectData.expectedOpeningDate || ''}
                    onChange={(e) =>
                      onUpdateProject({ ...projectData, expectedOpeningDate: e.target.value })
                    }
                    className="border rounded px-3 py-2 w-full max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Used to calculate weekly "Week Ending" dates
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Seasonality Profile</label>
                    <select
                      value={projectData.seasonalityProfile || 'Flat'}
                      onChange={(e) =>
                        onUpdateProject({
                          ...projectData,
                          seasonalityProfile: e.target.value as any,
                        })
                      }
                      className="border rounded px-3 py-2 w-full"
                    >
                      <option value="Flat">Flat (No seasonality)</option>
                      <option value="SummerPeak">Summer Peak</option>
                      <option value="WinterPeak">Winter Peak</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Shapes revenue across months while keeping annual total the same
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Holiday Bump</label>
                    <select
                      value={projectData.holidayBumpProfile || 'None'}
                      onChange={(e) =>
                        onUpdateProject({
                          ...projectData,
                          holidayBumpProfile: e.target.value as any,
                        })
                      }
                      className="border rounded px-3 py-2 w-full"
                    >
                      <option value="None">None</option>
                      <option value="SchoolHolidays">School Holidays bump</option>
                      <option value="PublicHolidays">Public Holidays bump</option>
                      <option value="Both">Both (school + public)</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Adds uplift to holiday months while keeping annual sales the same
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'monthly' ? 'default' : 'outline'}
                    onClick={() => setViewMode('monthly')}
                    size="sm"
                  >
                    Monthly View
                  </Button>
                  <Button
                    variant={viewMode === 'weekly' ? 'default' : 'outline'}
                    onClick={() => setViewMode('weekly')}
                    size="sm"
                  >
                    Weekly View (52 Weeks)
                  </Button>
                </div>
              </div>

              {!forecast ? (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/60 mb-4" />
                  <p className="text-muted-foreground mb-4">No forecast generated yet</p>
                  <Button onClick={generatePredictions}>
                    Generate Forecast
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card className="bg-info/10 border-info/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-info">Annual Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-info">
                          {forecast.annualRevenue.toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            maximumFractionDigits: 0
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className={forecast.annualSurplus >= 0 ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'}>
                      <CardHeader className="pb-2">
                        <CardTitle className={`text-sm font-medium ${forecast.annualSurplus >= 0 ? 'text-success' : 'text-destructive'}`}>
                          Annual Surplus
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${forecast.annualSurplus >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {forecast.annualSurplus.toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            maximumFractionDigits: 0
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className={forecast.breakEvenMonthIndex ? 'bg-success/10 border-success/30' : 'bg-warning/10 border-warning/30'}>
                      <CardHeader className="pb-2">
                        <CardTitle className={`text-sm font-medium ${forecast.breakEvenMonthIndex ? 'text-success' : 'text-warning-foreground'}`}>
                          Break-Even Month
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${forecast.breakEvenMonthIndex ? 'text-success' : 'text-warning-foreground'}`}>
                          {forecast.breakEvenMonthIndex ? `Month ${forecast.breakEvenMonthIndex}` : 'Not Reached'}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {viewMode === 'monthly' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Monthly Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-2">Month</th>
                                <th className="text-right py-2 px-2">Revenue</th>
                                <th className="text-right py-2 px-2">Total Costs</th>
                                <th className="text-right py-2 px-2">Surplus</th>
                              </tr>
                            </thead>
                            <tbody>
                              {forecast.months.map((month) => (
                                <tr
                                  key={month.monthIndex}
                                  className={`border-b ${
                                    forecast.breakEvenMonthIndex === month.monthIndex
                                      ? 'bg-success/10'
                                      : month.surplus >= 0
                                      ? 'bg-success/5'
                                      : ''
                                  }`}
                                >
                                  <td className="py-2 px-2 font-medium">
                                    {month.label}
                                    {forecast.breakEvenMonthIndex === month.monthIndex && (
                                      <Badge className="ml-2 bg-success text-success-foreground text-xs">Break-Even</Badge>
                                    )}
                                  </td>
                                  <td className="text-right py-2 px-2">
                                    {month.revenue.toLocaleString('en-US', {
                                      style: 'currency',
                                      currency: 'USD',
                                      maximumFractionDigits: 0
                                    })}
                                  </td>
                                  <td className="text-right py-2 px-2">
                                    {month.totalCosts.toLocaleString('en-US', {
                                      style: 'currency',
                                      currency: 'USD',
                                      maximumFractionDigits: 0
                                    })}
                                  </td>
                                  <td className={`text-right py-2 px-2 font-semibold ${
                                    month.surplus >= 0 ? 'text-success' : 'text-destructive'
                                  }`}>
                                    {month.surplus.toLocaleString('en-US', {
                                      style: 'currency',
                                      currency: 'USD',
                                      maximumFractionDigits: 0
                                    })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {viewMode === 'weekly' && projectData.expectedOpeningDate && (() => {
                    const weeklyRows = generateWeeklyForecast(forecast, projectData.expectedOpeningDate);
                    return (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Weekly Breakdown (52 Weeks)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead className="sticky top-0 bg-surface-1">
                                <tr className="border-b">
                                  <th className="text-left py-2 px-2">Week</th>
                                  <th className="text-left py-2 px-2">Week Ending</th>
                                  <th className="text-right py-2 px-2">Revenue</th>
                                  <th className="text-right py-2 px-2">Total Costs</th>
                                  <th className="text-right py-2 px-2">Surplus</th>
                                </tr>
                              </thead>
                              <tbody>
                                {weeklyRows.map((row) => (
                                  <tr
                                    key={row.weekIndex}
                                    className={`border-b ${
                                      row.surplus >= 0 ? 'bg-success/5' : ''
                                    }`}
                                  >
                                    <td className="py-2 px-2 font-medium">Week {row.weekIndex}</td>
                                    <td className="py-2 px-2">{row.weekEnding}</td>
                                    <td className="text-right py-2 px-2">
                                      ${row.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="text-right py-2 px-2">
                                      ${row.costs.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className={`text-right py-2 px-2 font-semibold ${
                                      row.surplus >= 0 ? 'text-success' : 'text-destructive'
                                    }`}>
                                      ${row.surplus.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}

                  {viewMode === 'weekly' && !projectData.expectedOpeningDate && (
                    <Card className="bg-warning/10 border-warning/30">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-warning-foreground" />
                          <p className="text-sm text-warning-foreground">
                            Please enter an Expected Opening Date above to view the weekly forecast.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="bg-surface-1">
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p><strong>Forecast Methodology:</strong></p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Converts your Expected Sales to annual target based on selected period (Weekly/Monthly/Yearly)</li>
                          <li>Distributes revenue across 12 months with linear ramp from 40% to 100%, normalised to sum to annual target</li>
                          <li>Applies variable cost percentages from Detailed Break-Even Scenario 1</li>
                          <li>Annualises fixed costs based on period and spreads evenly across months</li>
                          <li>Fully deterministic - same inputs always produce same outputs</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
