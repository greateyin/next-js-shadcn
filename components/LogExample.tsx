"use client";

/**
 * @fileoverview Log Example Component
 * This component demonstrates how to use the clientLogger in a React component
 * and provides UI to show different logging levels.
 */

import { useState, useEffect } from "react";
import { clientLogger } from "@/lib/clientLogger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type LogEntry = {
  level: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

/**
 * LogExample component demonstrates the usage of the clientLogger
 * and displays log entries in a UI.
 */
const LogExample = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Override console methods to capture logs for display in UI
  useEffect(() => {
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };

    // Only intercept if showing logs in UI
    if (showLogs) {
      console.info = (...args) => {
        originalConsole.info(...args);
        if (typeof args[0] === "string" && args[0].includes("[INFO]")) {
          addLogEntry("INFO", args);
        }
      };

      console.warn = (...args) => {
        originalConsole.warn(...args);
        if (typeof args[0] === "string" && args[0].includes("[WARN]")) {
          addLogEntry("WARN", args);
        }
      };

      console.error = (...args) => {
        originalConsole.error(...args);
        if (typeof args[0] === "string" && args[0].includes("[ERROR]")) {
          addLogEntry("ERROR", args);
        }
      };

      console.debug = (...args) => {
        originalConsole.debug(...args);
        if (typeof args[0] === "string" && args[0].includes("[DEBUG]")) {
          addLogEntry("DEBUG", args);
        }
      };
    }

    // Restore original console methods on cleanup
    return () => {
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.debug = originalConsole.debug;
    };
  }, [showLogs]);

  // Helper to add log entries to state
  const addLogEntry = (level: string, args: unknown[]) => {
    try {
      const timestampRegex = /\[(.*?)\]/;
      const match = timestampRegex.exec(args[0] as string);
      const timestamp = match ? match[1] : new Date().toISOString();
      
      const message = typeof args[1] === "string" ? args[1] : "Log message";
      const metadata = args[2] || {};

      setLogs((prevLogs) => [
        ...prevLogs,
        { level, message, timestamp, metadata },
      ].slice(-100)); // Keep only last 100 logs
    } catch (error) {
      console.error("Error parsing log:", error);
    }
  };

  // Log example methods
  const logInfo = () => {
    clientLogger.info("This is an info log", { source: "LogExample", user: "test" });
  };

  const logWarning = () => {
    clientLogger.warn("This is a warning log", { source: "LogExample", code: 301 });
  };

  const logError = () => {
    clientLogger.error("This is an error log", { source: "LogExample", error: "Connection failed" });
  };

  const logDebug = () => {
    clientLogger.debug("This is a debug log", { source: "LogExample", data: { a: 1, b: 2 } });
  };

  // Filter logs based on active tab
  const filteredLogs = logs.filter((log) => {
    if (activeTab === "all") return true;
    return log.level === activeTab;
  });

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Logging Example</CardTitle>
        <CardDescription>
          Demonstrates client-side logging with environment variable control
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-md text-sm">
          <h3 className="font-semibold mb-2">Configuration:</h3>
          <p className="mb-2">
            To enable client-side logging, add the following to your .env.local file:
          </p>
          <pre className="p-2 bg-slate-200 dark:bg-slate-900 rounded">
            NEXT_PUBLIC_CLIENT_SIDE_LOG_ON="true"
          </pre>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-2 flex-wrap">
            <Button variant="default" onClick={logInfo}>
              Log Info
            </Button>
            <Button variant="secondary" onClick={logWarning}>
              Log Warning
            </Button>
            <Button variant="destructive" onClick={logError}>
              Log Error
            </Button>
            <Button variant="outline" onClick={logDebug}>
              Log Debug
            </Button>
          </div>

          <div className="flex items-center space-x-2 mt-4">
            <Switch id="show-logs" checked={showLogs} onCheckedChange={setShowLogs} />
            <Label htmlFor="show-logs">Show logs in UI</Label>
          </div>

          {showLogs && (
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Logs</TabsTrigger>
                <TabsTrigger value="INFO">Info</TabsTrigger>
                <TabsTrigger value="WARN">Warnings</TabsTrigger>
                <TabsTrigger value="ERROR">Errors</TabsTrigger>
                <TabsTrigger value="DEBUG">Debug</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-2">
                <div className="h-[300px] overflow-auto border rounded-md p-2">
                  {filteredLogs.length === 0 ? (
                    <p className="text-center p-4 text-slate-500">No logs to display</p>
                  ) : (
                    filteredLogs.map((log, index) => (
                      <div
                        key={index}
                        className={`p-2 text-sm mb-1 rounded ${
                          log.level === "ERROR"
                            ? "bg-red-50 dark:bg-red-900/20 border-l-2 border-red-500"
                            : log.level === "WARN"
                            ? "bg-yellow-50 dark:bg-yellow-900/20 border-l-2 border-yellow-500"
                            : log.level === "INFO"
                            ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500"
                            : "bg-gray-50 dark:bg-gray-800/50 border-l-2 border-gray-500"
                        }`}
                      >
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span className="font-semibold">{log.level}</span>
                          <span>{log.timestamp}</span>
                        </div>
                        <div className="font-medium">{log.message}</div>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <pre className="mt-1 p-1 bg-slate-100 dark:bg-slate-800 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-slate-500">
        <p>
          Log level set to: {process.env.NEXT_PUBLIC_LOG_LEVEL || "info"}
        </p>
        <p>
          Logging enabled: {process.env.NEXT_PUBLIC_CLIENT_SIDE_LOG_ON === "true" ? "Yes" : "No"}
        </p>
      </CardFooter>
    </Card>
  );
};

export default LogExample;