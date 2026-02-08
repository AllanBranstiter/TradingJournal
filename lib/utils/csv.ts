import Papa from 'papaparse'

export interface CSVParseResult {
  headers: string[]
  data: any[]
  errors: any[]
}

export async function parseCSV(file: File): Promise<CSVParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve({
          headers: results.meta.fields || [],
          data: results.data,
          errors: results.errors,
        })
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}

export function autoDetectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  
  headers.forEach(header => {
    const lower = header.toLowerCase().trim()
    
    // Ticker
    if (lower.includes('symbol') || lower.includes('ticker') || lower === 'sym') {
      mapping.ticker = header
    }
    // Direction
    else if (lower.includes('side') || lower.includes('direction') || lower.includes('action')) {
      mapping.direction = header
    }
    // Entry Date
    else if ((lower.includes('entry') || lower.includes('open')) && lower.includes('date')) {
      mapping.entry_date = header
    }
    // Exit Date
    else if ((lower.includes('exit') || lower.includes('close')) && lower.includes('date')) {
      mapping.exit_date = header
    }
    // Entry Price
    else if ((lower.includes('entry') || lower.includes('open')) && lower.includes('price')) {
      mapping.entry_price = header
    }
    // Exit Price
    else if ((lower.includes('exit') || lower.includes('close')) && lower.includes('price')) {
      mapping.exit_price = header
    }
    // Quantity
    else if (lower.includes('quantity') || lower.includes('qty') || lower.includes('shares') || lower.includes('size')) {
      mapping.quantity = header
    }
    // Commissions
    else if (lower.includes('commission') || lower.includes('fees') || lower.includes('cost')) {
      mapping.commissions = header
    }
  })
  
  return mapping
}

export function mapCSVRowToTrade(row: any, mapping: Record<string, string>) {
  const trade: any = {}
  
  Object.keys(mapping).forEach(dbField => {
    const csvColumn = mapping[dbField]
    let value = row[csvColumn]
    
    // Data type conversions
    if (dbField === 'ticker') {
      trade.ticker = String(value).toUpperCase()
    }
    else if (dbField === 'direction') {
      // Normalize direction
      const dir = String(value).toLowerCase()
      if (dir.includes('buy') || dir.includes('long')) {
        trade.direction = 'long'
      } else if (dir.includes('sell') || dir.includes('short')) {
        trade.direction = 'short'
      } else {
        trade.direction = value
      }
    }
    else if (dbField.includes('price') || dbField === 'commissions') {
      trade[dbField] = parseFloat(value)
    }
    else if (dbField === 'quantity') {
      trade[dbField] = parseInt(value)
    }
    else if (dbField.includes('date')) {
      // Try to parse date
      trade[dbField] = new Date(value).toISOString()
    }
    else {
      trade[dbField] = value
    }
  })
  
  return trade
}

export function validateTrade(trade: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!trade.ticker) errors.push('Ticker is required')
  if (!trade.direction || !['long', 'short'].includes(trade.direction)) {
    errors.push('Direction must be "long" or "short"')
  }
  if (!trade.entry_date) errors.push('Entry date is required')
  if (!trade.entry_price || trade.entry_price <= 0) errors.push('Entry price must be positive')
  if (!trade.quantity || trade.quantity <= 0) errors.push('Quantity must be positive')
  
  // Optional exit data validation
  if (trade.exit_date && !trade.exit_price) {
    errors.push('Exit price required when exit date is provided')
  }
  if (trade.exit_price && !trade.exit_date) {
    errors.push('Exit date required when exit price is provided')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}
