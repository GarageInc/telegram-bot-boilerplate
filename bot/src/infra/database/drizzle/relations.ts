import { relations } from "drizzle-orm/relations";
import { users } from "./schema";

export const usersRelations = relations(users, ({many}) => ({

}));


