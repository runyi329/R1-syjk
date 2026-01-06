CREATE TABLE `captchas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(128) NOT NULL,
	`answerHash` varchar(255) NOT NULL,
	`type` enum('puzzle') NOT NULL DEFAULT 'puzzle',
	`verified` boolean NOT NULL DEFAULT false,
	`failureCount` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `captchas_id` PRIMARY KEY(`id`),
	CONSTRAINT `captchas_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `loginAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`ipAddress` varchar(45) NOT NULL,
	`success` boolean NOT NULL DEFAULT false,
	`failureReason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `loginAttempts_id` PRIMARY KEY(`id`)
);
