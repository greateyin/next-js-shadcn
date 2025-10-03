/**
 * @fileoverview Password strength meter component that visualizes password strength
 * @module components/auth/PasswordStrengthMeter
 */

"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/**
 * Props interface for the PasswordStrengthMeter component
 * @interface
 * @property {number} score - Password strength score (0-4)
 * where:
 * - 0: Very Weak
 * - 1: Weak
 * - 2: Fair
 * - 3: Good
 * - 4: Strong
 */
interface PasswordStrengthMeterProps {
  score: number; // 0-4
}

/**
 * PasswordStrengthMeter component displays a visual indicator of password strength
 * @component
 * @description Renders a progress bar and text label indicating password strength
 * based on a score from 0 to 4. The color and text change based on the score.
 * 
 * @param {PasswordStrengthMeterProps} props - Component props
 * @param {number} props.score - Password strength score (0-4)
 * 
 * @example
 * ```tsx
 * // Show password strength for a weak password
 * <PasswordStrengthMeter score={1} />
 * 
 * // Show password strength for a strong password
 * <PasswordStrengthMeter score={4} />
 * ```
 */
export function PasswordStrengthMeter({ score }: PasswordStrengthMeterProps) {
  /**
   * Gets the text description of password strength based on score
   * @function
   * @param {number} score - Password strength score
   * @returns {string} Text description of password strength
   */
  const getStrengthText = (score: number) => {
    switch (score) {
      case 0:
        return "Very Weak";
      case 1:
        return "Weak";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Strong";
      default:
        return "Very Weak";
    }
  };

  /**
   * Gets the color class for the progress bar based on score
   * @function
   * @param {number} score - Password strength score
   * @returns {string} Tailwind CSS color class
   */
  const getStrengthColor = (score: number) => {
    switch (score) {
      case 0:
        return "text-red-500";
      case 1:
        return "text-orange-500";
      case 2:
        return "text-yellow-500";
      case 3:
        return "text-green-500";
      case 4:
        return "text-emerald-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="space-y-2">
      <Progress
        value={(score + 1) * 20}
        className={cn(
          "h-2",
          score === 0 && "bg-red-500",
          score === 1 && "bg-orange-500",
          score === 2 && "bg-yellow-500",
          score === 3 && "bg-green-500",
          score === 4 && "bg-emerald-500"
        )}
      />
      <p className={cn("text-sm", getStrengthColor(score))}>
        Password Strength: {getStrengthText(score)}
      </p>
    </div>
  );
}