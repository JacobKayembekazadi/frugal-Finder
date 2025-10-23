export interface Place {
  title: string;
  summary: string;
  product: string;
  price: string;
  category: string;
  location: {
    latitude: number;
    longitude: number;
  };
  uri: string;
}
