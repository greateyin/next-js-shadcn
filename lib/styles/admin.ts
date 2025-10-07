/**
 * Admin page unified style configuration
 * 
 * This file defines unified styles for all pages under /admin path
 * Facilitates global theme modification and consistency maintenance
 */

/**
 * Admin page style constants
 */
export const adminStyles = {
  // ==================== Page Layout ====================
  
  /**
   * Page main container
   * Usage: <div className={adminStyles.pageContainer}>
   */
  pageContainer: "flex-1 space-y-6",
  
  // ==================== Page Header Section ====================
  
  /**
   * Header container - includes title and optional action buttons
   */
  headerContainer: "flex items-center justify-between",
  
  /**
   * Header content area
   */
  headerContent: "",
  
  /**
   * Page main title
   */
  headerTitle: "text-3xl md:text-4xl font-semibold tracking-tight text-gray-900",
  
  /**
   * Page description text
   */
  headerDescription: "text-gray-600 mt-2",
  
  // ==================== Card Styles ====================
  
  card: {
    /**
     * Card base style
     * Apple Style: white background + glass effect + gray border
     */
    base: "border-gray-200/50 shadow-sm bg-white/80 backdrop-blur-sm",
    
    /**
     * Card Header style
     * Header with bottom border
     */
    header: "border-b border-gray-100",
    
    /**
     * Card Title style
     */
    title: "text-lg font-semibold text-gray-900",
    
    /**
     * Card Description style
     */
    description: "text-gray-600",
    
    /**
     * Card Content style (no padding, for tables)
     */
    content: "p-0",
    
    /**
     * Card Content style (with padding)
     */
    contentWithPadding: "p-6",
  },
  
  // ==================== State Styles ====================
  
  loading: {
    /**
     * Loading container
     */
    container: "flex items-center justify-center p-8",
    
    /**
     * Loading text
     */
    text: "text-gray-500",
    
    /**
     * Loading icon
     */
    icon: "h-5 w-5 animate-spin text-gray-500",
  },
  
  empty: {
    /**
     * Empty state container
     */
    container: "flex flex-col items-center justify-center p-12",
    
    /**
     * Empty state title
     */
    title: "text-lg font-medium text-gray-900",
    
    /**
     * Empty state description
     */
    description: "mt-2 text-gray-600",
    
    /**
     * Empty state icon
     */
    icon: "mb-4 text-gray-400",
  },
  
  // ==================== Text Colors ====================
  
  text: {
    /**
     * Primary text color (titles, important information)
     */
    primary: "text-gray-900",
    
    /**
     * Secondary text color (descriptions, explanations)
     */
    secondary: "text-gray-600",
    
    /**
     * Tertiary text color (hints, supplements)
     */
    tertiary: "text-gray-500",
    
    /**
     * Success state text
     */
    success: "text-green-600",
    
    /**
     * Error state text
     */
    error: "text-red-600",
    
    /**
     * Warning state text
     */
    warning: "text-yellow-600",
    
    /**
     * Info state text
     */
    info: "text-blue-600",
  },
  
  // ==================== Background Colors ====================
  
  bg: {
    /**
     * Card background (glass effect)
     */
    card: "bg-white/80 backdrop-blur-sm",
    
    /**
     * Hover background
     */
    hover: "hover:bg-gray-50",
    
    /**
     * Active background
     */
    active: "bg-blue-50",
    
    /**
     * Success background
     */
    success: "bg-green-50",
    
    /**
     * Error background
     */
    error: "bg-red-50",
    
    /**
     * Warning background
     */
    warning: "bg-yellow-50",
  },
  
  // ==================== Borders ====================
  
  border: {
    /**
     * Default border (semi-transparent gray)
     */
    default: "border-gray-200/50",
    
    /**
     * Light border
     */
    light: "border-gray-100",
    
    /**
     * Dark border
     */
    dark: "border-gray-300",
  },
  
  // ==================== Tabs Styles ====================
  
  tabs: {
    /**
     * TabsList style
     */
    list: "bg-gray-100/80 border border-gray-200/50",
    
    /**
     * TabsTrigger style
     * Includes active state
     */
    trigger: "data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm",
    
    /**
     * TabsContent container
     */
    content: "space-y-6",
  },
  
  // ==================== Button Styles ====================
  
  button: {
    /**
     * Primary button (for important actions)
     */
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    
    /**
     * Secondary button
     */
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    
    /**
     * Danger button (delete, etc.)
     */
    danger: "bg-red-600 text-white hover:bg-red-700",
  },
  
  // ==================== Table Styles ====================
  
  table: {
    /**
     * Table container
     */
    container: "w-full overflow-auto",
    
    /**
     * Table header
     */
    header: "bg-gray-50 border-b border-gray-100",
    
    /**
     * Table row
     */
    row: "border-b border-gray-100 hover:bg-gray-50",
    
    /**
     * Table cell
     */
    cell: "px-6 py-4",
  },
} as const;

/**
 * Helper function for combining styles
 * 
 * @example
 * cn(adminStyles.card.base, "mt-4", someCondition && "opacity-50")
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Type exports
 */
export type AdminStyles = typeof adminStyles;
