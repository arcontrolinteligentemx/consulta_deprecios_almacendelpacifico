import React, { useState } from 'react';
import Header from './components/Header';
import RegionSelector from './components/RegionSelector';
import ProductList from './components/ProductList';
import BarcodeScanner from './components/BarcodeScanner';
import { Region, SearchResult } from './types';
import { verifyPrices } from './services/geminiService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const App: React.FC = () => {
  const [region, setRegion] = useState<Region>(Region.SINALOA);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const performSearch = async (term: string) => {
    if (!term.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await verifyPrices(term, region);
      setResult(data);
    } catch (err) {
      setError("Ocurrió un error al consultar los precios. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const quickSearch = (term: string) => {
    setQuery(term);
    performSearch(term);
  };

  const handleScanSuccess = (decodedText: string) => {
    setShowScanner(false);
    setQuery(decodedText);
    performSearch(decodedText);
  };

  const generatePDF = () => {
    if (!result) return;

    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // --- CONFIGURACIÓN DE ESTILOS ---
    const primaryColor = [15, 23, 42]; // Slate 900 (Azul oscuro)
    const accentColor = [202, 138, 4]; // Yellow 600 (Dorado oscuro)

    // --- ENCABEZADO ---
    // Fondo gris muy claro para el encabezado
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 45, 'F');

    // Título Principal
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("ALMACÉN DEL PACÍFICO", 14, 20);

    // Subtítulo
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text("Tecuala, Nayarit", 14, 26);

    // Dirección
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Carr. a El Filo 480-Sur, Salida, México", 14, 32);

    // Datos del Reporte (Derecha)
    doc.setFontSize(10);
    doc.setTextColor(60);
    const rightMargin = 196;
    doc.text(`Fecha: ${date}`, rightMargin, 20, { align: 'right' });
    doc.text(`Zona: ${region}`, rightMargin, 25, { align: 'right' });
    doc.text(`Folio: REF-${Date.now().toString().slice(-6)}`, rightMargin, 30, { align: 'right' });

    // --- CUERPO DEL REPORTE ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("Reporte de Verificación de Precios", 14, 55);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(`Criterio de búsqueda: "${query.toUpperCase()}"`, 14, 61);

    // --- TABLA DE PRODUCTOS ---
    const tableColumn = ["Producto", "Presentación", "Empaque", "Precio Est.", "Notas"];
    const tableRows: any[] = [];

    result.products.forEach(product => {
      const productData = [
        product.productName,
        product.presentation,
        product.packType,
        `$${product.estimatedPrice.toFixed(2)} ${product.currency}`,
        product.notes
      ];
      tableRows.push(productData);
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 66,
      theme: 'grid',
      styles: { 
        fontSize: 9, 
        cellPadding: 4,
        valign: 'middle',
        lineColor: [200, 200, 200]
      },
      headStyles: { 
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: 'bold' }, // Producto
        1: { cellWidth: 35 }, // Presentación
        2: { cellWidth: 35 }, // Empaque
        3: { cellWidth: 25, halign: 'right', fontStyle: 'bold', textColor: [22, 163, 74] }, // Precio (Verde)
        4: { cellWidth: 'auto', fontSize: 8, fontStyle: 'italic' } // Notas
      },
      alternateRowStyles: { 
        fillColor: [241, 245, 249] 
      }
    });

    // --- PIE DE PÁGINA / DISCLAIMER ---
    const finalY = (doc as any).lastAutoTable?.finalY || 80;
    
    // Línea separadora
    doc.setDrawColor(200);
    doc.line(14, finalY + 10, 196, finalY + 10);

    // Texto Legal
    doc.setFontSize(8);
    doc.setTextColor(120);
    const disclaimerText = "NOTA IMPORTANTE: Información tomada directamente de enlaces a servidores de BEES para referencia interna. Se consideran promociones vigentes de agencia, mayoreo y modeloramas. Este documento es de carácter informativo.";
    
    const splitDisclaimer = doc.splitTextToSize(disclaimerText, 180);
    doc.text(splitDisclaimer, 14, finalY + 16);

    // Guardar
    doc.save(`Cotizacion_Modelo_${region}_${Date.now()}.pdf`);
  };

  const catalogCategories = [
    {
      title: "Botes y Latones (Lata)",
      items: [
        "Pacífico Clara Bote 355ml",
        "Pacífico Light Bote 330ml",
        "Pacífico Suave Bote",
        "Corona Extra Bote 355ml",
        "Corona Light Bote 355ml",
        "Corona Cero Bote 355ml",
        "Modelo Especial Bote 355ml",
        "Modelo Especial Latón 473ml",
        "Victoria Bote 355ml",
        "Victoria Latón 473ml",
        "Michelob Ultra Bote 355ml",
        "Michelob Ultra Slim 355ml",
        "Bud Light Bote 355ml",
        "Barrilito Bote"
      ]
    },
    {
      title: "Vidrio: Medias y Cuartitos",
      items: [
        "Pacífico Media 355ml",
        "Pacífico Cuartito 210ml",
        "Pacífico Light Cuartito",
        "Corona Extra Media 355ml",
        "Corona Cuartito 210ml",
        "Corona Light Media 355ml",
        "Victoria Media 355ml",
        "Victoria Cuartito",
        "Modelo Especial Botella",
        "Negra Modelo Botella",
        "Montejo Botella",
        "León Botella",
        "Estrella Botella",
        "Michelob Ultra Botella Media",
        "Michelob Ultra Cuartito",
        "Stella Artois Botella 330ml",
        "Barrilito Botella 325ml"
      ]
    },
    {
      title: "Familiar, Mega y Ballenas",
      items: [
        "Pacífico Ballena 940ml",
        "Pacífico Ballenón 1.2L",
        "Corona Familiar 940ml",
        "Corona Mega 1.2L",
        "Victoria Familiar 940ml",
        "Victoria Ballenón 1.2L",
        "Modelo Especial Familiar",
        "Modelo Mega 1.2L",
        "Corona Caguamón",
        "Miller High Life Ballena"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Search Section */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Catálogo General & Precios
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Cotizador de referencia: Precios Agencia (Mayoreo) y Modelorama (Menudeo).
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-6">
            <RegionSelector selectedRegion={region} onRegionChange={setRegion} />
            
            <div className="relative">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Escribe Nombre o Escanea SKU con lector..."
                    className="w-full p-4 pl-12 rounded-xl border border-slate-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg"
                    autoFocus
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                  title="Usar Cámara"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 17h.01M8 11h.01M12 12h.01M16 11h.01M12 7h.01M7 11h.01M17 11h.01M12 11h.01M17 7h.01M7 7h.01" />
                  </svg>
                  <span className="hidden sm:inline">Cámara</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl font-medium transition-colors disabled:opacity-50 shadow-sm"
                >
                  {loading ? '...' : 'Buscar'}
                </button>
              </form>
              <div className="mt-2 text-xs text-slate-500 flex justify-between px-1">
                 <span>* Compatible con lectores físicos (USB/Bluetooth)</span>
              </div>
            </div>

            {/* Quick Catalog */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="bg-yellow-400 w-2 h-6 rounded-full inline-block"></span>
                Catálogo Rápido por Presentación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {catalogCategories.map((cat, idx) => (
                  <div key={idx} className="space-y-3">
                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider border-b border-blue-100 pb-1">
                      {cat.title}
                    </h4>
                    <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {cat.items.map((item) => (
                        <button
                          key={item}
                          onClick={() => quickSearch(item)}
                          className="text-left text-sm text-slate-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1.5 rounded transition-colors flex items-center gap-2 group w-full"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-blue-500 transition-colors flex-shrink-0"></span>
                          <span className="truncate">{item}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
               <p className="text-slate-500 text-sm animate-pulse">Consultando precios de agencia y mercado en {region}...</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-8 animate-fade-in-up">
              <div className="flex flex-col sm:flex-row justify-between items-end border-b border-slate-200 pb-4 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Resultados para: "{query}"</h3>
                  <span className="text-sm text-slate-500">Zona de Referencia: {region}</span>
                </div>
                
                <button 
                  onClick={generatePDF}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exportar PDF
                </button>
              </div>
              
              <ProductList products={result.products} />
              
              {result.groundingUrls.length > 0 && (
                <div className="bg-slate-100 rounded-lg p-4 mt-8">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Fuentes de Referencia
                  </h4>
                  <ul className="space-y-1">
                    {result.groundingUrls.map((source, idx) => (
                      <li key={idx} className="text-xs truncate">
                        <a 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline hover:text-blue-800 transition-colors"
                        >
                          {source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-xs text-yellow-800 text-center">
                <strong>Nota Importante:</strong> Información tomada directamente de enlaces a servidores de BEES para referencia interna. Se consideran promociones vigentes de agencia, mayoreo y modeloramas en {region}.
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Barcode Scanner Overlay */}
      {showScanner && (
        <BarcodeScanner 
          onScanSuccess={handleScanSuccess} 
          onClose={() => setShowScanner(false)} 
        />
      )}
      
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p className="mb-2">Almacén del Pacífico Tecuala, Nayarit.</p>
          <p className="text-xs text-slate-400">
            Creado por <span className="font-semibold text-slate-600">ChrisRey91</span> - <a href="http://www.arcontrolinteligente.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">www.arcontrolinteligente.com</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;