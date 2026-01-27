CREATE TABLE `fetchTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`interval` varchar(5) NOT NULL,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`fetchedCount` int NOT NULL DEFAULT 0,
	`totalCount` int NOT NULL DEFAULT 0,
	`currentTime` timestamp,
	`errorMessage` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fetchTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `klineData` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`interval` varchar(5) NOT NULL,
	`openTime` timestamp NOT NULL,
	`open` decimal(20,8) NOT NULL,
	`high` decimal(20,8) NOT NULL,
	`low` decimal(20,8) NOT NULL,
	`close` decimal(20,8) NOT NULL,
	`volume` decimal(20,8) NOT NULL,
	`closeTime` timestamp NOT NULL,
	`quoteVolume` decimal(20,8) NOT NULL,
	`trades` int NOT NULL,
	`takerBuyVolume` decimal(20,8) NOT NULL,
	`takerBuyQuoteVolume` decimal(20,8) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `klineData_id` PRIMARY KEY(`id`),
	CONSTRAINT `symbol_interval_time_idx` UNIQUE(`symbol`,`interval`,`openTime`)
);
--> statement-breakpoint
CREATE INDEX `symbol_interval_idx` ON `klineData` (`symbol`,`interval`);--> statement-breakpoint
CREATE INDEX `open_time_idx` ON `klineData` (`openTime`);