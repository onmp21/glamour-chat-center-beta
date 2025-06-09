
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface CityAssignmentsProps {
  assignedCities: string[];
  onCityToggle: (cityName: string) => void;
  isDarkMode: boolean;
}

const availableCities = [
  'Canarana',
  'Souto Soares', 
  'João Dourado',
  'América Dourada'
];

export const CityAssignments: React.FC<CityAssignmentsProps> = ({
  assignedCities,
  onCityToggle,
  isDarkMode
}) => {
  return (
    <div className="space-y-2">
      <Label className={cn(
        isDarkMode ? "text-stone-200" : "text-gray-700"
      )}>Cidades com Acesso</Label>
      <div className="space-y-2 max-h-24 overflow-y-auto border rounded p-2" style={{
        backgroundColor: isDarkMode ? '#3a3a3a' : '#f9f9f9',
        borderColor: isDarkMode ? '#686868' : '#d1d5db'
      }}>
        {availableCities.map(city => (
          <div key={city} className="flex items-center space-x-2">
            <Checkbox
              id={`city-${city}`}
              checked={assignedCities.includes(city)}
              onCheckedChange={() => onCityToggle(city)}
            />
            <Label htmlFor={`city-${city}`} className={cn(
              "text-sm",
              isDarkMode ? "text-stone-300" : "text-gray-700"
            )}>
              {city}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export { availableCities };
