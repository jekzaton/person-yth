export type CarTypeItem = {
  car_type_id: number;
  car_type_name: string;
};

export interface CarRow {
  car_id: number;
  car_license: string;
  car_province: string;

  c_brand_id: number;
  brand_name?: string | null;

  car_model: string;
  car_color: string;

  car_type_id: number;
  type_name?: string | null;

  car_print_status: number;

  ac_id: number;
  account_name?: string | null;
}

export type CarItem = CarRow;

export interface LookupOption {
  id: number;
  name: string;
}

export interface CarLookups {
  brands: LookupOption[];
  types: LookupOption[];
  accounts: LookupOption[];
}

export interface CarFormData {
  car_license: string;
  car_province: string;
  c_brand_id: number;
  car_model: string;
  car_color: string;
  car_type_id: number;
  ac_id: number;
}

/** ข้อมูลใน Form ก่อนแปลงเป็นตัวเลข */
export interface CarFormValues {
  car_license: string;
  car_province: string;
  c_brand_id: string;
  car_model: string;
  car_color: string;
  car_type_id: string;
  ac_id: string;
}

/** ฟิลด์ที่สามารถแสดง Validation Error */
export type CarFormErrors = Partial<Record<keyof CarFormValues, string>>;

export interface CarApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
  details?: unknown;
}

export type CarListResponse = CarApiResponse<CarRow[]>;

export type CarDetailResponse = CarApiResponse<CarRow>;

export type CarOptionsResponse = CarApiResponse<CarLookups>;

export const CARS_PAGE_SIZES = [5, 10, 50, 100] as const;

export type CarsPageSize = (typeof CARS_PAGE_SIZES)[number];

export const INITIAL_CAR_FORM: CarFormValues = {
  car_license: "",
  car_province: "",
  c_brand_id: "",
  car_model: "",
  car_color: "",
  car_type_id: "",
  ac_id: "",
};

export const INITIAL_CAR_LOOKUPS: CarLookups = {
  brands: [],
  types: [],
  accounts: [],
};
