CREATE TABLE `adminPermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balanceManagement` boolean NOT NULL DEFAULT false,
	`userManagement` boolean NOT NULL DEFAULT false,
	`permissionManagement` boolean NOT NULL DEFAULT false,
	`memberManagement` boolean NOT NULL DEFAULT false,
	`staffManagement` boolean NOT NULL DEFAULT false,
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adminPermissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminPermissions_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','super_admin','staff_admin') NOT NULL DEFAULT 'user';