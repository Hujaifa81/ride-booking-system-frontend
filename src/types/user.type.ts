export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isVerified: boolean;
  isActive: string;
  createdAt: string;
  imageUrl?: string;
}

export interface IUpdateUserRequest {
  userId: string;
  body: Partial<{
    name: string;
    phone: string;
    role: string;
    isActive: string;
    isDeleted: boolean;
    isVerified: boolean;
    address: string;
  }>;
}