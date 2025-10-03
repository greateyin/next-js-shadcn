/**
 * @fileoverview Kubernetes-specific logging constants
 * @module logger/k8s-constants
 */

/** Kubernetes metadata fields */
export const K8S_METADATA = {
    NAMESPACE: 'k8s_namespace',
    POD_NAME: 'k8s_pod_name',
    NODE_NAME: 'k8s_node_name',
    CONTAINER_NAME: 'k8s_container_name',
    DEPLOYMENT_NAME: 'k8s_deployment',
    SERVICE_NAME: 'k8s_service',
    REPLICA_SET: 'k8s_replica_set',
    CLUSTER_NAME: 'k8s_cluster',
} as const;

/** Resource metadata fields */
export const RESOURCE_METADATA = {
    CPU_USAGE: 'cpu_usage',
    MEMORY_USAGE: 'memory_usage',
    DISK_USAGE: 'disk_usage',
    NETWORK_IN: 'network_in',
    NETWORK_OUT: 'network_out',
} as const;

/** Health check metadata */
export const HEALTH_METADATA = {
    READINESS: 'readiness',
    LIVENESS: 'liveness',
    STARTUP: 'startup',
} as const;

/** Default Kubernetes configuration */
export const K8S_CONFIG = {
    // 使用環境變數，這些變數在 K8s 中會自動注入
    NAMESPACE: process.env.K8S_NAMESPACE || 'default',
    POD_NAME: process.env.K8S_POD_NAME || 'unknown',
    NODE_NAME: process.env.K8S_NODE_NAME || 'unknown',
    CONTAINER_NAME: process.env.K8S_CONTAINER_NAME || 'unknown',
    // 日誌相關配置
    LOG_FORMAT: 'json',  // K8s 建議使用 JSON 格式
    STDOUT_ENABLED: true,  // 在 K8s 中，日誌應該輸出到 stdout
    MAX_SIZE: process.env.LOG_MAX_SIZE || '100m',  // 單個日誌文件最大大小
    MAX_FILES: process.env.LOG_MAX_FILES || '5',   // 保留的日誌文件數量
} as const;

/** Prometheus metrics configuration */
export const METRICS_CONFIG = {
    ENABLED: true,
    PORT: process.env.METRICS_PORT || 9090,
    PATH: '/metrics',
    DEFAULT_LABELS: {
        app: process.env.APP_NAME || 'auth-service',
        environment: process.env.NODE_ENV || 'production',
    },
} as const;
