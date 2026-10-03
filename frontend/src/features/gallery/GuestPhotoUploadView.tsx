import React, { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Camera,
  CheckCircle2,
  UploadCloud,
  ArrowLeft,
  UtensilsCrossed,
} from 'lucide-react';
import { mediaService } from '../../services/media.service';

export const GuestPhotoUploadView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [guestName, setGuestName] = useState('');
  const [tableNumber, setTableNumber] = useState('7');
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
  const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif'];
  const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.gif'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > MAX_FILE_SIZE) {
        const mb = (file.size / (1024 * 1024)).toFixed(1);
        setFileError(`Photo is too large (${mb} MB). Maximum size is 25 MB.`);
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
      const validMime = ALLOWED_MIME.includes(file.type.toLowerCase());
      const validExt = ALLOWED_EXT.includes(ext);
      if (!validMime && !validExt) {
        setFileError('Unsupported file type. Please upload a JPG, PNG, WebP, or HEIC photo.');
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setFileError(null);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsSuccess(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadProgress(15);

      // Using demo wedding ID or fallback
      const weddingId = 'f238b9ec-9c7f-41d3-8885-0080ae24a462';

      // 1. Get signature
      const sig = await mediaService.getSignature(weddingId);

      // 2. Direct upload to Cloudinary (or mock fallback)
      const uploadResult = await mediaService.uploadFileToCloudinary(selectedFile, sig, (percent) => {
        setUploadProgress(percent);
      });

      // 3. Register guest upload
      await mediaService.guestUpload(weddingId, {
        publicId: uploadResult.publicId,
        secureUrl: uploadResult.secureUrl,
        caption: caption || 'Banquet Candid Moment',
        guestName: guestName || 'Banquet Guest',
        tableNumber: `Table ${tableNumber}`,
        format: uploadResult.format,
      });

      setIsSuccess(true);
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption('');
      setUploadProgress(0);
    } catch (err) {
      console.error('Guest upload error:', err);
      alert('Upload encountered an error. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E1B19] flex flex-col justify-between selection:bg-[#F4BD6C] selection:text-[#291800]">
      {/* Top Mobile Header */}
      <header className="px-4 py-4 bg-white/90 backdrop-blur-md border-b border-[#E9E1DD] sticky top-0 z-30">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link
            to={slug ? `/w/${slug}` : '/'}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#780616] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Wedding Website</span>
          </Link>
          <span className="font-serif text-sm font-bold text-[#7A5912]">MakeMyMarriage</span>
          <span className="text-[11px] font-mono text-[#827566] bg-[#FAF2EE] px-2 py-0.5 rounded-full">
            Table {tableNumber}
          </span>
        </div>
      </header>

      {/* Main Upload Box */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#FFDDB1]/60 flex items-center justify-center text-[#780616] mx-auto mb-2 border border-[#D4AF37]/30 shadow-sm">
            <Camera className="w-6 h-6 text-[#780616]" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#1E1B19]">Banquet Photo Broadcast</h1>
          <p className="text-xs text-[#827566] mt-1 max-w-xs mx-auto">
            Share candid smiles, blessings, and memories directly from your smartphone to the bride & groom’s Royal 4K Vault.
          </p>
        </div>

        {isSuccess ? (
          <div className="p-8 rounded-3xl bg-white border border-[#D4AF37]/50 shadow-xl text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1E1B19]">Memory Inscribed!</h3>
            <p className="text-xs text-[#4F4538] mt-2 leading-relaxed">
              Your photo has been uploaded directly to the Royal Cloudinary Stream. The couple will cherish this forever!
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="w-full py-3 rounded-xl bg-[#780616] text-white text-xs font-semibold shadow hover:bg-[#910130] transition-colors"
              >
                + Inscribe Another Photo
              </button>
              <Link
                to={slug ? `/w/${slug}#gallery` : '/'}
                className="w-full py-2.5 rounded-xl bg-[#FAF2EE] text-[#780616] text-xs font-semibold hover:bg-[#F4ECE8] transition-colors inline-block"
              >
                View Full Wedding Gallery
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleUploadSubmit}
            className="p-6 rounded-3xl bg-white border border-[#E9E1DD] shadow-xl space-y-4"
          >
            {/* File Capture / Picker Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative aspect-[4/3] rounded-2xl border-2 border-dashed border-[#D4AF37]/70 bg-[#FAF7F2] flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:bg-[#F4ECE8]/60 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />

              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold">
                    Click to change photo
                  </div>
                </>
              ) : (
                <div className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-[#780616] mx-auto shadow mb-3 border border-[#E9E1DD]">
                    <Camera className="w-7 h-7" />
                  </div>
                  <p className="font-serif text-sm font-semibold text-[#1E1B19]">
                    Tap to Open Camera or Photo Library
                  </p>
                  <p className="text-[11px] text-[#827566] mt-1">
                    High-res photos accepted (JPG, PNG, HEIC up to 25MB)
                  </p>
                </div>
              )}
            </div>

            {/* Error Notice */}
            {fileError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {fileError}
              </div>
            )}

            {/* Table Number & Guest Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#827566] uppercase tracking-wider mb-1">
                  Your Table
                </label>
                <div className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF2EE] rounded-xl border border-[#E9E1DD]">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-[#BF8E42]" />
                  <select
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="bg-transparent text-xs text-[#1E1B19] font-semibold focus:outline-none w-full"
                  >
                    {Array.from({ length: 25 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={String(n)}>
                        Table {n}
                      </option>
                    ))}
                    <option value="VIP-Mandap">VIP Mandap</option>
                    <option value="Courtyard">Courtyard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#827566] uppercase tracking-wider mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Rohan Varma"
                  className="w-full px-3 py-2 bg-[#FAF2EE] rounded-xl border border-[#E9E1DD] text-xs text-[#1E1B19] focus:outline-none focus:border-[#BF8E42]"
                />
              </div>
            </div>

            {/* Caption */}
            <div>
              <label className="block text-[11px] font-semibold text-[#827566] uppercase tracking-wider mb-1">
                Wishes or Memory Caption
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g. Heartiest congratulations from Table 7!"
                className="w-full px-3 py-2 bg-[#FAF2EE] rounded-xl border border-[#E9E1DD] text-xs text-[#1E1B19] focus:outline-none focus:border-[#BF8E42]"
              />
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="p-3 bg-[#F4ECE8] rounded-xl border border-[#D3C4B3]/40 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-[#1E1B19]">
                  <span>Uploading to Cloudinary 4K Master CDN...</span>
                  <span className="font-bold text-[#780616]">{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#E9E1DD] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#780616] to-[#D4AF37] rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#780616] to-[#910130] text-white text-xs font-semibold shadow-md hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isUploading ? 'Broadcasting Memory...' : 'Inscribe to Royal Stream'}</span>
            </button>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="px-4 py-4 text-center text-[11px] text-[#827566]">
        <span>MakeMyMarriage Vivaha Concierge • Instant Cloud Sync</span>
      </footer>
    </div>
  );
};
