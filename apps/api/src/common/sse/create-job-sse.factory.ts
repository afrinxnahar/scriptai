import { Observable } from 'rxjs';
import { Queue, Job } from 'bullmq';

export interface JobSSEEvent {
  state: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  message: string;
  finished: boolean;
  error?: string;
  [key: string]: unknown;
}

interface JobSSEOptions {
  queue: Queue;
  jobId: string;
  req: { on: (event: string, cb: () => void) => void };
  pollInterval?: number;
  getMessages?: Partial<Record<JobSSEEvent['state'], string>>;
  extractResult?: (job: Job) => Record<string, unknown>;
  includeLogs?: boolean;
}

const DEFAULT_MESSAGES: Record<JobSSEEvent['state'], string> = {
  waiting: 'In queue...',
  active: 'Processing...',
  completed: 'Done!',
  failed: 'Failed',
};

function mapState(rawState: string): JobSSEEvent['state'] {
  if (rawState === 'completed') return 'completed';
  if (rawState === 'failed') return 'failed';
  if (rawState === 'active') return 'active';
  return 'waiting';
}

export function createJobSSE(options: JobSSEOptions): Observable<MessageEvent> {
  const {
    queue,
    jobId,
    req,
    pollInterval = 2000,
    getMessages = {},
    extractResult,
    includeLogs = false,
  } = options;

  const messages = { ...DEFAULT_MESSAGES, ...getMessages };

  return new Observable((observer) => {
    let closed = false;

    const sendEvent = (data: JobSSEEvent) => {
      if (!closed) observer.next({ data: JSON.stringify(data) } as MessageEvent);
    };

    sendEvent({ state: 'waiting', progress: 0, message: 'Job queued...', finished: false });

    const interval = setInterval(async () => {
      if (closed) return;

      try {
        const job: Job | undefined = await queue.getJob(jobId);
        if (!job) {
          sendEvent({ state: 'failed', progress: 0, message: 'Job not found', finished: true });
          clearInterval(interval);
          observer.complete();
          return;
        }

        const rawState = await job.getState();
        const state = mapState(rawState);
        const progress = typeof job.progress === 'number' ? job.progress : 0;
        const finished = state === 'completed' || state === 'failed';

        const event: JobSSEEvent = {
          state,
          progress,
          message: messages[state],
          error: state === 'failed' ? (job.failedReason || '') : undefined,
          finished,
        };

        if (state === 'completed' && extractResult) {
          Object.assign(event, extractResult(job));
        }

        if (includeLogs) {
          const { logs } = await queue.getJobLogs(jobId, 0, 100);
          event.logs = logs;
        }

        sendEvent(event);

        if (finished) {
          clearInterval(interval);
          observer.complete();
        }
      } catch {
        sendEvent({ state: 'failed', progress: 0, message: 'Status check failed', finished: true });
        clearInterval(interval);
        observer.complete();
      }
    }, pollInterval);

    req.on('close', () => {
      closed = true;
      clearInterval(interval);
      observer.complete();
    });
  });
}
