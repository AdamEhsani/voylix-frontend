import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  X, 
  CheckCircle2, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../utils';
import { API_URL } from "../config/api";

export function PdfImportPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setStatus('idle');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
    }
  };

const handleUpload = async () => {
  if (!file) return;

  try {
    setStatus('uploading');

    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL}/api/Pdf`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) {
      throw new Error("Upload failed");
    }

    setStatus('success');

    setTimeout(() => {
      navigate('/invoices');
    }, 1500);

  } catch (err) {
    console.error(err);
    setStatus('error');
  }
};

  const removeFile = () => {
    setFile(null);
    setStatus('idle');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">PDF Import</h1>
          <p className="text-sm text-zinc-500">Laden Sie eine PDF-Datei hoch, um eine neue Rechnung zu erstellen.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-8">
          {!file ? (
            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer",
                dragActive 
                  ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10" 
                  : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
              )}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept=".pdf"
                onChange={handleChange}
              />
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                <Upload size={32} />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-zinc-900 dark:text-white">PDF-Datei hierher ziehen</p>
                <p className="text-sm text-zinc-500">oder klicken zum Auswählen</p>
              </div>
              <p className="text-xs text-zinc-400">Maximale Dateigröße: 10MB</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-zinc-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                {status === 'idle' && (
                  <button 
                    onClick={removeFile}
                    className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              {status === 'uploading' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      Verarbeitung läuft...
                    </span>
                    <span className="font-bold text-emerald-600">65%</span>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[65%] transition-all duration-500" />
                  </div>
                </div>
              )}

              {status === 'success' && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex gap-3">
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                    Datei erfolgreich verarbeitet! Sie werden in Kürze weitergeleitet.
                  </p>
                </div>
              )}

              {status === 'idle' && (
                <div className="flex gap-3">
                  <button 
                    onClick={removeFile}
                    className="flex-1 px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button 
                    onClick={handleUpload}
                    className="flex-[2] px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Import starten
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex gap-3">
            <AlertCircle className="text-zinc-400 shrink-0" size={20} />
            <p className="text-xs text-zinc-500 leading-relaxed">
              Unser System nutzt KI, um Daten wie Rechnungsnummer, Datum, Beträge und Flugdetails automatisch aus Ihrem PDF zu extrahieren. Bitte überprüfen Sie die Daten nach dem Import sorgfältig.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
