/** Seeded catalog — swap for API later. */
export const CARS = [
  { id: 'c1', make: 'Toyota', model: 'Camry', year: 2024, category: 'Sedan' },
  { id: 'c2', make: 'Honda', model: 'Civic', year: 2023, category: 'Sedan' },
  { id: 'c3', make: 'Tesla', model: 'Model 3', year: 2024, category: 'Electric' },
  { id: 'c4', make: 'Ford', model: 'F-150', year: 2024, category: 'Truck' },
  { id: 'c5', make: 'Chevrolet', model: 'Silverado', year: 2023, category: 'Truck' },
  { id: 'c6', make: 'BMW', model: '3 Series', year: 2024, category: 'Luxury' },
  { id: 'c7', make: 'Mercedes-Benz', model: 'C-Class', year: 2023, category: 'Luxury' },
  { id: 'c8', make: 'Subaru', model: 'Outback', year: 2024, category: 'SUV' },
  { id: 'c9', make: 'Mazda', model: 'CX-5', year: 2023, category: 'SUV' },
  { id: 'c10', make: 'Hyundai', model: 'Tucson', year: 2024, category: 'SUV' },
  { id: 'c11', make: 'Kia', model: 'Telluride', year: 2024, category: 'SUV' },
  { id: 'c12', make: 'Jeep', model: 'Grand Cherokee', year: 2023, category: 'SUV' },
  { id: 'c13', make: 'Toyota', model: 'RAV4', year: 2024, category: 'SUV' },
  { id: 'c14', make: 'Honda', model: 'CR-V', year: 2023, category: 'SUV' },
  { id: 'c15', make: 'Volkswagen', model: 'Golf GTI', year: 2023, category: 'Hatchback' },
  { id: 'c16', make: 'Nissan', model: 'Altima', year: 2023, category: 'Sedan' },
  { id: 'c17', make: 'Nissan', model: 'Frontier', year: 2024, category: 'Truck' },
  { id: 'c18', make: 'Rivian', model: 'R1T', year: 2024, category: 'Electric' },
  { id: 'c19', make: 'Ford', model: 'Mustang Mach-E', year: 2023, category: 'Electric' },
  { id: 'c20', make: 'Porsche', model: '911', year: 2023, category: 'Sports' },
  { id: 'c21', make: 'Audi', model: 'A4', year: 2024, category: 'Luxury' },
  { id: 'c22', make: 'Lexus', model: 'RX', year: 2024, category: 'SUV' },
  { id: 'c23', make: 'Acura', model: 'MDX', year: 2023, category: 'SUV' },
  { id: 'c24', make: 'GMC', model: 'Sierra', year: 2024, category: 'Truck' },
  { id: 'c25', make: 'Ram', model: '1500', year: 2024, category: 'Truck' },
];

export function getCarById(id) {
  return CARS.find((c) => c.id === id);
}
