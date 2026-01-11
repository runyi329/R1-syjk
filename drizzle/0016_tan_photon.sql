CREATE TABLE `siteConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`logoUrl` text,
	`siteTitle` varchar(255),
	`siteDescription` text,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteConfigs_id` PRIMARY KEY(`id`)
);
