CREATE TABLE `passwordResets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`token` varchar(128) NOT NULL,
	`codeHash` varchar(255) NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`failureCount` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passwordResets_id` PRIMARY KEY(`id`),
	CONSTRAINT `passwordResets_token_unique` UNIQUE(`token`)
);
