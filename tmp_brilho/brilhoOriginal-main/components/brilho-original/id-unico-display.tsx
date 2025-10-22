"use client"

import { useState, useEffect } from "react"
import { BrandplotCache } from "@/lib/brandplot-cache"

export function IdUnicoDisplay() {
  const [idUnico, setIdUnico] = useState<string | null>(null)
  const [cacheData, setCacheData] = useState<any>(null)

  useEffect(() => {
    // Verifica o cache ao montar o componente
    const cached = BrandplotCache.get()
    setCacheData(cached)
    setIdUnico(cached?.idUnico || null)
  }, [])

  const clearCache = () => {
    BrandplotCache.clear()
    setIdUnico(null)
    setCacheData(null)
  }

  if (!idUnico && !cacheData) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-600">
          Nenhum idUnico encontrado no cache. Complete o diagnóstico para gerar um.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-blue-50 rounded-lg">
      <h3 className="font-semibold text-blue-900 mb-2">Cache BrandPlot</h3>
      {idUnico && (
        <p className="text-sm mb-2">
          <strong>ID Único:</strong> <code className="bg-blue-100 px-2 py-1 rounded">{idUnico}</code>
        </p>
      )}
      {cacheData?.companyName && (
        <p className="text-sm mb-2">
          <strong>Empresa:</strong> {cacheData.companyName}
        </p>
      )}
      {cacheData?.timestamp && (
        <p className="text-sm mb-2">
          <strong>Criado em:</strong> {new Date(cacheData.timestamp).toLocaleString()}
        </p>
      )}
      <button 
        onClick={clearCache}
        className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
      >
        Limpar Cache
      </button>
    </div>
  )
}
