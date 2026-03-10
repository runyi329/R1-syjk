CREATE TABLE `polymarketEnabled` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coin` enum('BTC','ETH') NOT NULL,
	`groupKey` varchar(512) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `polymarketEnabled_id` PRIMARY KEY(`id`),
	CONSTRAINT `coin_group_key_idx` UNIQUE(`coin`,`groupKey`)
);
