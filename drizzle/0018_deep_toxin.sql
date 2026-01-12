CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`operationType` enum('create','update','delete','restore') NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`entityId` int NOT NULL,
	`beforeData` json,
	`afterData` json,
	`reason` text,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `stockUsers` ADD `isDeleted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `stockUsers` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `stockUsers` ADD `deletedBy` int;--> statement-breakpoint
ALTER TABLE `stockUsers` ADD `deleteReason` text;