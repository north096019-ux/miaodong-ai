CREATE TABLE `cats` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`breed` text DEFAULT '未知' NOT NULL,
	`age` text DEFAULT '未填写' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`cat_id` text,
	`cat_name` text DEFAULT '未命名猫咪' NOT NULL,
	`media_type` text NOT NULL,
	`file_name` text NOT NULL,
	`storage_key` text,
	`mode` text NOT NULL,
	`summary` text NOT NULL,
	`result_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`report_id` text NOT NULL,
	`helpful` integer NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
