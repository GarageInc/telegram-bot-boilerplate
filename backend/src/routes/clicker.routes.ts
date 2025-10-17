import { Router } from "express";
import { getStats, recordClick } from "../controllers/clicker.controller.ts";
import { validateTelegramData } from "../middleware/validateTelegram.ts";

export const clickerRouter = Router();

clickerRouter.get("/stats", validateTelegramData, getStats);
clickerRouter.post("/click", validateTelegramData, recordClick);
