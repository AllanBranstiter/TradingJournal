'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ColumnMapperProps {
  csvHeaders: string[]
  previewData: any[]
  mapping: Record<string, string>
  onMappingChange: (mapping: Record<string, string>) => void
  onConfirm: () => void
  onBack: () => void
}

const DATABASE_FIELDS = [
  { key: 'ticker', label: 'Ticker', required: true },
  { key: 'direction', label: 'Direction (Long/Short)', required: true },
  { key: 'entry_date', label: 'Entry Date', required: true },
  { key: 'entry_price', label: 'Entry Price', required: true },
  { key: 'quantity', label: 'Quantity', required: true },
  { key: 'exit_date', label: 'Exit Date', required: false },
  { key: 'exit_price', label: 'Exit Price', required: false },
  { key: 'commissions', label: 'Commissions/Fees', required: false },
]

export function ColumnMapper({
  csvHeaders,
  previewData,
  mapping,
  onMappingChange,
  onConfirm,
  onBack,
}: ColumnMapperProps) {
  const [localMapping, setLocalMapping] = useState<Record<string, string>>(mapping)

  const handleMappingChange = (dbField: string, csvColumn: string) => {
    const newMapping = { ...localMapping }
    if (csvColumn === '') {
      delete newMapping[dbField]
    } else {
      newMapping[dbField] = csvColumn
    }
    setLocalMapping(newMapping)
    onMappingChange(newMapping)
  }

  const getMappedValue = (row: any, dbField: string): string => {
    const csvColumn = localMapping[dbField]
    if (!csvColumn) return '—'
    return row[csvColumn] || '—'
  }

  const requiredFields = DATABASE_FIELDS.filter(f => f.required)
  const missingRequired = requiredFields.filter(f => !localMapping[f.key])
  const canProceed = missingRequired.length === 0

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="rounded-lg bg-background-secondary p-4">
        <p className="text-sm text-text-secondary">
          Map your CSV columns to the required database fields. Fields marked with{' '}
          <span className="text-accent-danger">*</span> are required.
        </p>
      </div>

      {/* Mapping Table */}
      <div className="space-y-4">
        <h3 className="font-semibold">Column Mapping</h3>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-background-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Database Field
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  CSV Column
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {DATABASE_FIELDS.map((field) => (
                <tr key={field.key} className="hover:bg-background-secondary/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {field.label}
                      </span>
                      {field.required && (
                        <span className="text-accent-danger">*</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={localMapping[field.key] || ''}
                      onChange={(e) => handleMappingChange(field.key, e.target.value)}
                      className={cn(
                        'w-full rounded-md border px-3 py-2 text-sm',
                        'bg-background-primary',
                        'focus:outline-none focus:ring-2 focus:ring-accent-info',
                        field.required && !localMapping[field.key]
                          ? 'border-accent-danger'
                          : 'border-border'
                      )}
                    >
                      <option value="">-- Select Column --</option>
                      {csvHeaders.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Missing Required Fields Warning */}
      {missingRequired.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-accent-danger bg-accent-danger/10 p-4">
          <AlertCircle className="h-5 w-5 text-accent-danger flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-accent-danger">
              Missing Required Fields
            </p>
            <p className="text-sm text-accent-danger/90">
              Please map the following required fields:{' '}
              {missingRequired.map(f => f.label).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Preview Table */}
      {previewData.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Preview (First 3 Rows)</h3>
          <div className="rounded-lg border border-border overflow-auto">
            <table className="w-full">
              <thead className="bg-background-secondary">
                <tr>
                  {DATABASE_FIELDS.filter(f => localMapping[f.key]).map((field) => (
                    <th key={field.key} className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {previewData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-background-secondary/50">
                    {DATABASE_FIELDS.filter(f => localMapping[f.key]).map((field) => (
                      <td key={field.key} className="px-4 py-3 text-sm whitespace-nowrap">
                        {getMappedValue(row, field.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={!canProceed}
        >
          Continue to Preview
        </Button>
      </div>
    </div>
  )
}
