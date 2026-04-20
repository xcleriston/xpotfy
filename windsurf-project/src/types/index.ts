export type UserRole = 'doctor' | 'laboratory' | 'technician' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  name: string;
  nif: string;
  phone: string;
  address: string;
  billingAddress: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
}

export interface Client {
  id: string;
  domain: string;
  name: string;
  status: 'active' | 'inactive';
  administrators: string[];
}

export interface Order {
  id: string;
  orderId: string;
  patientName: string;
  serviceType: string;
  materialType: string;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed';
  price: number;
  dueDate: Date;
  files: OrderFile[];
  timeline: TimelineItem[];
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderFile {
  id: string;
  orderId: string;
  fileName: string;
  fileType: 'stl' | 'blend' | 'obj' | 'photo' | 'video';
  fileSize: number;
  url: string;
  uploadedAt: Date;
}

export interface TimelineItem {
  id: string;
  orderId: string;
  userId: string;
  message: string;
  type: 'text' | 'photo' | 'video' | 'stl' | 'html';
  attachments?: OrderFile[];
  createdAt: Date;
}

export interface PriceTable {
  id: string;
  serviceType: string;
  materialType: string;
  basePrice: number;
  createdAt: Date;
  updatedAt: Date;
}
