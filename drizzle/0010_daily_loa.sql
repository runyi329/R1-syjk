ALTER TABLE `stockUserPermissions` ADD `startAmount` decimal(15,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `stockUserPermissions` ADD `profitPercentage` int DEFAULT 1 NOT NULL;