CREATE TABLE `stockUserPermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stockUserId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stockUserPermissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_permission` UNIQUE(`stockUserId`,`userId`)
);
--> statement-breakpoint
CREATE INDEX `stockUserId_idx` ON `stockUserPermissions` (`stockUserId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `stockUserPermissions` (`userId`);