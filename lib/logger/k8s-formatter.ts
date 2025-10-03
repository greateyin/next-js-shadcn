/**
 * @fileoverview Kubernetes-specific log formatter
 * @module logger/k8s-formatter
 */

import winston from 'winston';
import { K8S_CONFIG, K8S_METADATA } from './k8s-constants';

/**
 * Creates a Kubernetes-compatible log formatter
 * @returns {winston.Logform.Format} Winston format
 */
export function createK8sFormatter(): winston.Logform.Format {
    return winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format((info) => {
            // Add Kubernetes metadata
            info.kubernetes = {
                namespace: K8S_CONFIG.NAMESPACE,
                pod_name: K8S_CONFIG.POD_NAME,
                node_name: K8S_CONFIG.NODE_NAME,
                container_name: K8S_CONFIG.CONTAINER_NAME,
            };

            // Add standard fields
            info.time = info.timestamp;
            info.level = info.level.toUpperCase();
            info.caller = info.caller || 'unknown';

            // Add trace context if available
            if (info.trace_id) {
                info.trace = {
                    trace_id: info.trace_id,
                    span_id: info.span_id,
                    parent_span_id: info.parent_span_id,
                };
            }

            // Add resource usage if available
            if (info.resource) {
                info.resource = {
                    ...info.resource,
                    timestamp: info.timestamp,
                };
            }

            return info;
        })()
    );
}

/**
 * Creates a Prometheus-compatible metrics formatter
 * @returns {winston.Logform.Format} Winston format
 */
export function createMetricsFormatter(): winston.Logform.Format {
    return winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format((info: any) => {
            // Add standard Prometheus labels
            info.labels = {
                ...K8S_CONFIG,
                level: info.level,
                status: info.status || 'unknown',
                ...(info.labels || {}),
            };

            // Add metrics if available
            if (info.metrics) {
                info.metrics = {
                    timestamp: info.timestamp,
                    ...(info.metrics || {}),
                };
            }

            return info;
        })()
    );
}

/**
 * Creates a health check formatter
 * @returns {winston.Logform.Format} Winston format
 */
export function createHealthCheckFormatter(): winston.Logform.Format {
    return winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format((info) => {
            // Add health check specific fields
            info.health = {
                status: info.status,
                check_type: info.check_type,
                details: info.details || {},
                timestamp: info.timestamp,
            };

            // Add Kubernetes context
            info.kubernetes = {
                namespace: K8S_CONFIG.NAMESPACE,
                pod_name: K8S_CONFIG.POD_NAME,
            };

            return info;
        })()
    );
}
