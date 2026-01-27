CREATE TABLE `marketDataCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symbol` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`price` decimal(20,8) NOT NULL,
	`change` decimal(20,8) NOT NULL,
	`changePercent` decimal(10,4) NOT NULL,
	`region` varchar(10) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketDataCache_id` PRIMARY KEY(`id`)
);
