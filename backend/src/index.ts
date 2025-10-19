import express from "express";
import cors from "cors";
import { createServices } from "./services/index.ts";
import { createClickerRouter } from "./routes/clicker.routes.ts";
import { createPostRouter } from "./routes/post.routes.ts";
import { errorHandler } from "./middleware/errorHandler.ts";

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
	res.json({ status: "ok", database: "connected" });
});

// Initialize services and routes
const services = await createServices();

// Routes with dependency injection
app.use("/api/clicker", createClickerRouter(services));
app.use("/api/posts", createPostRouter(services));

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
	console.log(`Backend server running on port ${PORT}`);
});
