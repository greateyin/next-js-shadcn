"use client";

import LogExample from "@/components/LogExample";
import ServerLogTestPanel from "@/components/ServerLogTestPanel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

/**
 * LogDemoPage - Showcase for client and server logging capabilities
 * 
 * This page demonstrates:
 * 1. Client-side logging with the clientLogger utility
 * 2. Server-side logging through API endpoints
 * 
 * @returns {JSX.Element} Rendered log demo page
 */
export default function LogDemoPage() {
  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Logging System Demo</h1>
        <Button variant="outline" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
      
      <p className="text-muted-foreground mb-8">
        This page demonstrates both client-side and server-side logging capabilities.
        Configure environment variables to control logging behavior.
      </p>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Client-side Logging</h2>
        <p className="text-muted-foreground mb-6">
          Client-side logging captures events in the browser and can display them in the UI.
          Enable with <code className="bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_CLIENT_SIDE_LOG_ON=true</code>
        </p>
        <LogExample />
      </section>

      <Separator className="my-12" />
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">Server-side Logging</h2>
        <p className="text-muted-foreground mb-6">
          Server-side logging captures events on the server and writes them to configured outputs.
          Enable with <code className="bg-muted px-1 py-0.5 rounded">SERVER_SIDE_LOG_ON=true</code>
        </p>
        <ServerLogTestPanel />
      </section>
      
      <div className="mt-12 p-6 bg-muted rounded-lg">
        <h3 className="text-xl font-medium mb-3">Environment Configuration</h3>
        <ul className="space-y-2 text-sm">
          <li><strong>Client Logging:</strong> Set <code>NEXT_PUBLIC_CLIENT_SIDE_LOG_ON=true</code></li>
          <li><strong>Server Logging:</strong> Set <code>SERVER_SIDE_LOG_ON=true</code></li>
          <li><strong>Log Level:</strong> Control with <code>NEXT_PUBLIC_LOG_LEVEL=info|warn|error|debug</code></li>
        </ul>
      </div>
    </div>
  );
}