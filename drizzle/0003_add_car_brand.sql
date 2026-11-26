CREATE TABLE `car_brand` (
	`c_brand_id` int AUTO_INCREMENT NOT NULL,
	`c_brand_name` varchar(255) NOT NULL,
	CONSTRAINT `car_brand_c_brand_id` PRIMARY KEY(`c_brand_id`),
	CONSTRAINT `uq_car_brand_name` UNIQUE(`c_brand_name`)
);
