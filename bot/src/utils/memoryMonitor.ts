/**
 * Memory monitoring utility for detecting memory leaks in production
 */

interface MemoryStats {
	rss: number; // Resident Set Size (total memory)
	heapTotal: number;
	heapUsed: number;
	external: number;
	arrayBuffers: number;
	timestamp: number;
}

interface MemoryTrend {
	samples: MemoryStats[];
	maxSamples: number;
	intervalMs: number;
	intervalId?: ReturnType<typeof setInterval>;
}

export class MemoryMonitor {
	private trend: MemoryTrend;
	private alertThresholdMB: number;
	private onAlert?: (stats: MemoryStats, message: string) => void;

	constructor(options: {
		maxSamples?: number;
		intervalMs?: number;
		alertThresholdMB?: number;
		onAlert?: (stats: MemoryStats, message: string) => void;
	} = {}) {
		this.trend = {
			samples: [],
			maxSamples: options.maxSamples || 100, // Keep last 100 samples
			intervalMs: options.intervalMs || 60000, // Sample every minute
		};
		this.alertThresholdMB = options.alertThresholdMB || 400; // Alert at 400MB
		this.onAlert = options.onAlert;
	}

	/**
	 * Get current memory usage
	 */
	getCurrentMemory(): MemoryStats {
		const usage = process.memoryUsage();
		return {
			rss: usage.rss,
			heapTotal: usage.heapTotal,
			heapUsed: usage.heapUsed,
			external: usage.external,
			arrayBuffers: usage.arrayBuffers,
			timestamp: Date.now(),
		};
	}

	/**
	 * Format memory size in human-readable format
	 */
	formatBytes(bytes: number): string {
		const mb = bytes / 1024 / 1024;
		return `${mb.toFixed(2)} MB`;
	}

	/**
	 * Log current memory usage
	 */
	logMemory(): void {
		const stats = this.getCurrentMemory();
		console.log("📊 Memory Usage:");
		console.log(`   RSS:          ${this.formatBytes(stats.rss)}`);
		console.log(`   Heap Total:   ${this.formatBytes(stats.heapTotal)}`);
		console.log(`   Heap Used:    ${this.formatBytes(stats.heapUsed)}`);
		console.log(`   External:     ${this.formatBytes(stats.external)}`);
		console.log(`   Array Buffers: ${this.formatBytes(stats.arrayBuffers)}`);

		// Check if we're approaching memory limit
		const heapUsedMB = stats.heapUsed / 1024 / 1024;
		if (heapUsedMB > this.alertThresholdMB) {
			const message = `⚠️ High memory usage detected: ${this.formatBytes(stats.heapUsed)}`;
			console.warn(message);
			if (this.onAlert) {
				this.onAlert(stats, message);
			}
		}
	}

	/**
	 * Record current memory usage for trend analysis
	 */
	recordSample(): void {
		const stats = this.getCurrentMemory();
		this.trend.samples.push(stats);

		// Keep only the last N samples
		if (this.trend.samples.length > this.trend.maxSamples) {
			this.trend.samples.shift();
		}
	}

	/**
	 * Analyze memory trends to detect potential leaks
	 */
	analyzeTrends(): {
		isLeaking: boolean;
		growthRateMBPerHour: number;
		message: string;
	} {
		if (this.trend.samples.length < 10) {
			return {
				isLeaking: false,
				growthRateMBPerHour: 0,
				message: "Not enough samples for analysis",
			};
		}

		// Calculate memory growth rate
		const first = this.trend.samples[0];
		const last = this.trend.samples[this.trend.samples.length - 1];
		const timeDiffHours = (last.timestamp - first.timestamp) / (1000 * 60 * 60);
		const memoryDiffMB = (last.heapUsed - first.heapUsed) / 1024 / 1024;
		const growthRateMBPerHour = memoryDiffMB / timeDiffHours;

		// Consider it a leak if memory is growing > 10MB/hour consistently
		const isLeaking = growthRateMBPerHour > 10;

		let message = `Memory growth rate: ${growthRateMBPerHour.toFixed(2)} MB/hour`;
		if (isLeaking) {
			message = `⚠️ Potential memory leak detected! ${message}`;
		}

		return { isLeaking, growthRateMBPerHour, message };
	}

	/**
	 * Start monitoring memory periodically
	 */
	startMonitoring(): void {
		if (this.trend.intervalId) {
			console.warn("Memory monitoring already started");
			return;
		}

		console.log(`📈 Starting memory monitoring (interval: ${this.trend.intervalMs}ms)`);

		this.trend.intervalId = setInterval(() => {
			this.recordSample();
			this.logMemory();

			// Analyze trends every 10 samples
			if (this.trend.samples.length % 10 === 0) {
				const analysis = this.analyzeTrends();
				console.log(analysis.message);

				if (analysis.isLeaking && this.onAlert) {
					this.onAlert(this.getCurrentMemory(), analysis.message);
				}
			}
		}, this.trend.intervalMs);
	}

	/**
	 * Stop monitoring
	 */
	stopMonitoring(): void {
		if (this.trend.intervalId) {
			clearInterval(this.trend.intervalId);
			this.trend.intervalId = undefined;
			console.log("📉 Memory monitoring stopped");
		}
	}

	/**
	 * Get statistics summary
	 */
	getSummary(): {
		currentMemoryMB: number;
		avgMemoryMB: number;
		maxMemoryMB: number;
		minMemoryMB: number;
		sampleCount: number;
	} {
		if (this.trend.samples.length === 0) {
			const current = this.getCurrentMemory();
			const currentMB = current.heapUsed / 1024 / 1024;
			return {
				currentMemoryMB: currentMB,
				avgMemoryMB: currentMB,
				maxMemoryMB: currentMB,
				minMemoryMB: currentMB,
				sampleCount: 0,
			};
		}

		const heapUsedSamples = this.trend.samples.map(s => s.heapUsed / 1024 / 1024);
		const currentMB = this.getCurrentMemory().heapUsed / 1024 / 1024;

		return {
			currentMemoryMB: currentMB,
			avgMemoryMB: heapUsedSamples.reduce((a, b) => a + b, 0) / heapUsedSamples.length,
			maxMemoryMB: Math.max(...heapUsedSamples),
			minMemoryMB: Math.min(...heapUsedSamples),
			sampleCount: this.trend.samples.length,
		};
	}

	/**
	 * Force garbage collection (if --expose-gc flag is set)
	 */
	forceGC(): void {
		if (global.gc) {
			console.log("🗑️  Forcing garbage collection...");
			const before = this.getCurrentMemory();
			global.gc();
			const after = this.getCurrentMemory();
			const freed = (before.heapUsed - after.heapUsed) / 1024 / 1024;
			console.log(`   Freed ${freed.toFixed(2)} MB`);
		} else {
			console.log("⚠️  Garbage collection not available (run with --expose-gc)");
		}
	}

	/**
	 * Get heap snapshot (requires v8 module)
	 */
	async takeHeapSnapshot(filename: string): Promise<void> {
		try {
			const v8 = await import("v8");
			const fs = await import("fs");
			const writeStream = fs.createWriteStream(filename);
			v8.writeHeapSnapshot(filename);
			console.log(`📸 Heap snapshot saved to: ${filename}`);
		} catch (error) {
			console.error("Failed to take heap snapshot:", error);
		}
	}
}

export const createMemoryMonitor = (options?: {
	maxSamples?: number;
	intervalMs?: number;
	alertThresholdMB?: number;
	onAlert?: (stats: MemoryStats, message: string) => void;
}) => new MemoryMonitor(options);

