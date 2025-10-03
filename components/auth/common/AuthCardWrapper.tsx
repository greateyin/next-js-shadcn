import * as React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Header } from "./Header";
import { Social } from "@/components/auth/common/Social";
import { BackButton } from "@/components/auth/common/BackButton";
import { cn } from "@/lib/utils";

interface AuthCardWrapperProps {
  children: React.ReactNode;
  headerLabel: string;
  backButtonLabel: string;
  backButtonHref: string;
  showSocial?: boolean;
  className?: string;
}

/**
 * AuthCardWrapper Component - Wrapper for authentication cards
 * 
 * This component provides a consistent card layout for authentication pages
 * including header, content, social login options, and navigation.
 * 
 * @component
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Child components to be rendered within the card
 * @param {string} props.headerLabel - Text to display in the card header
 * @param {string} props.backButtonLabel - Text for the back/alternative action button
 * @param {string} props.backButtonHref - URL for the back/alternative action button
 * @param {boolean} [props.showSocial] - Whether to show social login options
 * @param {string} [props.className] - Additional CSS classes to apply to the card
 * @returns {JSX.Element} The authentication card wrapper
 */
export function AuthCardWrapper({
  children,
  headerLabel,
  backButtonLabel,
  backButtonHref,
  showSocial,
  className
}: AuthCardWrapperProps) {
  return (
    <Card className={cn(
      "w-[400px] shadow-md border-border bg-card text-card-foreground",
      className
    )}>
      <CardHeader>
        <Header label={headerLabel} />
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
      {showSocial && (
        <CardFooter className="flex flex-col space-y-4 pt-0">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Social />
        </CardFooter>
      )}
      <CardFooter className="flex justify-center">
        <BackButton
          label={backButtonLabel}
          href={backButtonHref}
        />
      </CardFooter>
    </Card>
  );
}
