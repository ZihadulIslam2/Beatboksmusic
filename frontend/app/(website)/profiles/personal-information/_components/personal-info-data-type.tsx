export interface User {
  _id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN" | string;
  createdAt?: string;
  updatedAt?: string;
  dob?: string | null;
  phone?: string | null;
  gender?: "male" | "female" | "other" | string;
  bio?: string;
  profileImage?: string;
  preferredGenres?: string[];
  address?: {
    country?: string;
    cityState?: string;
    roadArea?: string;
    postalCode?: string;
    taxId?: string;
  };
  subscription?: {
    status?: string;
  };
  hasActiveSubscription?: boolean;
}

export interface UserApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: User;
}
