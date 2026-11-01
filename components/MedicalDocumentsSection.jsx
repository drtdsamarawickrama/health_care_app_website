'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AlertCircle,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  deleteMedicalDocument,
  getMedicalDocumentFile,
  listMedicalDocuments,
  uploadMedicalDocument,
} from '@/lib/api';
import { formatDateTime } from '@/lib/formatters';

function formatFileSize(bytes) {
  const size = Number(bytes) || 0;
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(
    1
  )} MB`;
}

export default function MedicalDocumentsSection({
  patientId,
}) {
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [effectivePatientId, setEffectivePatientId] =
    useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] =
    useState(false);
  const [processingId, setProcessingId] =
    useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewDoc, setPreviewDoc] =
    useState(null);
  const [deleteTarget, setDeleteTarget] =
    useState(null);

  const loadDocuments = useCallback(async () => {
    if (!patientId || Number(patientId) <= 0) {
      setDocuments([]);
      setEffectivePatientId(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await listMedicalDocuments(
        patientId
      );

      if (result?.success) {
        setDocuments(
          Array.isArray(result.documents)
            ? result.documents
            : []
        );
        setEffectivePatientId(
          Number(
            result.patient_id ?? patientId
          ) || Number(patientId)
        );
      } else {
        setDocuments([]);
        setEffectivePatientId(
          Number(patientId) || 0
        );
        setError(
          result?.message ||
            'Unable to load medical documents.'
        );
      }
    } catch (err) {
      setDocuments([]);
      setError(
        err?.message ||
          'Unable to load medical documents.'
      );
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    setSuccess('');
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    return () => {
      if (previewDoc?.objectUrl) {
        URL.revokeObjectURL(
          previewDoc.objectUrl
        );
      }
    };
  }, [previewDoc]);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (!file) {
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
    ];
    const ext = file.name
      .split('.')
      .pop()
      ?.toLowerCase();

    if (
      !allowedTypes.includes(file.type) &&
      !['pdf', 'jpg', 'jpeg', 'png'].includes(
        ext || ''
      )
    ) {
      setError(
        'Only PDF, JPG, and PNG files are allowed.'
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        'File size exceeds the 5MB limit.'
      );
      return;
    }

    const targetPatientId =
      effectivePatientId > 0
        ? effectivePatientId
        : Number(patientId);

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const result =
        await uploadMedicalDocument({
          patientId: targetPatientId,
          file,
        });

      if (result?.success) {
        setSuccess(
          'Medical document uploaded successfully.'
        );
        await loadDocuments();
      } else {
        setError(
          result?.message ||
            'Document upload failed.'
        );
      }
    } catch (err) {
      setError(
        err?.message ||
          'Document upload failed.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (doc) => {
    const docId = Number(doc?.id);
    if (!docId || processingId) {
      return;
    }

    setProcessingId(docId);
    setError('');

    try {
      const result =
        await getMedicalDocumentFile(docId);

      if (!result?.success || !result.blob) {
        setError(
          result?.message ||
            'Unable to open medical document.'
        );
        return;
      }

      if (previewDoc?.objectUrl) {
        URL.revokeObjectURL(
          previewDoc.objectUrl
        );
      }

      const objectUrl = URL.createObjectURL(
        result.blob
      );
      const mimeType =
        doc?.file_type ||
        result.contentType ||
        '';
      const filename =
        doc?.original_filename ||
        result.filename ||
        `document_${docId}`;

      setPreviewDoc({
        id: docId,
        filename,
        mimeType,
        objectUrl,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDownload = async (doc) => {
    const docId = Number(doc?.id);
    if (!docId || processingId) {
      return;
    }

    setProcessingId(docId);
    setError('');

    try {
      const result =
        await getMedicalDocumentFile(docId);

      if (!result?.success || !result.blob) {
        setError(
          result?.message ||
            'Unable to download medical document.'
        );
        return;
      }

      const objectUrl = URL.createObjectURL(
        result.blob
      );
      const filename =
        doc?.original_filename ||
        result.filename ||
        `medical_document_${docId}`;

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(
        () => URL.revokeObjectURL(objectUrl),
        5000
      );
      setSuccess(
        `Downloaded "${filename}" successfully.`
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    const docId = Number(deleteTarget.id);
    setDeleteTarget(null);
    setProcessingId(docId);
    setError('');
    setSuccess('');

    try {
      const result =
        await deleteMedicalDocument(docId);

      if (result?.success) {
        setSuccess(
          'Medical document deleted successfully.'
        );
        await loadDocuments();
      } else {
        setError(
          result?.message ||
            'Document deletion failed.'
        );
      }
    } finally {
      setProcessingId(null);
    }
  };

  const busy =
    loading ||
    uploading ||
    Boolean(processingId);

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <FileText size={21} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">
              Medical Records &amp; Reports
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Upload, preview, download or delete lab reports and clinical documents (PDF, JPG, PNG up to 5MB)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDocuments}
            disabled={busy}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={
                loading ? 'animate-spin' : ''
              }
            />
            Refresh
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            disabled={
              busy || !patientId || patientId <= 0
            }
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2
                  size={15}
                  className="animate-spin"
                />
                Uploading...
              </>
            ) : (
              <>
                <UploadCloud size={15} />
                Upload Document
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          <AlertCircle
            size={16}
            className="mt-0.5 shrink-0"
          />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
          {success}
        </div>
      )}

      <div className="mt-5">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-slate-500">
            <Loader2
              size={22}
              className="mr-2 animate-spin text-teal-600"
            />
            Loading medical documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center">
            <UploadCloud
              size={30}
              className="mx-auto text-slate-400"
            />
            <p className="mt-3 text-sm font-bold text-slate-700">
              No medical documents uploaded yet
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Upload lab reports, diagnosis letters, or scan images for this patient profile.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => {
              const docId = Number(doc?.id);
              const filename =
                doc?.original_filename ||
                `Document #${docId}`;
              const isPdf = filename
                .toLowerCase()
                .endsWith('.pdf');
              const isRowBusy =
                processingId === docId;

              return (
                <div
                  key={docId}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isPdf
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-teal-50 text-teal-600'
                      }`}
                    >
                      {isPdf ? (
                        <FileText size={19} />
                      ) : (
                        <ImageIcon size={19} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">
                        {filename}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatFileSize(
                          doc?.file_size
                        )}
                        {doc?.uploaded_at
                          ? ` • ${formatDateTime(
                              doc.uploaded_at
                            )}`
                          : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        handleView(doc)
                      }
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      {isRowBusy ? (
                        <Loader2
                          size={14}
                          className="animate-spin"
                        />
                      ) : (
                        <Eye size={14} />
                      )}
                      View
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        handleDownload(doc)
                      }
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-teal-700 transition hover:bg-teal-50 disabled:opacity-50"
                    >
                      <Download size={14} />
                      Download
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        setDeleteTarget(doc)
                      }
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <p className="truncate text-sm font-bold text-slate-900">
                {previewDoc.filename}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (previewDoc?.objectUrl) {
                    URL.revokeObjectURL(
                      previewDoc.objectUrl
                    );
                  }
                  setPreviewDoc(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-slate-900 p-4">
              {previewDoc.mimeType.includes(
                'pdf'
              ) ||
              previewDoc.filename
                .toLowerCase()
                .endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.objectUrl}
                  title={previewDoc.filename}
                  className="h-[72vh] w-full rounded-xl bg-white"
                />
              ) : (
                <img
                  src={previewDoc.objectUrl}
                  alt={previewDoc.filename}
                  className="mx-auto max-h-[72vh] object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">
              Delete Medical Document?
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Are you sure you want to permanently delete{' '}
              <span className="font-bold text-slate-800">
                &ldquo;
                {deleteTarget.original_filename ||
                  `Document #${deleteTarget.id}`}
                &rdquo;
              </span>
              ? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget(null)
                }
                className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="h-10 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-700"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

