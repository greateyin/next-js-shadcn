/**
 * Admin 页面统一样式配置
 * 
 * 此文件定义了所有 /admin 路径下页面的统一样式
 * 便于全局修改主题和维护一致性
 */

/**
 * Admin 页面样式常量
 */
export const adminStyles = {
  // ==================== 页面布局 ====================
  
  /**
   * 页面主容器
   * 使用: <div className={adminStyles.pageContainer}>
   */
  pageContainer: "flex-1 space-y-6",
  
  // ==================== 页面标题区块 ====================
  
  /**
   * 标题容器 - 包含标题和可选的操作按钮
   */
  headerContainer: "flex items-center justify-between",
  
  /**
   * 标题内容区
   */
  headerContent: "",
  
  /**
   * 页面主标题
   */
  headerTitle: "text-3xl md:text-4xl font-semibold tracking-tight text-gray-900",
  
  /**
   * 页面描述文字
   */
  headerDescription: "text-gray-600 mt-2",
  
  // ==================== Card 样式 ====================
  
  card: {
    /**
     * Card 基础样式
     * Apple Style: 白色背景 + 玻璃效果 + 灰色边框
     */
    base: "border-gray-200/50 shadow-sm bg-white/80 backdrop-blur-sm",
    
    /**
     * Card Header 样式
     * 带底部边框的 header
     */
    header: "border-b border-gray-100",
    
    /**
     * Card Title 样式
     */
    title: "text-lg font-semibold text-gray-900",
    
    /**
     * Card Description 样式
     */
    description: "text-gray-600",
    
    /**
     * Card Content 样式（无内边距，用于表格）
     */
    content: "p-0",
    
    /**
     * Card Content 样式（有内边距）
     */
    contentWithPadding: "p-6",
  },
  
  // ==================== 状态样式 ====================
  
  loading: {
    /**
     * Loading 容器
     */
    container: "flex items-center justify-center p-8",
    
    /**
     * Loading 文字
     */
    text: "text-gray-500",
    
    /**
     * Loading 图标
     */
    icon: "h-5 w-5 animate-spin text-gray-500",
  },
  
  empty: {
    /**
     * 空状态容器
     */
    container: "flex flex-col items-center justify-center p-12",
    
    /**
     * 空状态标题
     */
    title: "text-lg font-medium text-gray-900",
    
    /**
     * 空状态描述
     */
    description: "mt-2 text-gray-600",
    
    /**
     * 空状态图标
     */
    icon: "mb-4 text-gray-400",
  },
  
  // ==================== 文字颜色 ====================
  
  text: {
    /**
     * 主要文字颜色（标题、重要信息）
     */
    primary: "text-gray-900",
    
    /**
     * 次要文字颜色（描述、说明）
     */
    secondary: "text-gray-600",
    
    /**
     * 辅助文字颜色（提示、补充）
     */
    tertiary: "text-gray-500",
    
    /**
     * 成功状态文字
     */
    success: "text-green-600",
    
    /**
     * 错误状态文字
     */
    error: "text-red-600",
    
    /**
     * 警告状态文字
     */
    warning: "text-yellow-600",
    
    /**
     * 信息状态文字
     */
    info: "text-blue-600",
  },
  
  // ==================== 背景颜色 ====================
  
  bg: {
    /**
     * Card 背景（玻璃效果）
     */
    card: "bg-white/80 backdrop-blur-sm",
    
    /**
     * Hover 背景
     */
    hover: "hover:bg-gray-50",
    
    /**
     * Active 背景
     */
    active: "bg-blue-50",
    
    /**
     * 成功背景
     */
    success: "bg-green-50",
    
    /**
     * 错误背景
     */
    error: "bg-red-50",
    
    /**
     * 警告背景
     */
    warning: "bg-yellow-50",
  },
  
  // ==================== 边框 ====================
  
  border: {
    /**
     * 默认边框（半透明灰色）
     */
    default: "border-gray-200/50",
    
    /**
     * 浅色边框
     */
    light: "border-gray-100",
    
    /**
     * 深色边框
     */
    dark: "border-gray-300",
  },
  
  // ==================== Tabs 样式 ====================
  
  tabs: {
    /**
     * TabsList 样式
     */
    list: "bg-gray-100/80 border border-gray-200/50",
    
    /**
     * TabsTrigger 样式
     * 包含 active 状态
     */
    trigger: "data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm",
    
    /**
     * TabsContent 容器
     */
    content: "space-y-6",
  },
  
  // ==================== 按钮样式 ====================
  
  button: {
    /**
     * 主要按钮（用于重要操作）
     */
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    
    /**
     * 次要按钮
     */
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    
    /**
     * 危险按钮（删除等）
     */
    danger: "bg-red-600 text-white hover:bg-red-700",
  },
  
  // ==================== 表格样式 ====================
  
  table: {
    /**
     * 表格容器
     */
    container: "w-full overflow-auto",
    
    /**
     * 表格 header
     */
    header: "bg-gray-50 border-b border-gray-100",
    
    /**
     * 表格 row
     */
    row: "border-b border-gray-100 hover:bg-gray-50",
    
    /**
     * 表格 cell
     */
    cell: "px-6 py-4",
  },
} as const;

/**
 * 组合样式的辅助函数
 * 
 * @example
 * cn(adminStyles.card.base, "mt-4", someCondition && "opacity-50")
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * 类型导出
 */
export type AdminStyles = typeof adminStyles;
