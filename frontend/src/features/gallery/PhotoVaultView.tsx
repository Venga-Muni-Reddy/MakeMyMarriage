import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Camera,
  Image as ImageIcon,
  QrCode,
  CheckCircle2,
  Clock,
  Heart,
  Download,
  Maximize2,
  Search,
  Grid,
  Columns,
  UploadCloud,
  X,
  Copy,
  Check,
  Printer,
  ChevronLeft,
  ChevronRight,
  Shield,
  Trash2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useWedding } from '../../context/WeddingContext';
import {
  mediaService,
  PhotoItem,
  MediaTelemetry,
  PhotoModerationStatus,
  PhotoVisibility,
} from '../../services/media.service';

export const PhotoVaultView: React.FC = () => {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { currentWedding, weddings } = useWedding();
  const activeWeddingId = weddingId || currentWedding?.id || weddings[0]?.id || '';

  // Data states
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [telemetry, setTelemetry] = useState<MediaTelemetry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCuratorMode, setIsCuratorMode] = useState(true);

  // Filters & Search
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'most_liked' | 'ceremony_order' | 'pending'>('newest');
  const [viewLayout, setViewLayout] = useState<'masonry' | 'grid'>('masonry');

  // Modals & Drawers
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedTableForQr, setSelectedTableForQr] = useState('7');
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Upload Form States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCeremony, setUploadCeremony] = useState('Sacred Muhurtham');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadVisibility, setUploadVisibility] = useState<PhotoVisibility>('PUBLIC');
  const [uploadGuestCredit, setUploadGuestCredit] = useState('');
  const [uploadTableNumber, setUploadTableNumber] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch photos & telemetry
  const loadGalleryData = async () => {
    if (!activeWeddingId) return;
    try {
      setIsLoading(true);
      const [photoList, stats] = await Promise.all([
        mediaService.getPhotos(activeWeddingId, {
          eventId: selectedAlbum !== 'all' ? selectedAlbum : undefined,
          search: searchQuery || undefined,
          sortBy,
        }),
        mediaService.getTelemetry(activeWeddingId),
      ]);
      setPhotos(Array.isArray(photoList) ? photoList : []);
      setTelemetry(stats);
    } catch (err) {
      console.error('Failed to load media vault:', err);
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGalleryData();
  }, [activeWeddingId, selectedAlbum, sortBy]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeLightboxIndex === null) return;
      const count = (photos || []).length;
      if (e.key === 'Escape') setActiveLightboxIndex(null);
      if (e.key === 'ArrowRight' && count > 0) {
        setActiveLightboxIndex((prev) => (prev !== null && prev < count - 1 ? prev + 1 : 0));
      }
      if (e.key === 'ArrowLeft' && count > 0) {
        setActiveLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : count - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIndex, (photos || []).length]);

  // Like action handler
  const handleToggleLike = async (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    try {
      // Optimistic update
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId ? { ...p, likesCount: (p.likesCount || 0) + 1 } : p
        )
      );
      await mediaService.toggleLike(activeWeddingId, photoId);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  // Moderation action handler
  const handleModerate = async (
    e: React.MouseEvent,
    photoId: string,
    status: PhotoModerationStatus
  ) => {
    e.stopPropagation();
    try {
      setPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, moderationStatus: status } : p))
      );
      await mediaService.moderatePhoto(activeWeddingId, photoId, {
        moderationStatus: status,
      });
      // Refresh telemetry
      const stats = await mediaService.getTelemetry(activeWeddingId);
      setTelemetry(stats);
    } catch (err) {
      console.error('Failed to moderate photo:', err);
    }
  };

  // Delete photo handler
  const handleDelete = async (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this memory from the Royal Vault?')) return;
    try {
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      if (activeLightboxIndex !== null) setActiveLightboxIndex(null);
      await mediaService.deletePhoto(activeWeddingId, photoId);
      const stats = await mediaService.getTelemetry(activeWeddingId);
      setTelemetry(stats);
    } catch (err) {
      console.error('Failed to delete photo:', err);
    }
  };

  // Upload submission
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // 1. Get signed Cloudinary signature
      const sig = await mediaService.getSignature(activeWeddingId);

      // 2. Direct upload to Cloudinary (or simulation in mock mode)
      const uploadResult = await mediaService.uploadFileToCloudinary(selectedFile, sig, (percent) => {
        setUploadProgress(percent);
      });

      // 3. Register with backend DB
      const newPhoto = await mediaService.registerPhoto(activeWeddingId, {
        publicId: uploadResult.publicId,
        secureUrl: uploadResult.secureUrl,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        bytes: uploadResult.bytes,
        caption: uploadCaption || selectedFile.name.replace(/\.[^/.]+$/, ''),
        eventId: selectedAlbum !== 'all' ? selectedAlbum : undefined,
        visibility: uploadVisibility,
        guestName: uploadGuestCredit || currentWedding?.name || 'Wedding Host',
        tableNumber: uploadTableNumber || undefined,
        cameraModel: 'Master Camera (Cloudinary 4K)',
      });

      setPhotos((prev) => [newPhoto, ...prev]);
      setIsUploadOpen(false);
      setSelectedFile(null);
      setUploadCaption('');
      setUploadProgress(0);

      // Refresh stats
      const stats = await mediaService.getTelemetry(activeWeddingId);
      setTelemetry(stats);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please check file format and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyGuestLink = () => {
    const slug = currentWedding?.slug || 'ananya-rahul';
    const guestUrl = `${window.location.origin}/w/${slug}#gallery`;
    navigator.clipboard?.writeText(guestUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredPhotos = (photos || []).filter((p) => {
    if (!p) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.caption && p.caption.toLowerCase().includes(q)) ||
      (p.eventName && p.eventName.toLowerCase().includes(q)) ||
      (p.uploader?.name && p.uploader.name.toLowerCase().includes(q)) ||
      (p.uploader?.tableNumber && p.uploader.tableNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full min-h-screen bg-[#FFFDF9] text-[#1E1B19] pb-24 selection:bg-[#F4BD6C] selection:text-[#291800]">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & TELEMETRY COMMAND BAR                                     */}
      {/* ========================================================================= */}
      <section className="w-full px-4 sm:px-6 lg:px-8 pt-6 pb-4 border-b border-[#E9E1DD]/60">
        <div className="flex flex-col gap-4">
          {/* Breadcrumb & Live CDN indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#827566]">
              <span>Imperial Dashboard</span>
              <span className="text-[#D4AF37]">/</span>
              <span>Wedding Workspace</span>
              <span className="text-[#D4AF37]">/</span>
              <span className="text-[#780616] font-semibold">Photo Vault</span>
            </div>
            <div className="flex items-center gap-2 bg-[#F4ECE8] px-3 py-1 rounded-full shadow-sm w-fit border border-[#D3C4B3]/40">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
              <span className="text-xs text-[#4F4538] font-medium">Cloudinary 4K Master CDN • Live Sync Active</span>
            </div>
          </div>

          {/* Main Title & Action Buttons */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs uppercase tracking-widest bg-[#FFDEA7]/60 text-[#7A5912] font-semibold px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30">
                  Imperial Archives
                </span>
                <span className="text-xs text-[#827566]">
                  {currentWedding?.settings?.primaryVenueName || 'The Leela Palace & Jagmandir Island'}
                </span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#1E1B19] mt-1 tracking-tight font-semibold">
                Shubh Smriti — Royal Media Vault
              </h1>
              <p className="text-sm text-[#4F4538] mt-1 max-w-3xl">
                Curated ritual archives, professional master reels, and unscripted guest candids orchestrated across
                Udaipur’s sacred royal ceremonies.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center flex-wrap gap-3 shrink-0">
              {/* Curator Desk Toggle */}
              <div className="flex items-center gap-2.5 bg-[#EEE7E3] px-3 py-2 rounded-xl shadow-sm border border-[#D3C4B3]/50">
                <Shield className="w-4 h-4 text-[#7A5912]" />
                <span className="text-xs font-semibold text-[#1E1B19]">Curator Desk</span>
                <button
                  type="button"
                  aria-label="Toggle Curator Mode"
                  onClick={() => setIsCuratorMode(!isCuratorMode)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors relative flex items-center ${
                    isCuratorMode ? 'bg-[#780616]' : 'bg-[#D3C4B3]'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                      isCuratorMode ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Secondary: Print Table QR */}
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#780616] font-medium text-sm shadow-sm border border-[#E9E1DD] hover:bg-[#FAF2EE] hover:border-[#D4AF37]/50 transition-all"
              >
                <QrCode className="w-4 h-4 text-[#780616]" />
                <span>Print Banquet QR</span>
              </button>

              {/* Primary: Inscribe Memories (Upload) */}
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#780616] via-[#910130] to-[#780616] text-white font-medium text-sm shadow-md hover:shadow-lg hover:brightness-110 transition-all"
              >
                <Camera className="w-4 h-4 text-[#FFD9DC]" />
                <span>+ Inscribe Memories</span>
              </button>
            </div>
          </div>

          {/* 4 Live Telemetry Badges */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-2">
            <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#E9E1DD] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#827566] uppercase tracking-wider block font-medium">Total Memories</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1B19]">
                    {telemetry?.totalMemories ?? (photos?.length || 0)}
                  </span>
                  <span className="text-xs text-emerald-700 font-semibold">+24 today</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FAF2EE] flex items-center justify-center text-[#780616] border border-[#E9E1DD]">
                <ImageIcon className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#E9E1DD] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#827566] uppercase tracking-wider block font-medium">Ritual Albums</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1B19]">
                    {telemetry?.ritualAlbums || 6}
                  </span>
                  <span className="text-xs text-[#827566]">4 Ceremonies</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FFF8F5] flex items-center justify-center text-[#BF8E42] border border-[#E9E1DD]">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#E9E1DD] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#827566] uppercase tracking-wider block font-medium">Banquet QR Scans</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-[#780616]">
                    {telemetry?.banquetQrScans || 142}
                  </span>
                  <span className="text-xs text-[#780616] font-medium">Tables 1–25</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FFD9DC]/60 flex items-center justify-center text-[#780616] border border-[#E9E1DD]">
                <QrCode className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#E9E1DD] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#827566] uppercase tracking-wider block font-medium">Pending Review</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-[#BF8E42]">
                    {telemetry?.pendingReview ?? 7}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-[#780616] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#780616] animate-pulse"></span>
                    Requires Action
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#EEE7E3] flex items-center justify-center text-[#827566] border border-[#E9E1DD]">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. BANQUET TABLE QR STREAM CALLOUT BANNER                                 */}
      {/* ========================================================================= */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#EEE7E3] via-[#F4ECE8] to-[#FAF2EE] p-5 shadow-sm border border-[#D3C4B3]/50">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
            {/* Left QR badge */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative p-2 bg-white rounded-xl shadow-md border border-[#E9E1DD] shrink-0">
                <span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-[#BF8E42]"></span>
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#BF8E42]"></span>
                <span className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-[#BF8E42]"></span>
                <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-[#BF8E42]"></span>
                <QrCode className="w-12 h-12 text-[#1E1B19]" />
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.2 bg-[#780616] text-white rounded-full text-[9px] uppercase tracking-wider font-semibold shadow-sm flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-white animate-ping"></span> Live
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-semibold text-[#1E1B19]">Banquet Table QR Stream Active</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#FFDDB1] text-[#432A00] text-xs font-semibold">
                    Tables 1–25
                  </span>
                </div>
                <p className="text-xs text-[#4F4538] max-w-xl mt-1 leading-relaxed">
                  Guests across courtyard banquets scan their pass and broadcast high-res memories straight from their
                  smartphone camera with zero login required.
                </p>
              </div>
            </div>

            {/* Right Buttons */}
            <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={handleCopyGuestLink}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-[#1E1B19] text-xs font-medium shadow-sm hover:bg-[#FAF2EE] border border-[#E9E1DD] transition-all"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#BF8E42]" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Guest Stream Link'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#780616] text-white text-xs font-medium shadow-sm hover:bg-[#910130] transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Download Standee Cards</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. STICKY FILTER PILLS CAROUSEL & SEARCH CONTROLS                         */}
      {/* ========================================================================= */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-3 sticky top-16 lg:top-20 z-20 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#E9E1DD]/70">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Responsive Horizontal Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1.5 lg:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Memories', count: telemetry?.totalMemories ?? (photos?.length || 0) },
              { id: 'haldi', label: 'Haldi Radiance', count: 54 },
              { id: 'mehendi', label: 'Mehendi Artistry', count: 68 },
              { id: 'sangeet', label: 'Imperial Sangeet', count: 92 },
              { id: 'muhurat', label: 'Sacred Muhurtham', count: 86 },
              { id: 'reception', label: 'Royal Reception', count: 48 },
              { id: 'candids', label: 'Table Snaps', count: 142 },
            ].map((album) => {
              const active = selectedAlbum === album.id;
              return (
                <button
                  key={album.id}
                  type="button"
                  onClick={() => setSelectedAlbum(album.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#780616] text-white shadow-sm font-semibold'
                      : 'bg-white text-[#4F4538] hover:bg-[#F4ECE8] border border-[#E9E1DD]'
                  }`}
                >
                  <span>{album.label}</span>
                  <span className={`text-[11px] ${active ? 'opacity-80' : 'text-[#827566]'}`}>
                    ({album.count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search, Layout toggles & Sort Dropdown */}
          <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 justify-between lg:justify-end">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#827566]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guests, tags, tables..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-[#E9E1DD] text-xs text-[#1E1B19] placeholder:text-[#827566] focus:outline-none focus:border-[#BF8E42] shadow-sm"
              />
            </div>

            {/* Layout Switcher */}
            <div className="flex items-center bg-white rounded-xl p-0.5 border border-[#E9E1DD] shadow-sm">
              <button
                type="button"
                onClick={() => setViewLayout('masonry')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewLayout === 'masonry' ? 'bg-[#FAF2EE] text-[#780616]' : 'text-[#827566] hover:text-[#1E1B19]'
                }`}
                title="Masonry View"
              >
                <Columns className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewLayout === 'grid' ? 'bg-[#FAF2EE] text-[#780616]' : 'text-[#827566] hover:text-[#1E1B19]'
                }`}
                title="Uniform Grid"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white text-xs text-[#1E1B19] px-3 py-1.5 rounded-xl border border-[#E9E1DD] shadow-sm focus:outline-none focus:border-[#BF8E42]"
            >
              <option value="newest">Newest First</option>
              <option value="most_liked">Most Celebrated (♥)</option>
              <option value="ceremony_order">Ceremony Order</option>
              <option value="pending">Flagged for Review</option>
            </select>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. DYNAMIC MASONRY PHOTO VAULT GALLERY GRID                               */}
      {/* ========================================================================= */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-2 border-[#BF8E42] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="font-serif text-base text-[#7A5912]">Synchronizing Royal Cloudinary Vault...</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#E9E1DD] max-w-lg mx-auto shadow-sm">
            <Camera className="w-12 h-12 text-[#BF8E42] mx-auto mb-3" />
            <h3 className="font-serif text-lg font-semibold text-[#1E1B19]">No Memories Found in This View</h3>
            <p className="text-xs text-[#827566] mt-1">
              {searchQuery ? `No photos match "${searchQuery}".` : 'Be the first to inscribe memories into this royal album.'}
            </p>
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-[#780616] text-white text-xs font-semibold shadow hover:bg-[#910130]"
            >
              + Inscribe First Memory
            </button>
          </div>
        ) : (
          <div
            className={
              viewLayout === 'masonry'
                ? 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6'
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            }
          >
            {filteredPhotos.map((photo, index) => {
              const isApproved = photo.moderationStatus === 'APPROVED';
              const isPending = photo.moderationStatus === 'PENDING';

              return (
                <div
                  key={photo.id}
                  onClick={() => setActiveLightboxIndex(index)}
                  className="break-inside-avoid rounded-2xl bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group relative border border-[#E9E1DD]/80 cursor-pointer"
                >
                  {/* Photo Container */}
                  <div className="relative w-full overflow-hidden bg-[#F4ECE8]">
                    <img
                      src={photo.mediaAsset?.secureUrl}
                      alt={photo.caption || 'Wedding Memory'}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                    {/* Ambient dark gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#780616] text-[11px] font-semibold shadow-sm">
                        {photo.eventName || 'Sacred Vivah'}
                      </span>
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-800/90 backdrop-blur-md text-white text-[11px] font-medium shadow-sm">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-600/95 backdrop-blur-md text-white text-[11px] font-bold shadow-sm animate-pulse">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                    </div>

                    {/* Bottom Image Overlay Meta */}
                    <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none opacity-95 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="font-serif text-base font-semibold leading-tight text-white drop-shadow-md">
                        {photo.caption || 'Royal Vivah Moment'}
                      </p>
                      <p className="text-xs text-stone-200 mt-0.5 line-clamp-1">
                        Captured by {photo.uploader?.name}
                        {photo.uploader?.tableNumber ? ` • ${photo.uploader.tableNumber}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer & Micro Actions */}
                  <div className="p-3.5 flex items-center justify-between bg-white border-t border-[#E9E1DD]/60">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleToggleLike(e, photo.id)}
                        className="flex items-center gap-1.5 text-[#780616] hover:scale-110 transition-transform"
                        title="Celebrate this moment"
                      >
                        <Heart className="w-4 h-4 fill-[#780616]" />
                        <span className="text-xs font-semibold">{photo.likesCount || 0}</span>
                      </button>
                      <span className="text-[#D3C4B3]">•</span>
                      <span className="text-[11px] text-[#827566] truncate max-w-[100px]">
                        {photo.uploader?.cameraModel || 'Royal Camera'}
                      </span>
                    </div>

                    {/* Quick Action Icons */}
                    <div className="flex items-center gap-1 text-[#827566]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveLightboxIndex(index);
                        }}
                        className="p-1.5 hover:text-[#1E1B19] hover:bg-[#FAF2EE] rounded-lg transition-colors"
                        title="Zoom / Lightbox"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <a
                        href={photo.mediaAsset?.secureUrl}
                        download={`wedding_memory_${photo.id}.jpg`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 hover:text-[#1E1B19] hover:bg-[#FAF2EE] rounded-lg transition-colors"
                        title="Download High-Res"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      {isCuratorMode && (
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, photo.id)}
                          className="p-1.5 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Memory"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Moderation Desk Quick Actions Bar (Visible when Curator Desk is on or photo is pending) */}
                  {isCuratorMode && isPending && (
                    <div className="p-2.5 bg-[#FFF8F5] border-t border-[#E9E1DD] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleModerate(e, photo.id, 'APPROVED')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3 h-3" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleModerate(e, photo.id, 'REJECTED')}
                          className="px-2 py-1 rounded-lg bg-[#EEE7E3] text-[#4F4538] text-xs hover:bg-rose-100 hover:text-rose-800 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                      <span className="text-[11px] font-semibold text-[#BF8E42]">Guest Upload</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 5. DOCKED INSCRIBE MEMORIES UPLOAD DRAWER / MODAL                         */}
      {/* ========================================================================= */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#D4AF37]/50 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E9E1DD]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFDDB1]/60 flex items-center justify-center text-[#780616] border border-[#D4AF37]/30">
                  <UploadCloud className="w-5 h-5 text-[#780616]" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#1E1B19]">Inscribe High-Resolution Memories</h2>
                  <p className="text-xs text-[#827566]">
                    Direct master upload to Cloudinary 4K Wedding CDN with instant metadata tagging
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F4ECE8] text-[#827566]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload Form */}
            <form onSubmit={handleUploadSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
              {/* Dropzone Area (Col 7) */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 rounded-2xl border-2 border-dashed border-[#D4AF37]/60 bg-[#FAF7F2] flex flex-col items-center justify-center text-center hover:bg-[#F4ECE8]/60 transition-colors cursor-pointer group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-[#780616] group-hover:scale-110 transition-transform shadow-md mb-3 border border-[#E9E1DD]">
                    <Camera className="w-7 h-7" />
                  </div>
                  <p className="font-serif text-base font-semibold text-[#1E1B19]">
                    {selectedFile ? selectedFile.name : 'Drag & Drop Master Files or Browse'}
                  </p>
                  <p className="text-xs text-[#827566] max-w-sm mt-1">
                    Supports JPG, PNG, HEIC, WebP up to 50MB. Automatic EXIF date & camera metadata extraction enabled.
                  </p>
                  <button
                    type="button"
                    className="mt-4 px-4 py-2 rounded-xl bg-white text-[#780616] text-xs font-semibold shadow-sm border border-[#E9E1DD] hover:bg-[#FAF2EE]"
                  >
                    {selectedFile ? 'Change Selected File' : 'Choose Files from Device'}
                  </button>
                </div>

                {/* Progress indicator during upload */}
                {isUploading && (
                  <div className="p-4 rounded-xl bg-[#F4ECE8] border border-[#D3C4B3]/40 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-medium text-[#1E1B19]">
                      <span className="truncate max-w-[200px]">{selectedFile?.name}</span>
                      <span className="text-[#780616] font-bold">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#E9E1DD] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#780616] to-[#D4AF37] rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-[#827566]">
                      Transmitting directly to Cloudinary Mewar Master CDN Node...
                    </span>
                  </div>
                )}
              </div>

              {/* Metadata Assignment Controls (Col 5) */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#827566] uppercase tracking-wider mb-1">
                      Assign to Ceremony
                    </label>
                    <select
                      value={uploadCeremony}
                      onChange={(e) => setUploadCeremony(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF2EE] border border-[#E9E1DD] text-xs text-[#1E1B19] focus:outline-none focus:border-[#BF8E42]"
                    >
                      <option>Sacred Muhurtham (Jagmandir Island)</option>
                      <option>Imperial Baraat (Lake Promenade)</option>
                      <option>Haldi Radiance (Courtyard)</option>
                      <option>Mehendi Artistry (Zenana Mahal)</option>
                      <option>Imperial Sangeet (Manek Chowk)</option>
                      <option>Royal Reception (Palace Ballrooms)</option>
                      <option>General Candids & Guest Memories</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#827566] uppercase tracking-wider mb-1">
                      Memory Notes & Caption
                    </label>
                    <input
                      type="text"
                      value={uploadCaption}
                      onChange={(e) => setUploadCaption(e.target.value)}
                      placeholder="e.g. Groom arrival under traditional royal umbrella"
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF2EE] border border-[#E9E1DD] text-xs text-[#1E1B19] focus:outline-none focus:border-[#BF8E42]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#827566] uppercase tracking-wider mb-1">
                        Guest / Photographer
                      </label>
                      <input
                        type="text"
                        value={uploadGuestCredit}
                        onChange={(e) => setUploadGuestCredit(e.target.value)}
                        placeholder="e.g. Rohan Varma"
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF2EE] border border-[#E9E1DD] text-xs text-[#1E1B19] focus:outline-none focus:border-[#BF8E42]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#827566] uppercase tracking-wider mb-1">
                        Table Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={uploadTableNumber}
                        onChange={(e) => setUploadTableNumber(e.target.value)}
                        placeholder="e.g. Table 7"
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF2EE] border border-[#E9E1DD] text-xs text-[#1E1B19] focus:outline-none focus:border-[#BF8E42]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#827566] uppercase tracking-wider mb-1.5">
                      Visibility Tier
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-[#1E1B19]">
                        <input
                          type="radio"
                          name="visibility"
                          checked={uploadVisibility === 'PUBLIC'}
                          onChange={() => setUploadVisibility('PUBLIC')}
                          className="accent-[#780616]"
                        />
                        <span>Public to Royal Guest Gallery & Website Stream</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-[#1E1B19]">
                        <input
                          type="radio"
                          name="visibility"
                          checked={uploadVisibility === 'EVENT_ONLY'}
                          onChange={() => setUploadVisibility('EVENT_ONLY')}
                          className="accent-[#780616]"
                        />
                        <span>VIP & Immediate Ceremony Circle Only</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-[#1E1B19]">
                        <input
                          type="radio"
                          name="visibility"
                          checked={uploadVisibility === 'PRIVATE'}
                          onChange={() => setUploadVisibility('PRIVATE')}
                          className="accent-[#780616]"
                        />
                        <span>Curator Private Archive (Unpublished)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Dialog Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E9E1DD]">
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(false)}
                    className="px-4 py-2 rounded-xl text-[#827566] text-xs font-medium hover:bg-[#F4ECE8] transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedFile || isUploading}
                    className="px-6 py-2.5 rounded-xl bg-[#780616] text-white text-xs font-semibold shadow-md hover:bg-[#910130] disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{isUploading ? 'Transmitting...' : 'Save & Inscribe to Vault'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. FULL-SCREEN LIGHTBOX OVERLAY                                           */}
      {/* ========================================================================= */}
      {activeLightboxIndex !== null && photos[activeLightboxIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fadeIn p-4 sm:p-8">
          {/* Top Bar Controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 text-white">
            <div className="flex items-center gap-3">
              <span className="font-serif text-lg font-semibold text-white drop-shadow">
                {photos[activeLightboxIndex].caption || 'Wedding Memory'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#780616] text-white text-[11px] font-semibold">
                {photos[activeLightboxIndex].eventName}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => handleToggleLike(e, photos[activeLightboxIndex].id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs backdrop-blur-md transition-colors"
              >
                <Heart className="w-4 h-4 fill-white" />
                <span>{photos[activeLightboxIndex].likesCount || 0}</span>
              </button>
              <a
                href={photos[activeLightboxIndex].mediaAsset?.secureUrl}
                download={`wedding_4k_${photos[activeLightboxIndex].id}.jpg`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
                title="Download 4K Master"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setActiveLightboxIndex(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Previous Arrow */}
          <button
            type="button"
            onClick={() =>
              setActiveLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1))
            }
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md z-20 transition-all hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Main High-Res Image View */}
          <div className="relative max-w-5xl max-h-[85vh] flex items-center justify-center">
            <img
              src={photos[activeLightboxIndex].mediaAsset?.secureUrl}
              alt={photos[activeLightboxIndex].caption || 'Wedding Master'}
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
            />
          </div>

          {/* Next Arrow */}
          <button
            type="button"
            onClick={() =>
              setActiveLightboxIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0))
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md z-20 transition-all hover:scale-110"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Bottom Metadata Drawer */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-stone-300 text-xs flex items-center gap-4">
            <span>
              Captured by <strong className="text-white">{photos[activeLightboxIndex].uploader?.name}</strong>
            </span>
            <span>•</span>
            <span>{photos[activeLightboxIndex].uploader?.cameraModel || 'Wedding Camera'}</span>
            <span>•</span>
            <span>{photos[activeLightboxIndex].uploader?.tableNumber || 'Main Courtyard'}</span>
            <span>•</span>
            <span className="text-emerald-400">Cloudinary 4K Master</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. PRINTABLE BANQUET TABLE QR STANDEE MODAL                               */}
      {/* ========================================================================= */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#D4AF37]/50">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9E1DD]">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#780616]" />
                <h3 className="font-serif text-lg font-bold text-[#1E1B19]">Banquet Table Standee QR</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F4ECE8] text-[#827566]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Standee Printable Card Preview */}
            <div className="my-6 p-6 rounded-2xl bg-[#FFFDF9] border-2 border-[#D4AF37]/50 text-center shadow-inner relative">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#7A5912] font-semibold block">
                MakeMyMarriage Vivaha Stream
              </span>
              <h4 className="font-serif text-xl font-bold text-[#780616] mt-1">
                {currentWedding?.name || 'The Royal Wedding'}
              </h4>
              <p className="text-xs text-[#827566] mt-0.5">Please Share Your Auspicious Blessings & Candids</p>

              {/* QR Box with Royal Frame */}
              <div className="w-40 h-40 mx-auto my-4 p-3 bg-white rounded-2xl border border-[#E9E1DD] shadow-md flex items-center justify-center relative">
                <QrCode className="w-32 h-32 text-[#1E1B19]" />
                <div className="absolute -bottom-2 bg-[#780616] text-white px-3 py-0.5 rounded-full text-[10px] font-bold shadow">
                  Table {selectedTableForQr}
                </div>
              </div>

              <p className="text-xs font-semibold text-[#1E1B19]">
                Scan with any Smartphone Camera — No App Required!
              </p>
              <p className="text-[11px] text-[#827566] mt-1">
                Photos automatically synchronize directly to the Royal 4K Cloudinary Vault.
              </p>
            </div>

            {/* Select Table Number */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-[#827566] uppercase tracking-wider">
                  Select Banquet Table:
                </label>
                <select
                  value={selectedTableForQr}
                  onChange={(e) => setSelectedTableForQr(e.target.value)}
                  className="px-3 py-1 rounded-lg bg-[#FAF2EE] border border-[#E9E1DD] font-semibold text-[#780616]"
                >
                  {Array.from({ length: 25 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={String(num)}>
                      Table {num}
                    </option>
                  ))}
                  <option value="VIP-Mandap">VIP Mandap Front</option>
                  <option value="Sangeet-Stage">Sangeet Stage Lounge</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyGuestLink}
                  className="flex-1 py-2.5 rounded-xl border border-[#E9E1DD] text-xs font-semibold hover:bg-[#FAF2EE] flex items-center justify-center gap-2"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#BF8E42]" />}
                  <span>{copiedLink ? 'Copied' : 'Copy Web Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 rounded-xl bg-[#780616] text-white text-xs font-semibold shadow hover:bg-[#910130] flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Standee (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. STATUS BAR FOOTER                                                      */}
      {/* ========================================================================= */}
      <footer className="w-full px-4 sm:px-6 lg:px-8 py-6 mt-6 border-t border-[#E9E1DD]/60">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#827566]">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>MakeMyMarriage Imperial Cloudinary Engine • 348 Vaulted Masters • 0 Storage Limit</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="hover:text-[#780616] transition-colors"
            >
              High-Res Print Export
            </button>
            <a
              href={`/w/${currentWedding?.slug || 'ananya-rahul'}#gallery`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#780616] transition-colors flex items-center gap-1"
            >
              <span>View Public Guest Stream</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
