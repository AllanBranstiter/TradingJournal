'use client'

import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertCircle, FileText, Upload } from 'lucide-react'
import Link from 'next/link'

interface ImportResultsProps {
  results: {
    success: boolean
    imported: number
    failed: number
    results: {
      successful: Array<{ ticker: string; id: string }>
      failed: Array<{ ticker: string; error: string }>
    }
  }
  onReset: () => void
}

export function ImportResults({ results, onReset }: ImportResultsProps) {
  const hasSuccesses = results.imported > 0
  const hasFailures = results.failed > 0

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      {hasSuccesses && (
        <div className="flex items-center gap-3 rounded-lg border border-accent-success bg-accent-success/10 p-6">
          <div className="rounded-full bg-accent-success/20 p-3">
            <CheckCircle className="h-8 w-8 text-accent-success" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-accent-success">
              Import Completed Successfully!
            </h3>
            <p className="text-sm text-accent-success/90 mt-1">
              {results.imported} trade{results.imported !== 1 ? 's' : ''} imported successfully
              {hasFailures && ` (${results.failed} failed)`}
            </p>
          </div>
        </div>
      )}

      {/* Failure Only Banner */}
      {!hasSuccesses && hasFailures && (
        <div className="flex items-center gap-3 rounded-lg border border-accent-danger bg-accent-danger/10 p-6">
          <div className="rounded-full bg-accent-danger/20 p-3">
            <XCircle className="h-8 w-8 text-accent-danger" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-accent-danger">
              Import Failed
            </h3>
            <p className="text-sm text-accent-danger/90 mt-1">
              All {results.failed} trade{results.failed !== 1 ? 's' : ''} failed to import
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-background-secondary p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-5 w-5 text-accent-success" />
            <p className="text-sm font-medium text-text-secondary">Successfully Imported</p>
          </div>
          <p className="text-3xl font-bold text-accent-success">{results.imported}</p>
        </div>
        <div className="rounded-lg border border-border bg-background-secondary p-6">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="h-5 w-5 text-accent-danger" />
            <p className="text-sm font-medium text-text-secondary">Failed</p>
          </div>
          <p className="text-3xl font-bold text-accent-danger">{results.failed}</p>
        </div>
      </div>

      {/* Successful Imports List */}
      {hasSuccesses && results.results.successful.length <= 10 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-accent-success" />
            Successfully Imported Trades
          </h3>
          <div className="rounded-lg border border-border divide-y divide-border">
            {results.results.successful.map((trade, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-4 py-3 hover:bg-background-secondary/50"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded bg-accent-success/10 p-2">
                    <FileText className="h-4 w-4 text-accent-success" />
                  </div>
                  <span className="font-medium">{trade.ticker}</span>
                </div>
                <CheckCircle className="h-4 w-4 text-accent-success" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Many Successful Imports Summary */}
      {hasSuccesses && results.results.successful.length > 10 && (
        <div className="rounded-lg border border-accent-success bg-accent-success/5 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-accent-success flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-accent-success">
                {results.imported} trades imported successfully
              </p>
              <p className="text-sm text-text-secondary mt-1">
                View your imported trades in the trades list
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Failed Imports Details */}
      {hasFailures && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2 text-accent-danger">
            <AlertCircle className="h-5 w-5" />
            Failed Imports
          </h3>
          <div className="space-y-2">
            {results.results.failed.map((trade, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-accent-danger bg-accent-danger/5 p-4"
              >
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-accent-danger flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-accent-danger">
                      {trade.ticker || `Trade ${idx + 1}`}
                    </p>
                    <p className="text-sm text-accent-danger/90 mt-1">
                      {trade.error}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import Another File
        </Button>
        {hasSuccesses && (
          <Button asChild>
            <Link href="/dashboard">
              View All Trades
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
