const RATE_LIMIT = 20; // 20 messages per second to be safe
const RETRY_DELAY = 5000; // 5 seconds delay between retries

import Queue from "bull";
import { BOT_TOKEN, QUEUE_REDIS_URL } from "../../../shared/env.ts";

interface SendMessageJob {
	userId: string;
	message: string;
	botToken: string;
	messageId?: string;
	replyMarkup?: any; // Add support for keyboard markup
}

export interface NotificationService {
	queueMessages(messages: Array<{ userId: string; message: string; replyMarkup?: any }>): Promise<void>;
	getQueueStatus(): Promise<{
		waiting: number;
		active: number;
		completed: number;
		failed: number;
	}>;
	close(): Promise<void>;
}

export function makeNotificationService(): NotificationService {
	// Create the notification queue
	// 🔧 FIX: Add proper job retention limits to prevent memory leaks
	const notificationQueue = new Queue<SendMessageJob>("notifications", {
		redis: {
			host: QUEUE_REDIS_URL.hostname,
			port: Number(QUEUE_REDIS_URL.port),
			password: QUEUE_REDIS_URL.password,
		},
		defaultJobOptions: {
			attempts: 3,
			// 🔧 FIX: Limit retention of completed jobs
			removeOnComplete: {
				age: 3600, // Keep completed jobs for 1 hour only
				count: 100, // Keep max 100 completed jobs
			},
			// 🔧 FIX: Limit retention of failed jobs
			removeOnFail: {
				age: 86400, // Keep failed jobs for 24 hours for debugging
				count: 50, // Keep max 50 failed jobs
			},
			backoff: {
				type: "exponential",
				delay: RETRY_DELAY,
			},
		},
	});

	// Process messages with rate limiting
	notificationQueue.process("sendMessageForUsers", 20, async (job: any) => {
		const { userId, message, botToken, messageId, replyMarkup } = job.data;

		try {
			console.log(
				`Attempting to send message ${messageId} to user ${userId} (attempt ${job.attemptsMade + 1}/${job.opts.attempts})`,
			);

			const requestBody: any = {
				chat_id: userId,
				text: message,
				parse_mode: "HTML",
			};

			// Add reply_markup if provided
			if (replyMarkup) {
				requestBody.reply_markup = replyMarkup;
			}

			const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const error = await response.text();
				// Check for rate limit error (429)
				if (response.status === 429) {
					console.warn(`Rate limit hit for message ${messageId}. Retrying with backoff...`);
					// Add extra delay for rate limit errors
					await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * 2));
				}
				throw new Error(`Telegram API error: ${error}`);
			}

			console.log(`Successfully sent message ${messageId} to user ${userId}`);
			// Add delay between messages to respect rate limit
			await new Promise(resolve => setTimeout(resolve, 1000 / RATE_LIMIT));
		} catch (error) {
			console.error(`Failed to send message ${messageId} to user ${userId}:`, error);
			throw error;
		}
	});

	// Handle queue events for monitoring
	notificationQueue.on("completed", (job: any) => {
		console.log(`Job ${job.id} completed successfully`);
	});

	notificationQueue.on("failed", (job: any, err: any) => {
		console.error(`Job ${job.id} failed:`, err.message);
	});

	notificationQueue.on("error", (error: any) => {
		console.error("Queue error:", error);
	});

	return {
		async queueMessages(messages: Array<{ userId: string; message: string; replyMarkup?: any }>): Promise<void> {
			const jobs = messages.map(msg => ({
				userId: msg.userId,
				message: msg.message,
				botToken: BOT_TOKEN,
				messageId: `${msg.userId}-${Date.now()}`, // Generate unique messageId
				replyMarkup: msg.replyMarkup, // Include reply markup if provided
			}));

			await notificationQueue.addBulk(
				jobs.map(job => ({
					name: "sendMessageForUsers",
					data: job,
					opts: {
						attempts: 3,
						jobId: job.messageId, // Use messageId as jobId for deduplication
						removeOnComplete: true,
						removeOnFail: true,
						backoff: {
							type: "exponential",
							delay: RETRY_DELAY,
						},
					},
				})),
			);
		},

		async getQueueStatus(): Promise<{
			waiting: number;
			active: number;
			completed: number;
			failed: number;
		}> {
			const [waiting, active, completed, failed] = await Promise.all([
				notificationQueue.getWaitingCount(),
				notificationQueue.getActiveCount(),
				notificationQueue.getCompletedCount(),
				notificationQueue.getFailedCount(),
			]);

			return { waiting, active, completed, failed };
		},

		async close(): Promise<void> {
			await notificationQueue.close();
		},
	};
}
