CREATE TABLE `deposits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` decimal(20,8) NOT NULL,
	`network` varchar(50) NOT NULL,
	`depositAddress` varchar(255) NOT NULL,
	`txHash` varchar(255),
	`status` enum('pending','confirmed','failed') NOT NULL DEFAULT 'pending',
	`adminNotes` text,
	`reviewerId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deposits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `walletAddresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`address` varchar(255) NOT NULL,
	`network` varchar(50) NOT NULL,
	`label` varchar(100),
	`qrCodeUrl` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`adminNotes` text,
	`reviewerId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `walletAddresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `withdrawals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`walletAddressId` int NOT NULL,
	`amount` decimal(20,8) NOT NULL,
	`fee` decimal(20,8) NOT NULL,
	`actualAmount` decimal(20,8) NOT NULL,
	`network` varchar(50) NOT NULL,
	`withdrawAddress` varchar(255) NOT NULL,
	`txHash` varchar(255),
	`status` enum('pending','approved','processing','completed','rejected') NOT NULL DEFAULT 'pending',
	`rejectReason` text,
	`adminNotes` text,
	`reviewerId` int,
	`reviewedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `withdrawals_id` PRIMARY KEY(`id`)
);
