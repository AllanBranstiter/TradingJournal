'use client'

import { useState } from 'react'
import { CSVUploader } from '@/components/import/CSVUploader'
import { ColumnMapper } from '@/components/import/ColumnMapper'
import { ImportPreview } from '@/components/import/ImportPreview'
import { ImportResults } from '@/components/import/ImportResults'
import { parseCSV, autoDetectColumnMapping, mapCSVRowToTrade, validateTrade } from '@/lib/utils/csv'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Step = 'upload' | 'mapping' | 'preview' | 'results'

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCSVData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [parsedTrades, setParsedTrades] = useState<any[]>([])
  const [importResults, setImportResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  
  const handleFileSelect = async (selectedFile: File) => {
    setError(null)
    setFile(selectedFile)
    
    try {
      const { headers, data, errors } = await parseCSV(selectedFile)
      
      if (errors.length > 0) {
        setError(`CSV parsing errors: ${errors.map(e => e.message).join(', ')}`)
        return
      }
      
      setHeaders(headers)
      setCSVData(data)
      
      // Auto-detect column mapping
      const mapping = autoDetectColumnMapping(headers)
      setColumnMapping(mapping)
      
      setStep('mapping')
    } catch (err: any) {
      setError(err.message)
    }
  }
  
  const handleMappingConfirm = () => {
    // Validate required fields are mapped
    const requiredFields = ['ticker', 'direction', 'entry_date', 'entry_price', 'quantity']
    const missing = requiredFields.filter(field => !columnMapping[field])
    
    if (missing.length > 0) {
      setError(`Missing required fields: ${missing.join(', ')}`)
      return
    }
    
    setError(null)
    
    // Map CSV rows to trades
    const trades = csvData.map(row => mapCSVRowToTrade(row, columnMapping))
    
    // Validate trades
    const validated = trades.map(trade => ({
      ...trade,
      validation: validateTrade(trade),
    }))
    
    setParsedTrades(validated)
    setStep('preview')
  }
  
  const handleImportConfirm = async () => {
    // Filter out invalid trades
    const validTrades = parsedTrades.filter(t => t.validation.valid)
    
    if (validTrades.length === 0) {
      setError('No valid trades to import')
      return
    }
    
    setIsImporting(true)
    setError(null)
    
    try {
      const res = await fetch('/api/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trades: validTrades }),
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Import failed')
      }
      
      const results = await res.json()
      setImportResults(results)
      setStep('results')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsImporting(false)
    }
  }
  
  const handleReset = () => {
    setStep('upload')
    setFile(null)
    setCSVData([])
    setHeaders([])
    setColumnMapping({})
    setParsedTrades([])
    setImportResults(null)
    setError(null)
    setIsImporting(false)
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Import Trades from CSV</h1>
          <p className="text-text-secondary">Bulk import your historical trades</p>
        </div>
      </div>
      
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2">
        {['upload', 'mapping', 'preview', 'results'].map((s, idx) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s
                  ? 'bg-accent-info text-white'
                  : ['upload', 'mapping', 'preview', 'results'].indexOf(step) > idx
                  ? 'bg-accent-success text-white'
                  : 'bg-background-secondary text-text-secondary'
              }`}
            >
              {idx + 1}
            </div>
            {idx < 3 && (
              <div
                className={`w-12 h-0.5 ${
                  ['upload', 'mapping', 'preview', 'results'].indexOf(step) > idx
                    ? 'bg-accent-success'
                    : 'bg-background-secondary'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle>
            {step === 'upload' && 'Step 1: Upload CSV File'}
            {step === 'mapping' && 'Step 2: Map Columns'}
            {step === 'preview' && 'Step 3: Preview & Confirm'}
            {step === 'results' && 'Import Complete'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 'upload' && (
            <CSVUploader onFileSelect={handleFileSelect} />
          )}
          
          {step === 'mapping' && (
            <ColumnMapper
              csvHeaders={headers}
              previewData={csvData.slice(0, 3)}
              mapping={columnMapping}
              onMappingChange={setColumnMapping}
              onConfirm={handleMappingConfirm}
              onBack={() => setStep('upload')}
            />
          )}
          
          {step === 'preview' && (
            <ImportPreview
              trades={parsedTrades}
              onConfirm={handleImportConfirm}
              onBack={() => setStep('mapping')}
            />
          )}
          
          {step === 'results' && importResults && (
            <ImportResults
              results={importResults}
              onReset={handleReset}
            />
          )}
          
          {isImporting && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-info"></div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
