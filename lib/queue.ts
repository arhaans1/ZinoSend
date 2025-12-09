import { Queue, Worker, Job, QueueEvents } from 'bullmq'
import IORedis from 'ioredis'

// Create Redis connection for BullMQ
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

// Queue names
export const QUEUE_NAMES = {
  BROADCAST: 'broadcast',
  MESSAGE: 'message',
  CONTACT_SYNC: 'contact-sync',
  WEBHOOK: 'webhook',
} as const

// Job types
export interface BroadcastJobData {
  broadcastId: string
  organizationId: string
}

export interface MessageJobData {
  organizationId: string
  contactId: string
  conversationId: string
  templateId?: string
  type: 'text' | 'image' | 'video' | 'document' | 'template'
  content: any
  broadcastId?: string
}

export interface ContactSyncJobData {
  organizationId: string
  direction: 'import' | 'export'
  contactIds?: string[]
}

export interface WebhookJobData {
  type: string
  payload: any
  timestamp: number
}

// Create queues
export const broadcastQueue = new Queue<BroadcastJobData>(QUEUE_NAMES.BROADCAST, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 1000,
      age: 24 * 60 * 60, // 24 hours
    },
    removeOnFail: {
      count: 5000,
      age: 7 * 24 * 60 * 60, // 7 days
    },
  },
})

export const messageQueue = new Queue<MessageJobData>(QUEUE_NAMES.MESSAGE, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      count: 10000,
      age: 24 * 60 * 60,
    },
    removeOnFail: {
      count: 10000,
      age: 7 * 24 * 60 * 60,
    },
  },
})

export const contactSyncQueue = new Queue<ContactSyncJobData>(QUEUE_NAMES.CONTACT_SYNC, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
  },
})

export const webhookQueue = new Queue<WebhookJobData>(QUEUE_NAMES.WEBHOOK, {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
})

// Queue event listeners
export const broadcastQueueEvents = new QueueEvents(QUEUE_NAMES.BROADCAST, { connection })
export const messageQueueEvents = new QueueEvents(QUEUE_NAMES.MESSAGE, { connection })

// Helper functions
export async function addBroadcastJob(data: BroadcastJobData, delay?: number) {
  return broadcastQueue.add('process-broadcast', data, {
    delay,
    jobId: `broadcast-${data.broadcastId}`,
  })
}

export async function addMessageJob(data: MessageJobData) {
  return messageQueue.add('send-message', data, {
    priority: data.broadcastId ? 10 : 1, // Lower priority for broadcast messages
  })
}

export async function addBulkMessageJobs(messages: MessageJobData[]) {
  const jobs = messages.map((data, index) => ({
    name: 'send-message',
    data,
    opts: {
      priority: 10,
      delay: index * 34, // ~30 messages per second rate limit
    },
  }))

  return messageQueue.addBulk(jobs)
}

export async function addContactSyncJob(data: ContactSyncJobData) {
  return contactSyncQueue.add('sync-contacts', data, {
    jobId: `sync-${data.organizationId}-${data.direction}-${Date.now()}`,
  })
}

export async function addWebhookJob(data: WebhookJobData) {
  return webhookQueue.add('process-webhook', data)
}

// Get queue stats
export async function getQueueStats(queueName: keyof typeof QUEUE_NAMES) {
  const queue = {
    [QUEUE_NAMES.BROADCAST]: broadcastQueue,
    [QUEUE_NAMES.MESSAGE]: messageQueue,
    [QUEUE_NAMES.CONTACT_SYNC]: contactSyncQueue,
    [QUEUE_NAMES.WEBHOOK]: webhookQueue,
  }[QUEUE_NAMES[queueName]]

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ])

  return { waiting, active, completed, failed, delayed }
}

// Graceful shutdown
export async function closeQueues() {
  await Promise.all([
    broadcastQueue.close(),
    messageQueue.close(),
    contactSyncQueue.close(),
    webhookQueue.close(),
    broadcastQueueEvents.close(),
    messageQueueEvents.close(),
    connection.quit(),
  ])
}

export { connection, Job, Worker }
