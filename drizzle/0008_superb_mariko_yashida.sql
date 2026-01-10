CREATE TABLE `stockBalances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stockUserId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`balance` decimal(20,2) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stockBalances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stockUsers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`initialBalance` decimal(20,2) NOT NULL,
	`notes` text,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stockUsers_id` PRIMARY KEY(`id`)
);
