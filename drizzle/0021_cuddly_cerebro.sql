CREATE TABLE `kline_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`interval` varchar(5) NOT NULL,
	`open_time` timestamp NOT NULL,
	`open` decimal(20,8) NOT NULL,
	`high` decimal(20,8) NOT NULL,
	`low` decimal(20,8) NOT NULL,
	`close` decimal(20,8) NOT NULL,
	`volume` decimal(20,8) NOT NULL,
	`close_time` timestamp NOT NULL,
	`quote_volume` decimal(20,8) NOT NULL,
	`trades` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kline_data_id` PRIMARY KEY(`id`),
	CONSTRAINT `symbol_interval_time_idx` UNIQUE(`symbol`,`interval`,`open_time`)
);
--> statement-breakpoint
DROP TABLE `klineData`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
CREATE INDEX `symbol_interval_idx` ON `kline_data` (`symbol`,`interval`);--> statement-breakpoint
CREATE INDEX `open_time_idx` ON `kline_data` (`open_time`);