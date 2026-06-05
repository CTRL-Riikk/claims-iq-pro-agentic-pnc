import { useRef, useState } from 'react';
import {
  User,
  FileText,
  Calendar,
  Car,
  Home,
  AlignLeft,
  Paperclip,
  SendHorizonal,
  FlaskConical,
  X,
  ChevronDown,
} from 'lucide-react';
import type { FormData, ClaimType } from '../types';

interface Props {
  formData: FormData;
  setFormData: (data: FormData) => void;
  onSubmit: () => void;
  onScenarioA: () => void;
  onScenarioB: () => void;
  isSubmitting: boolean;
}

function InputLabel({
  icon,
  label,
  required,
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
      <span className="text-slate-400">{icon}</span>
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

export default function ClaimForm({
  formData,
  setFormData,
  onSubmit,
  onScenarioA,
  onScenarioB,
  isSubmitting,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const update = (field: keyof FormData, value: string) =>
    setFormData({ ...formData, [field]: value });

  const handleFile = (file: File | null) => {
    setFileName(file ? file.name : null);
  };

  const isValid =
    formData.claimantName.trim() &&
    formData.policyNumber.trim() &&
    formData.incidentDate &&
    formData.claimType;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Panel header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <FileText size={15} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Claim Ingestion Form</h2>
            <p className="text-xs text-slate-400">Submit a new P&C insurance claim</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Row: Name + Policy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <InputLabel icon={<User size={12} />} label="Claimant Full Name" required />
            <input
              type="text"
              value={formData.claimantName}
              onChange={(e) => update('claimantName', e.target.value)}
              placeholder="e.g. Jane Smith"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <InputLabel icon={<FileText size={12} />} label="Policy Number" required />
            <input
              type="text"
              value={formData.policyNumber}
              onChange={(e) => update('policyNumber', e.target.value)}
              placeholder="e.g. P-9921"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Row: Date + Claim Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <InputLabel icon={<Calendar size={12} />} label="Date of Incident" required />
            <input
              type="date"
              value={formData.incidentDate}
              onChange={(e) => update('incidentDate', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <InputLabel icon={<Car size={12} />} label="Claim Type" required />
            <div className="relative">
              <select
                value={formData.claimType}
                onChange={(e) => update('claimType', e.target.value as ClaimType)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white pr-8"
              >
                <option value="">Select type...</option>
                <option value="Auto Collision">Auto Collision</option>
                <option value="Property Damage">Property Damage</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Claim type badge */}
        {formData.claimType && (
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                formData.claimType === 'Auto Collision'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {formData.claimType === 'Auto Collision' ? (
                <Car size={11} />
              ) : (
                <Home size={11} />
              )}
              {formData.claimType}
            </div>
          </div>
        )}

        {/* Details textarea */}
        <div>
          <InputLabel icon={<AlignLeft size={12} />} label="Accident Details / Description" />
          <textarea
            value={formData.details}
            onChange={(e) => update('details', e.target.value)}
            placeholder="Describe the incident in detail..."
            rows={4}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
          />
        </div>

        {/* File upload */}
        <div>
          <InputLabel icon={<Paperclip size={12} />} label="Upload Repair Invoice or Photos" />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              const file = e.dataTransfer.files[0] ?? null;
              handleFile(file);
            }}
            className={`relative flex flex-col items-center justify-center gap-2 p-5 rounded-lg border-2 border-dashed cursor-pointer transition ${
              isDragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            {fileName ? (
              <div className="flex items-center gap-2">
                <Paperclip size={14} className="text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">{fileName}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFileName(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-slate-400 hover:text-red-500 transition"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Paperclip size={18} className="text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600 font-medium">
                    Drop files here or{' '}
                    <span className="text-blue-600 underline underline-offset-2">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">PDF, JPG, PNG up to 20MB</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing Claim...
            </>
          ) : (
            <>
              <SendHorizonal size={15} />
              Submit to AI Agents
            </>
          )}
        </button>

        {/* Demo scenarios */}
        <div className="pt-2 border-t border-slate-100">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            <FlaskConical size={12} />
            Pre-load Demo Scenario
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onScenarioA}
              disabled={isSubmitting}
              className="flex flex-col gap-0.5 px-3 py-2.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-left transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-xs font-bold text-emerald-700">Scenario A</span>
              <span className="text-xs text-emerald-600">Clean Auto Claim</span>
            </button>
            <button
              onClick={onScenarioB}
              disabled={isSubmitting}
              className="flex flex-col gap-0.5 px-3 py-2.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-left transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-xs font-bold text-amber-700">Scenario B</span>
              <span className="text-xs text-amber-600">Suspicious Storm</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
