"use client";

/**
 * @fileoverview Server log testing panel component
 * @module components/ServerLogTestPanel
 * @description Component for testing server logging with different log levels
 */

import { useState } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Zod schema for log test form validation
 * @constant
 * @type {z.ZodObject}
 */
const formSchema = z.object({
  message: z.string().min(1, {
    message: "Message is required",
  }),
  level: z.enum(["info", "warn", "error", "debug"], {
    required_error: "Please select a log level",
  }),
  metadata: z.string().optional(),
});

/**
 * Type definition for the log test form values
 * @typedef {Object} LogTestFormValues
 * @property {string} message - Log message to send
 * @property {string} level - Log level (info, warn, error, debug)
 * @property {string} metadata - Optional JSON metadata
 */
type LogTestFormValues = z.infer<typeof formSchema>;

/**
 * Response type from the log-test API
 * @typedef {Object} LogResponse
 * @property {string} [success] - Success message
 * @property {string} [error] - Error message
 * @property {string} [level] - Log level used
 * @property {string} [timestamp] - Timestamp when log was recorded
 */
type LogResponse = {
  success?: string;
  error?: string;
  level?: string;
  timestamp?: string;
  details?: Record<string, unknown>;
};

/**
 * Status badge component for showing status
 */
function StatusBadge({ status, text }: { status: string; text: string }) {
  return (
    <Badge
      className={cn(
        "text-xs",
        status === "success" && "bg-green-100 text-green-800 hover:bg-green-100",
        status === "error" && "bg-red-100 text-red-800 hover:bg-red-100",
        status === "warning" && "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        status === "info" && "bg-blue-100 text-blue-800 hover:bg-blue-100"
      )}
    >
      {text}
    </Badge>
  );
}

/**
 * ServerLogTestPanel component for testing server-side logging
 * @component
 * @description Renders a form for sending test log messages to the server with different log levels
 * 
 * @example
 * ```tsx
 * <ServerLogTestPanel />
 * ```
 */
export function ServerLogTestPanel() {
  const [isPending, setIsPending] = useState(false);
  const [response, setResponse] = useState<LogResponse | null>(null);
  const [loggingStatus, setLoggingStatus] = useState<{
    loggingEnabled?: boolean;
    environment?: string;
    message?: string;
  } | null>(null);

  const form = useForm<LogTestFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
      level: "info",
      metadata: "",
    },
  });

  /**
   * Handles form submission to send log message to server
   * @async
   * @param {LogTestFormValues} values - Form values containing log message and level
   */
  const onSubmit = async (values: LogTestFormValues) => {
    setIsPending(true);
    setResponse(null);

    try {
      // Parse metadata JSON if provided
      let metaObject = {};
      if (values.metadata && values.metadata.trim() !== "") {
        try {
          metaObject = JSON.parse(values.metadata);
        } catch {
          toast.error("Invalid JSON in metadata field");
          setIsPending(false);
          return;
        }
      }

      const response = await fetch("/api/log-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: values.message,
          level: values.level,
          meta: Object.keys(metaObject).length > 0 ? metaObject : undefined,
        }),
      });

      const data = await response.json();
      setResponse(data);

      if (response.ok) {
        toast.success(`Log sent successfully with level: ${values.level}`);
      } else {
        toast.error(data.error || "Failed to send log");
      }
    } catch {
      toast.error("An error occurred while sending the log");
      setResponse({ error: "Failed to connect to the server" });
    } finally {
      setIsPending(false);
    }
  };

  /**
   * Checks server logging status
   * @async
   */
  const checkLoggingStatus = async () => {
    try {
      const response = await fetch("/api/log-test", {
        method: "GET",
      });
      const data = await response.json();
      setLoggingStatus(data);
      
      if (data.loggingEnabled) {
        toast.success("Server logging is enabled");
      } else {
        toast.warning("Server logging is disabled");
      }
    } catch {
      toast.error("Failed to check logging status");
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Server Log Testing</CardTitle>
        <CardDescription>
          Send test log messages to the server with different log levels.
        </CardDescription>
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkLoggingStatus}
            disabled={isPending}
          >
            Check Logging Status
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loggingStatus && (
          <div className="mb-6 p-4 rounded-md bg-slate-100 dark:bg-slate-800">
            <p className="mb-2">
              <span className="font-semibold">Status:</span>{" "}
              {loggingStatus.loggingEnabled ? (
                <StatusBadge status="success" text="Enabled" />
              ) : (
                <StatusBadge status="error" text="Disabled" />
              )}
            </p>
            <p className="mb-2">
              <span className="font-semibold">Environment:</span> {loggingStatus.environment}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {loggingStatus.message}
            </p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Log Level</FormLabel>
                  <Select
                    disabled={isPending}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select log level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Log Message</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="Enter log message"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metadata"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metadata (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      disabled={isPending}
                      placeholder='{"key": "value"}'
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormDescription>
                    Additional JSON metadata to include with the log entry
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              disabled={isPending}
              type="submit"
              className="w-full"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Log
            </Button>
          </form>
        </Form>

        {response && (
          <div className="mt-6 p-4 rounded-md border">
            <h3 className="font-semibold mb-2">Server Response:</h3>
            <div className="overflow-x-auto">
              {response.success && (
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge 
                    status={
                      response.level === "error" ? "error" :
                      response.level === "warn" ? "warning" :
                      response.level === "debug" ? "info" : "success"
                    } 
                    text={response.level || "info"} 
                  />
                  <span className="text-green-600 dark:text-green-400">{response.success}</span>
                </div>
              )}
              {response.error && (
                <div className="text-red-600 dark:text-red-400 mb-2">
                  Error: {response.error}
                </div>
              )}
              {response.details && (
                <div className="text-red-600 dark:text-red-400 text-sm mt-1">
                  <pre className="whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(response.details, null, 2)}
                  </pre>
                </div>
              )}
              {response.timestamp && (
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Timestamp: {response.timestamp}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between text-sm text-slate-500">
        <div>
          Set <code>SERVER_SIDE_LOG_ON=true</code> in <code>.env</code> to enable server logs
        </div>
      </CardFooter>
    </Card>
  );
}

export default ServerLogTestPanel;