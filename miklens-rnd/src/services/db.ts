import { collection, CollectionReference } from 'firebase/firestore';
import { db } from '../config/firebase';

// Types (normally would be in a separate types/ folder)
export interface Employee {
  id?: string;
  name: string;
  designation: string;
  department: string;
  email: string;
  skills: string[];
  projects: number;
  avatar?: string;
}

export interface Product {
  id?: string;
  name: string;
  category: string;
  stage: string;
  status: string;
  progress: number;
  teamSize: number;
  lastUpdate: string;
}

// Strongly typed collection references
export const employeesCollection = collection(db, 'users') as CollectionReference<Employee>;
export const productsCollection = collection(db, 'products') as CollectionReference<Product>;
