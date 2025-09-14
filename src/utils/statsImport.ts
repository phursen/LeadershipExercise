import { z } from 'zod';
import { ConnectionStats, ConnectionEvent } from './socketAnalytics';

const eventSchema = z.object({
  timestamp: z.string().datetime(),
  type: z.enum(['connect', 'disconnect', 'reconnect_attempt', 'reconnect_success', 'reconnect_failure']),
  attemptNumber: z.number().optional(),
  delay: z.number().optional(),
  error: z.string().optional()
});

const statsSchema = z.object({
  totalDisconnects: z.number().min(0),
  totalReconnectAttempts: z.number().min(0),
  successfulReconnects: z.number().min(0),
  failedReconnects: z.number().min(0),
  averageReconnectTime: z.number().min(0),
  lastDisconnectTime: z.string().datetime().nullable(),
  lastReconnectTime: z.string().datetime().nullable(),
  events: z.array(eventSchema)
});

const chartDataSchema = z.object({
  timestamp: z.string().datetime(),
  averageReconnectTime: z.number().min(0),
  disconnectCount: z.number().min(0),
  reconnectAttempts: z.number().min(0),
  successfulReconnects: z.number().min(0),
  successRate: z.number().min(0).max(100)
});

const trendDataSchema = z.object({
  disconnectFrequency: z.number().min(0),
  reconnectSuccessRate: z.number().min(0).max(100),
  averageReconnectTime: z.number().min(0),
  trendDirection: z.enum(['improving', 'stable', 'degrading']),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime()
});

const metadataSchema = z.object({
  exportedAt: z.string().datetime(),
  timeRange: z.object({
    start: z.string().datetime().nullable(),
    end: z.string().datetime().nullable()
  }),
  version: z.string(),
  totalEvents: z.number().min(0)
});

const importSchema = z.object({
  stats: statsSchema,
  chartData: z.array(chartDataSchema),
  trends: trendDataSchema,
  metadata: metadataSchema
});

export interface ImportResult {
  success: boolean;
  data?: {
    stats: ConnectionStats;
    events: ConnectionEvent[];
  };
  error?: string;
  warnings?: string[];
}

export const importStats = async (file: File): Promise<ImportResult> => {
  try {
    const text = await file.text();
    const imported = JSON.parse(text);

    // Validate schema
    const validation = importSchema.safeParse(imported);
    if (!validation.success) {
      return {
        success: false,
        error: 'Invalid file format: ' + validation.error.issues.map((e: z.ZodIssue) => 
          `${e.path.join('.')}: ${e.message}`
        ).join(', ')
      };
    }

    // Check version compatibility
    const warnings: string[] = [];
    if (imported.metadata.version !== '1.0.0') {
      warnings.push(`Version mismatch: file version ${imported.metadata.version} may not be fully compatible`);
    }

    // Validate event timestamps are in chronological order
    const events = imported.stats.events;
    for (let i = 1; i < events.length; i++) {
      if (new Date(events[i].timestamp) < new Date(events[i-1].timestamp)) {
        return {
          success: false,
          error: 'Events are not in chronological order'
        };
      }
    }

    // Validate event sequence logic
    let lastEventType: string | null = null;
    for (const event of events as ConnectionEvent[]) {
      if (event.type === 'reconnect_success' && lastEventType !== 'reconnect_attempt') {
        warnings.push('Found reconnect_success without preceding reconnect_attempt');
      }
      if (event.type === 'reconnect_attempt' && lastEventType !== 'disconnect') {
        warnings.push('Found reconnect_attempt without preceding disconnect');
      }
      lastEventType = event.type;
    }

    // Validate metrics consistency
    const disconnects = events.filter((e: ConnectionEvent) => e.type === 'disconnect').length;
    const reconnectAttempts = events.filter((e: ConnectionEvent) => e.type === 'reconnect_attempt').length;
    const successfulReconnects = events.filter((e: ConnectionEvent) => e.type === 'reconnect_success').length;

    if (disconnects !== imported.stats.totalDisconnects) {
      warnings.push('Total disconnects count mismatch with events');
    }
    if (reconnectAttempts !== imported.stats.totalReconnectAttempts) {
      warnings.push('Total reconnect attempts count mismatch with events');
    }
    if (successfulReconnects !== imported.stats.successfulReconnects) {
      warnings.push('Successful reconnects count mismatch with events');
    }

    return {
      success: true,
      data: {
        stats: imported.stats,
        events: imported.stats.events
      },
      warnings: warnings.length > 0 ? warnings : undefined
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse import file'
    };
  }
};
