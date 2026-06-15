import React, { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Plus, Trash2, ChevronRight, ChevronDown, Layers } from 'lucide-react';
import { ResponseField } from './APIBuilder';
import { cn } from '@/app/components/ui/utils';

interface ResponseSchemaEditorProps {
  fields: ResponseField[];
  onChange: (fields: ResponseField[]) => void;
  level?: number;
}

export function ResponseSchemaEditor({ fields, onChange, level = 0 }: ResponseSchemaEditorProps) {
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedFields(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFieldChange = (index: number, updates: Partial<ResponseField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    
    // If type changes to object or array, initialize children if empty
    if ((updates.type === 'object' || updates.type === 'array') && !newFields[index].children) {
      newFields[index].children = [];
      setExpandedFields(prev => ({ ...prev, [newFields[index].id]: true }));
    }
    
    onChange(newFields);
  };

  const handleAddChild = (index: number) => {
    const newFields = [...fields];
    const parent = newFields[index];
    
    if (!parent.children) parent.children = [];
    
    parent.children.push({
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: 'new_field',
      type: 'string',
      description: '',
      example: ''
    });
    
    setExpandedFields(prev => ({ ...prev, [parent.id]: true }));
    onChange(newFields);
  };

  const handleRemoveField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    onChange(newFields);
  };

  const handleChildrenChange = (index: number, newChildren: ResponseField[]) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], children: newChildren };
    onChange(newFields);
  };

  return (
    <div className="space-y-2">
      {fields.map((field, index) => {
        const isComplex = field.type === 'object' || field.type === 'array';
        const isExpanded = expandedFields[field.id];

        return (
          <div key={field.id} className="space-y-2">
            <div 
              className={cn(
                "flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors",
                level > 0 && "ml-6 border-l-4 border-l-muted"
              )}
            >
              {isComplex ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => toggleExpand(field.id)}
                >
                  {isExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                </Button>
              ) : (
                <div className="w-6 shrink-0" />
              )}
              
              <div className="flex-1 grid grid-cols-[2fr_1.5fr_2fr_1.5fr] gap-2 items-center">
                <Input
                  value={field.name}
                  onChange={(e) => handleFieldChange(index, { name: e.target.value })}
                  placeholder="Field Name"
                  className="h-8"
                />
                
                <Select
                  value={field.type}
                  onValueChange={(value) => handleFieldChange(index, { type: value })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="object">Object</SelectItem>
                    <SelectItem value="array">Array</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  value={field.description || ''}
                  onChange={(e) => handleFieldChange(index, { description: e.target.value })}
                  placeholder="Description"
                  className="h-8"
                />

                <Input
                  value={field.example || ''}
                  onChange={(e) => handleFieldChange(index, { example: e.target.value })}
                  placeholder="Example"
                  className="h-8"
                  disabled={isComplex}
                />
              </div>

              <div className="flex items-center gap-1">
                {isComplex && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-500"
                    onClick={() => handleAddChild(index)}
                    title="Add Child Field"
                  >
                    <Plus className="size-4" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500"
                  onClick={() => handleRemoveField(index)}
                  title="Remove Field"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            {isComplex && isExpanded && field.children && (
              <ResponseSchemaEditor
                fields={field.children}
                onChange={(newChildren) => handleChildrenChange(index, newChildren)}
                level={level + 1}
              />
            )}
          </div>
        );
      })}
      
      {fields.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <Layers className="size-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No fields defined</p>
        </div>
      )}
    </div>
  );
}
