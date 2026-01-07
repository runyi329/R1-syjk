CREATE TABLE `cumulativeProfit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`amount` decimal(20,2) NOT NULL,
	`lastUpdatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cumulativeProfit_id` PRIMARY KEY(`id`)
);
