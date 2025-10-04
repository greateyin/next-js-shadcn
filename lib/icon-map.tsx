/**
 * @fileoverview Icon Mapping Utility
 * @module lib/icon-map
 * @description Maps icon names from database to Lucide React icons
 */

import {
  LayoutDashboard,
  UserCircle,
  Users,
  Settings,
  Home,
  FileText,
  Calendar,
  Mail,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  Trash,
  Save,
  Download,
  Upload,
  RefreshCw,
  LogOut,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Shield,
  AlertCircle,
  CheckCircle,
  Info,
  HelpCircle,
  Star,
  Heart,
  Share,
  Bookmark,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  BarChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Tag,
  Folder,
  FolderOpen,
  File,
  Image,
  Video,
  Music,
  Code,
  Database,
  Server,
  Cloud,
  Zap,
  Activity,
  type LucideIcon,
} from "lucide-react";

/**
 * Icon map - maps string names to Lucide React icon components
 */
const iconMap: Record<string, LucideIcon> = {
  // Navigation
  LayoutDashboard,
  UserCircle,
  Users,
  Settings,
  Home,
  Menu,
  
  // Documents
  FileText,
  File,
  Folder,
  FolderOpen,
  
  // Communication
  Mail,
  Bell,
  Calendar,
  
  // UI Elements
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  Trash,
  Save,
  
  // File Operations
  Download,
  Upload,
  RefreshCw,
  
  // Auth
  LogOut,
  Lock,
  Unlock,
  Shield,
  Eye,
  EyeOff,
  
  // Status
  AlertCircle,
  CheckCircle,
  Info,
  HelpCircle,
  
  // Social
  Star,
  Heart,
  Share,
  Bookmark,
  
  // Data
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  
  // Charts
  BarChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  
  // Commerce
  Package,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Tag,
  
  // Media
  Image,
  Video,
  Music,
  
  // Tech
  Code,
  Database,
  Server,
  Cloud,
  Zap,
};

/**
 * Get icon component by name
 * 
 * @param iconName - Icon name from database (e.g., "LayoutDashboard", "Users")
 * @param defaultIcon - Default icon if name not found (default: LayoutDashboard)
 * @returns Lucide icon component
 * 
 * @example
 * ```tsx
 * const Icon = getIcon("Users");
 * return <Icon className="h-4 w-4" />;
 * ```
 */
export function getIcon(
  iconName?: string | null,
  defaultIcon: LucideIcon = LayoutDashboard
): LucideIcon {
  if (!iconName) {
    return defaultIcon;
  }

  // Try exact match
  if (iconMap[iconName]) {
    return iconMap[iconName];
  }

  // Try case-insensitive match
  const lowerIconName = iconName.toLowerCase();
  const matchedKey = Object.keys(iconMap).find(
    (key) => key.toLowerCase() === lowerIconName
  );

  if (matchedKey) {
    return iconMap[matchedKey];
  }

  // Return default icon if not found
  console.warn(`Icon "${iconName}" not found, using default icon`);
  return defaultIcon;
}

/**
 * Get all available icon names
 * 
 * @returns Array of available icon names
 */
export function getAvailableIcons(): string[] {
  return Object.keys(iconMap).sort();
}

/**
 * Check if icon name exists
 * 
 * @param iconName - Icon name to check
 * @returns Boolean indicating if icon exists
 */
export function hasIcon(iconName?: string | null): boolean {
  if (!iconName) return false;
  
  return Object.keys(iconMap).some(
    (key) => key.toLowerCase() === iconName.toLowerCase()
  );
}
