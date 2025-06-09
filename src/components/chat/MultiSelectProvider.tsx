
import React, { createContext, useContext, useState } from 'react';

interface MultiSelectContextType {
  selectedItems: string[];
  isMultiSelectMode: boolean;
  toggleMultiSelect: () => void;
  toggleItem: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  deleteSelected: () => void;
}

const MultiSelectContext = createContext<MultiSelectContextType | undefined>(undefined);

export const MultiSelectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  const toggleMultiSelect = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    if (isMultiSelectMode) {
      setSelectedItems([]);
    }
  };

  const toggleItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const selectAll = (ids: string[]) => {
    setSelectedItems(ids);
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const deleteSelected = () => {
    console.log('Deletando itens selecionados:', selectedItems);
    // TODO: Implementar lógica de deleção
    setSelectedItems([]);
    setIsMultiSelectMode(false);
  };

  return (
    <MultiSelectContext.Provider value={{
      selectedItems,
      isMultiSelectMode,
      toggleMultiSelect,
      toggleItem,
      selectAll,
      clearSelection,
      deleteSelected
    }}>
      {children}
    </MultiSelectContext.Provider>
  );
};

export const useMultiSelect = () => {
  const context = useContext(MultiSelectContext);
  if (context === undefined) {
    throw new Error('useMultiSelect must be used within a MultiSelectProvider');
  }
  return context;
};
