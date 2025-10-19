import mongoose from "mongoose";

let isConnected = false;

export async function connectMongoDB(mongoUrl: string): Promise<typeof mongoose> {
	if (isConnected) {
		return mongoose;
	}

	try {
		const connection = await mongoose.connect(mongoUrl, {
			// Connection options
			maxPoolSize: 10,
			minPoolSize: 2,
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
		});

		isConnected = true;
		console.log("✅ MongoDB connected successfully");

		// Handle connection events
		mongoose.connection.on("error", (error) => {
			console.error("MongoDB connection error:", error);
			isConnected = false;
		});

		mongoose.connection.on("disconnected", () => {
			console.log("MongoDB disconnected");
			isConnected = false;
		});

		return connection;
	} catch (error) {
		console.error("Failed to connect to MongoDB:", error);
		throw error;
	}
}

export async function disconnectMongoDB(): Promise<void> {
	if (!isConnected) {
		return;
	}

	try {
		await mongoose.disconnect();
		isConnected = false;
		console.log("MongoDB disconnected");
	} catch (error) {
		console.error("Error disconnecting from MongoDB:", error);
		throw error;
	}
}

export function isMongoConnected(): boolean {
	return isConnected;
}

