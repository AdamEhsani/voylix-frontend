import { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Search, 
  Calendar, 
  Eye, 
  ChevronDown, 
  ChevronUp,
  FileCode,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { cn } from '../utils';

const mockDocs = [
  { id: '1', filename: 'rechnung_hamburg_istanbul.pdf', type: 'pdf', status: 'completed', date: '02.03.2026, 14:20', size: '1.2 MB' },
  { id: '2', filename: 'ticket_berlin_paris.jpg', type: 'image', status: 'completed', date: '01.03.2026, 09:15', size: '850 KB' },
  { id: '3', filename: 'buchung_muenchen_london.pdf', type: 'pdf', status: 'processing', date: '02.03.2026, 15:45', size: '2.4 MB' },
  { id: '4', filename: 'scan_00123.pdf', type: 'pdf', status: 'failed', date: '28.02.2026, 11:30', size: '1.1 MB' },
];

export function DocumentsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Dokumente</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Verwalten Sie Ihre hochgeladenen Dateien und extrahierten Daten.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-200 dark:shadow-none">
          <Upload size={20} /> Datei hochladen
        </button>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center bg-white dark:bg-zinc-900/50 hover:border-emerald-500/50 transition-colors cursor-pointer group">
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-4 group-hover:scale-110 transition-transform">
          <Upload size={32} />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Dateien hierher ziehen</h3>
        <p className="text-sm text-zinc-500 mt-1">PDF, JPG oder PNG bis zu 10MB</p>
        <button className="mt-6 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors">
          Oder Datei auswählen
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-bold text-zinc-900 dark:text-white">Verlauf</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input 
                type="text" 
                placeholder="Suchen..." 
                className="pl-9 pr-4 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {mockDocs.map((doc) => (
              <div key={doc.id} className="flex flex-col">
                <div 
                  className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  onClick={() => doc.status === 'completed' && toggleExpand(doc.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      doc.type === 'pdf' ? "bg-red-50 dark:bg-red-900/20 text-red-600" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                    )}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{doc.filename}</p>
                      <p className="text-[10px] text-zinc-500">{doc.date} • {doc.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      {doc.status === 'completed' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                          <CheckCircle2 size={12} /> Fertig
                        </span>
                      ) : doc.status === 'processing' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase tracking-wider animate-pulse">
                          <Clock size={12} /> In Arbeit
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 uppercase tracking-wider">
                          <AlertCircle size={12} /> Fehler
                        </span>
                      )}
                    </div>
                    {doc.status === 'completed' && (
                      <div className="text-zinc-400">
                        {expandedId === doc.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded JSON View */}
                {expandedId === doc.id && (
                  <div className="p-6 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <FileCode size={14} /> Extrahiertes JSON
                      </h4>
                      <button className="text-xs font-bold text-emerald-600 hover:underline">Kopieren</button>
                    </div>
                    <div className="bg-zinc-900 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[400px]">
                      <pre>{JSON.stringify({
                        invoice_meta: { invoice_number: "RE-2026-001", date: "06.02.2026" },
                        agency: { name: "LETS GO TRAVEL" },
                        passengers: [{ name: "Johannes Clasen" }],
                        pricing: { total: 1050.42 }
                      }, null, 2)}</pre>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
                        <Eye size={14} /> In Rechnungsansicht öffnen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
