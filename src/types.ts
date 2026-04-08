import { Type } from "@google/genai";

export interface Address {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface Contact {
  phone: string | null;
  email: string | null;
  website: string | null;
}

export interface TaxInfo {
  steuer_nr: string | null;
  ust_id: string | null;
}

export interface BankInfo {
  iban: string | null;
  bic: string | null;
  bank_name: string | null;
}

export interface Agency {
  id: string;
  name: string;
  legal_name: string | null;
  address: Address;
  contact: Contact;
  tax: TaxInfo;
  bank: BankInfo;
  iata_number: string | null;
  logo_path: string | null;
  working_hours: string | null;
  token_balance: number;
  created_at: string;
}

export interface Customer {
  id: string;
  customer_number: string | null;
  name: string;
  company_name: string | null;
  address: Address;
  email: string;
  phone: string | null;
  tax_number: string | null;
  age_category?: 'Adult' | 'Under 18' | 'Baby';
}

export interface Passenger {
  index: number;
  full_name: string;
  first_name: string;
  last_name: string;
  type: string; // "ADT | CHD | INF"
  age_category: string; // "adult | child | infant"
  date_of_birth: string;
  ticket_number: string;
}

export interface FlightSegment {
  segment_number: number;
  airline: string;
  flight_number: string;
  booking_class: string;
  from: {
    airport: string;
    iata: string;
  };
  to: {
    airport: string;
    iata: string;
  };
  departure_time: string;
  arrival_time: string;
}

export interface FlightDetails {
  airline: string;
  file_key: string;
  segmentsTo: FlightSegment[];
  segmentsBack: FlightSegment[];
}

export interface InvoiceMeta {
  invoice_type: string;
  invoice_number: string;
  invoice_date: string;
  booking_reference: string;
  va_reference: string;
  language: string;
}

export interface PaymentEntry {
  id: string;
  amount: number;
  method: string;
  date: string;
  status: 'paid' | 'pending';
}

export interface Hotel{
    name: string;
    location: string;
    check_in: string;
    check_out: string;
    nights: number;
    room_type: string;
    board_type: string;
    has_transfer?: boolean;
    transfer_details?: string;
    services?: string[];
    verpflegung?: Verpflegung[];
}

export interface Verpflegung {
  type: 'breakfast' | 'half_board' | 'full_board' | 'all_inclusive' | 'transfer';
  details: string;
}

export interface TravelInvoice {
  id?: string;
  invoice_meta: InvoiceMeta;
  customer: {
    customer_number: string;
    company_name: string;
    company_type: string;
    address: Address;
  };
  booking: {
    booking_date: string;
    travel_start_date: string;
    travel_end_date: string;
    services: string[];
  };
  passengers: Passenger[];
  flight_details: FlightDetails;
  hotelDto?: {
    name: string;
    location: string;
    check_in: string;
    check_out: string;
    nights: number;
    room_type: string;
    board_type: string;
    has_transfer?: boolean;
    transfer_details?: string;
    services?: string[];
    verpflegung?: Verpflegung[];
  };
  package_details?: {
    package_name: string;
    destination: string;
    duration: string;
    services: string[];
    verpflegung?: Verpflegung[];
  };
  payments: {
    payment_method: string;
    invoice_status: string; // "offen"
    invoice_total: string | number;
    invoice_paid_amount: string | number;
    invoice_balance: string | number;
    payment_date: string;
    currency: string; // "EUR"
    entries?: PaymentEntry[]; // Keep for UI compatibility
    line_items?: { name: string; amount: number }[];
  };
  baggage?: {
    departure: {
      passenger_name: string;
      checked_baggage_kg: number | null;
      cabin_baggage: {
        pieces: number | null;
        weight_kg: number | null;
      }
    },
    return: {
      passenger_name: string;
      checked_baggage_kg: number | null;
      cabin_baggage: {
        pieces: number | null;
        weight_kg: number | null;
      }
    }
  };
  legal_notes: {
    immediate_due_notice: string;
    tax_change_notice: string;
    usa_esta_notice: string;
  };
  system_meta: {
    source_type: string; // "pdf | image"
    extraction_model: string;
    extracted_at: string;
  };
   show_iata_logo?: boolean;
}

export interface BackendCustomer {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality?: string;
  passportNumber?: string;
  passportExpiry?: string;
  phone: string;
  email: string;
  postalCode: string;
  city: string;
  street: string;
  country: string;
}

export interface TokenTransaction {
  id: string;
  amount: number;
  type: 'purchase' | 'usage';
  description: string;
  created_at: string;
}

export interface UploadedDocument {
  id: string;
  filename: string;
  file_type: 'pdf' | 'image';
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  structured_data?: TravelInvoice;
}

export interface InvoiceDesignerSettings {
  logoPosition: 'left' | 'center' | 'right';
  logoSize: number;
  showIataLogo: boolean;
  companyBlockPosition: 'left' | 'right';
  customerBlockPosition: 'left' | 'right';
  sectionOrdering: string[];
  sectionVisibility: { [key: string]: boolean };
  titleCustomization: string;
  mode: 'compact' | 'spacious';
  alignment: 'left' | 'center';
  showBorders: boolean;
  showDividers: boolean;
  primaryColor: string;
  fontSize: number;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}
