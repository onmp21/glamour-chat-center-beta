
import React, { useState } from 'react';
import { ApiInstance } from '../../types/domain/api/ApiInstance';

interface ApiInstanceFormProps {
  onSubmit: (instance: ApiInstance) => void;
  onCancel: () => void;
  initialData?: Partial<ApiInstance>;
}

export const ApiInstanceForm: React.FC<ApiInstanceFormProps> = ({
  onSubmit,
  onCancel,
  initialData = {}
}) => {
  const [formData, setFormData] = useState({
    instance_name: initialData.instance_name || '',
    base_url: initialData.base_url || '',
    api_key: initialData.api_key || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.instance_name.trim()) {
      newErrors.instance_name = 'Nome da instância é obrigatório';
    }

    if (!formData.base_url.trim()) {
      newErrors.base_url = 'URL base é obrigatória';
    } else if (!formData.base_url.startsWith('http')) {
      newErrors.base_url = 'URL deve começar com http:// ou https://';
    }

    if (!formData.api_key.trim()) {
      newErrors.api_key = 'Chave da API é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData as ApiInstance);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome da Instância *
        </label>
        <input
          type="text"
          value={formData.instance_name}
          onChange={(e) => handleInputChange('instance_name', e.target.value)}
          className={`w-full p-2 border rounded-md ${
            errors.instance_name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Ex: Instância Principal"
        />
        {errors.instance_name && (
          <p className="text-red-500 text-xs mt-1">{errors.instance_name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL Base da API *
        </label>
        <input
          type="url"
          value={formData.base_url}
          onChange={(e) => handleInputChange('base_url', e.target.value)}
          className={`w-full p-2 border rounded-md ${
            errors.base_url ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Ex: https://api.evolution.com"
        />
        {errors.base_url && (
          <p className="text-red-500 text-xs mt-1">{errors.base_url}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Chave da API *
        </label>
        <input
          type="password"
          value={formData.api_key}
          onChange={(e) => handleInputChange('api_key', e.target.value)}
          className={`w-full p-2 border rounded-md ${
            errors.api_key ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Sua chave da API Evolution"
        />
        {errors.api_key && (
          <p className="text-red-500 text-xs mt-1">{errors.api_key}</p>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};
