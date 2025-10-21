import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { runSystemHealthCheck, getHealthSummary, HealthCheckResult } from "@/lib/systemHealthCheck";
import { Badge } from "@/components/ui/badge";

const HealthCheck = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<HealthCheckResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const runHealthCheck = async () => {
    setIsRunning(true);
    setHasRun(false);
    
    try {
      const checkResults = await runSystemHealthCheck();
      setResults(checkResults);
      setHasRun(true);
    } catch (error) {
      console.error("Health check failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const summary = hasRun ? getHealthSummary(results) : null;

  return (
    <div className="min-h-screen gradient-pastel p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="shadow-gentle mb-6">
            <CardHeader>
              <CardTitle className="text-3xl">System Health Check</CardTitle>
              <CardDescription>
                Test all LingoBuddy services and edge functions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={runHealthCheck}
                disabled={isRunning}
                size="lg"
                className="w-full sm:w-auto"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Health Check
                  </>
                )}
              </Button>

              {summary && (
                <div className="mt-6 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Overall Health</h3>
                      <p className="text-muted-foreground">
                        {summary.healthy} / {summary.total} services operational
                      </p>
                    </div>
                    <Badge
                      variant={summary.isHealthy ? "default" : "destructive"}
                      className="text-lg px-4 py-2"
                    >
                      {summary.healthPercentage}% Healthy
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {hasRun && (
            <div className="space-y-3">
              {results.map((result, index) => (
                <motion.div
                  key={result.service}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`shadow-gentle ${
                    result.status === 'ok' 
                      ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' 
                      : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {result.status === 'ok' ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-semibold">{result.service}</h4>
                            <Badge variant={result.status === 'ok' ? 'default' : 'destructive'}>
                              {result.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground break-words">
                            {result.message}
                          </p>
                          {result.details && (
                            <details className="mt-2 text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                View Details
                              </summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default HealthCheck;
