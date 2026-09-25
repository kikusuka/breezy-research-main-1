/**
 * Cloud Execution Preview Service
 * Explicitly labeled prototype for inspecting Python/Data Science code execution workflows.
 * Transparency: Simulates execution lifecycle for layout validation. No remote GPU was spun up.
 */

export interface CloudJobConfig {
  runtime: 'colab' | 'google_cloud' | 'ephemeral_sandbox';
  gpuAccelerator: 'T4' | 'P100' | 'TPU_v2' | 'CPU';
  autoPurgeMinutes: number;
  autoFixOnFailure: boolean;
}

export interface CloudJobStatus {
  id: string;
  filename: string;
  runtime: 'colab' | 'google_cloud' | 'ephemeral_sandbox';
  state: 'queued' | 'simulating' | 'succeeded' | 'failed' | 'purged';
  logs: string[];
  outputArtifacts: string[];
  executionTimeMs: number;
  memoryUsedMb: number;
  storagePurged: boolean;
  attemptCount: number;
  isSimulated: true;
}

type JobListener = (status: CloudJobStatus) => void;

class CloudExecutionService {
  private activeJobs: Map<string, CloudJobStatus> = new Map();
  private listeners: Set<JobListener> = new Set();

  public subscribe(listener: JobListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(status: CloudJobStatus) {
    this.activeJobs.set(status.id, status);
    this.listeners.forEach((fn) => fn(status));
  }

  /**
   * Preview runner for demonstrating background job lifecycle.
   * Truthful notice: Explicitly documents simulation.
   */
  public async executeInBackground(
    filename: string,
    code: string,
    config: CloudJobConfig = {
      runtime: 'colab',
      gpuAccelerator: 'T4',
      autoPurgeMinutes: 2,
      autoFixOnFailure: true,
    }
  ): Promise<CloudJobStatus> {
    const jobId = `preview_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    let status: CloudJobStatus = {
      id: jobId,
      filename,
      runtime: config.runtime,
      state: 'queued',
      isSimulated: true,
      logs: [
        `\u001b[33m[Execution Preview]\u001b[0m This is a simulated execution environment. No remote hardware was allocated.`,
        `\u001b[36m[Target Spec]\u001b[0m ${config.runtime.toUpperCase()} (${config.gpuAccelerator}) for file: ${filename}`,
        `\u001b[90m[Lifecycle Simulation] Queued job #${jobId}\u001b[0m`
      ],
      outputArtifacts: [],
      executionTimeMs: 0,
      memoryUsedMb: 0,
      storagePurged: false,
      attemptCount: 1,
    };

    this.notify(status);

    setTimeout(() => {
      status.state = 'simulating';
      status.logs.push(`\u001b[36m[Preview Simulation]\u001b[0m Validating environment schema and code payload (${code.length} bytes)...`);
      this.notify(status);

      setTimeout(() => {
        status.state = 'succeeded';
        status.executionTimeMs = 1200;
        status.memoryUsedMb = 0;
        status.logs.push(`\u001b[1m\u001b[32m[Preview Complete]\u001b[0m Simulation ended cleanly. To run code on live hardware, use local terminal or connected remote runners.`);
        this.notify(status);
      }, 1000);
    }, 600);

    return status;
  }
}

export const cloudExecutionService = new CloudExecutionService();
