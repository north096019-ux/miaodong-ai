import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const cats = sqliteTable("cats", {
  id: text("id").primaryKey(), name: text("name").notNull(),
  breed: text("breed").notNull().default("未知"), age: text("age").notNull().default("未填写"),
  notes: text("notes").notNull().default(""), createdAt: text("created_at").notNull(),
});

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(), catId: text("cat_id"),
  catName: text("cat_name").notNull().default("未命名猫咪"), mediaType: text("media_type").notNull(),
  fileName: text("file_name").notNull(), storageKey: text("storage_key"), mode: text("mode").notNull(),
  summary: text("summary").notNull(), resultJson: text("result_json").notNull(), createdAt: text("created_at").notNull(),
});

export const feedback = sqliteTable("feedback", {
  id: text("id").primaryKey(), reportId: text("report_id").notNull(),
  helpful: integer("helpful", { mode: "boolean" }).notNull(), note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull(),
});
