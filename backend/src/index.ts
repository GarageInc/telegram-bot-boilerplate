import express from "express";
import cors from "cors";
import { clickerRouter } from "./routes/clicker.routes.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { initServices } from "./services/index.ts";

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
await initServices();

// Health check
app.get("/health", (req, res) => {
	res.json({ status: "ok", database: "connected" });
});

// Routes
app.use("/api/clicker", clickerRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
	console.log(`Backend server running on port ${PORT}`);
});
