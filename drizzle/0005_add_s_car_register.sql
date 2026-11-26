CREATE TABLE `car_register` (
	`car_id` int AUTO_INCREMENT NOT NULL,
	`car_license` varchar(150) NOT NULL,
	`car_province` varchar(255) NOT NULL,
	`c_brand_id` int NOT NULL,
	`car_model` varchar(255) NOT NULL,
	`car_color` varchar(255) NOT NULL,
	`car_type_id` int NOT NULL,
	`car_print_status` int NOT NULL DEFAULT 0,
	`ac_id` int NOT NULL,
	CONSTRAINT `car_register_car_id` PRIMARY KEY(`car_id`),
	CONSTRAINT `uq_car_license_province` UNIQUE(`car_license`,`car_province`)
);
--> statement-breakpoint
ALTER TABLE `car_register` ADD CONSTRAINT `car_register_c_brand_id_car_brand_c_brand_id_fk` FOREIGN KEY (`c_brand_id`) REFERENCES `car_brand`(`c_brand_id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `idx_car_brand` ON `car_register` (`c_brand_id`);--> statement-breakpoint
CREATE INDEX `idx_car_type` ON `car_register` (`car_type_id`);--> statement-breakpoint
CREATE INDEX `idx_car_account` ON `car_register` (`ac_id`);