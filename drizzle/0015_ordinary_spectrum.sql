CREATE TABLE `staffStockPermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffUserId` int NOT NULL,
	`stockUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int NOT NULL,
	CONSTRAINT `staffStockPermissions_id` PRIMARY KEY(`id`)
);
