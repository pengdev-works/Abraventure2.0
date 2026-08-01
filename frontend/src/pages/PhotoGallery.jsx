import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Image, ArrowLeft, ZoomIn, Download } from 'lucide-react';
import SafeImage, { formatMediaUrl } from '../components/SafeImage';

const PhotoGallery = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);

  const fetchGalleryData = async () => {
    try {
      const response = await fetch(`/api/municipalities/${id}`);
      if (response.ok) {
        const resData = await response.json();
        setData(resData);
      }
    } catch (err) {
      console.error('Error fetching municipality gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleryData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 min-h-[calc(100vh-16rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-semibold animate-pulse">Loading gallery images...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.municipality) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <p className="text-lg">Municipality not found.</p>
        <Link to="/municipalities" className="text-emerald-950 font-bold hover:underline mt-2 inline-block">Return to list</Link>
      </div>
    );
  }

  const { municipality } = data;
  const galleryImages = municipality.images || [];

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Hero Header */}
      <div
        className="relative overflow-hidden text-white"
        style={{
          background: 'linear-gradient(160deg, #0a2526 0%, #0F3D3E 40%, #1E2A6E 80%, #0d1a3a 100%)',
        }}
      >
        <div className="absolute inset-0 bg-woven-dark opacity-40" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 relative z-10">
          <Link
            to={`/municipalities/${id}`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-xs font-bold uppercase tracking-wider mb-6 transition-colors bg-white/10 hover:bg-white/15 px-4 py-2 rounded-full border border-white/10"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            Back to {municipality.name}
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1 text-amber-400 font-bold text-xs uppercase tracking-widest mb-2">
                <Image className="w-4 h-4" /> Media Gallery
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                {municipality.name} Photo Gallery
              </h1>
              <p className="text-white/60 text-sm mt-2 max-w-xl">
                Explore local sights, natural wonders, and culture from verified DOT and visitor uploads.
              </p>
            </div>
            <div className="text-xs text-white/50 font-bold self-start md:self-end bg-black/20 backdrop-blur px-4 py-2 rounded-xl border border-white/5">
              {galleryImages.length} Verified {galleryImages.length === 1 ? 'photo' : 'photos'}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-slate-50 rounded-t-3xl" />
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {galleryImages.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/60 shadow-sm p-8">
            <Image className="w-16 h-16 mx-auto text-slate-300 mb-4 opacity-50" />
            <h3 className="font-extrabold text-slate-800 text-lg">No Images Uploaded</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Our DOT officers haven't added photos to the gallery yet. Check back soon for beautiful views!
            </p>
            <Link
              to={`/municipalities/${id}`}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              Explore {municipality.name}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {galleryImages.map((img) => (
              <div
                key={img.id}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-200/60 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                  <SafeImage
                    src={img.image_url}
                    alt={`${municipality.name} View`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    fallback="landscape"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-black/40 px-2.5 py-1 rounded-full border border-white/10">
                      {img.is_featured ? '⭐ Featured' : 'Verified'}
                    </span>
                    <button
                      onClick={() => setActiveLightboxImage(img.image_url)}
                      className="p-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-xl shadow-md transition-colors"
                      title="Enlarge View"
                    >
                      <ZoomIn className="w-4 h-4 font-bold" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveLightboxImage(null)}
        >
          <button
            onClick={() => setActiveLightboxImage(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white font-bold text-sm bg-white/10 hover:bg-white/15 px-4 py-2 rounded-full border border-white/10"
          >
            Close View
          </button>
          <div className="max-w-5xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={formatMediaUrl(activeLightboxImage)}
              alt="Enlarged View"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10 bg-black"
            />
            <div className="mt-4 flex justify-between items-center text-white/70 text-xs px-2">
              <span>{municipality.name} — Media Gallery</span>
              <a
                href={activeLightboxImage}
                download
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-amber-400 font-bold hover:underline"
              >
                <Download className="w-3.5 h-3.5" /> Open Original
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
