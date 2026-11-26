CREATE TABLE `car_type` (
	`car_type_id` int AUTO_INCREMENT NOT NULL,
	`car_type_name` varchar(255) NOT NULL,
	CONSTRAINT `car_type_car_type_id` PRIMARY KEY(`car_type_id`),
	CONSTRAINT `uq_car_type_name` UNIQUE(`car_type_name`)
);
