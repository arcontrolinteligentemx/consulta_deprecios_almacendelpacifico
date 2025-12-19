export enum Region {
  NAYARIT = 'Nayarit',
  SINALOA = 'Sinaloa',
  JALISCO = 'Jalisco'
}

export enum PriceType {
  MAYOREO = 'Mayoreo',
  MENUDEO = 'Menudeo (Modelorama)'
}

export interface ProductPrice {
  productName: string;
  presentation: string; // e.g., "Lata 355ml", "Mega 1.2L"
  packType: string; // e.g., "Charola 24", "Caja 12"
  estimatedPrice: number;
  currency: string;
  notes: string;
}

export interface SearchResult {
  products: ProductPrice[];
  groundingUrls: Array<{ title: string; uri: string }>;
}