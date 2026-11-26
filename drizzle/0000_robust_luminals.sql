CREATE TABLE `tbl_account` (
	`ac_id` int AUTO_INCREMENT NOT NULL,
	`ac_cid` varchar(13) NOT NULL,
	`ac_password` varchar(255),
	`ac_username` varchar(100),
	`ac_hn` varchar(20),
	`ac_pname` varchar(50),
	`ac_fname` varchar(150),
	`ac_lname` varchar(150),
	`ac_pname_eng` varchar(50),
	`ac_fname_eng` varchar(150),
	`ac_lname_eng` varchar(150),
	`ac_email` varchar(255),
	`ac_phone_number` varchar(20),
	`ac_address` text,
	`ac_birthday` date,
	`dep_id` int,
	`ps_id` int,
	`ps_type_id` int,
	`ac_certificate_number` varchar(100),
	`img_profile` varchar(500),
	`rfid` varchar(100),
	`level` int NOT NULL DEFAULT 1,
	`ac_active` tinyint NOT NULL DEFAULT 1,
	`ac_role` enum('admin','member','user') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tbl_account_ac_id` PRIMARY KEY(`ac_id`),
	CONSTRAINT `uq_account_cid` UNIQUE(`ac_cid`),
	CONSTRAINT `uq_account_username` UNIQUE(`ac_username`)
);
--> statement-breakpoint
CREATE TABLE `tbl_position` (
	`ps_id` int AUTO_INCREMENT NOT NULL,
	`ps_name` varchar(255) NOT NULL,
	CONSTRAINT `tbl_position_ps_id` PRIMARY KEY(`ps_id`),
	CONSTRAINT `uq_tbl_position_ps_name` UNIQUE(`ps_name`)
);
--> statement-breakpoint
CREATE TABLE `tbl_department` (
	`dep_id` int AUTO_INCREMENT NOT NULL,
	`dep_name` varchar(255) NOT NULL,
	`dep_phone` varchar(20),
	CONSTRAINT `tbl_department_dep_id` PRIMARY KEY(`dep_id`),
	CONSTRAINT `uq_tbl_department_dep_name` UNIQUE(`dep_name`)
);
--> statement-breakpoint
CREATE INDEX `idx_account_hn` ON `tbl_account` (`ac_hn`);--> statement-breakpoint
CREATE INDEX `idx_account_department` ON `tbl_account` (`dep_id`);--> statement-breakpoint
CREATE INDEX `idx_account_position` ON `tbl_account` (`ps_id`);--> statement-breakpoint
CREATE INDEX `idx_account_active` ON `tbl_account` (`ac_active`);--> statement-breakpoint
CREATE INDEX `idx_account_role` ON `tbl_account` (`ac_role`);