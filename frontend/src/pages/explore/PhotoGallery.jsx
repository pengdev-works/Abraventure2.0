import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Image, ArrowLeft, ZoomIn, Download, X } from 'lucide-react';
import SafeImage, { formatMediaUrl } from '../../components/common/SafeImage';

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
      <div className="flex justify-center items-center py-24 min-h-[calc(100vh-16rem)] bg-[#FAF7F2]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#153325] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#5A534E] font-semibold">Loading municipal archives...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.municipality) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center text-[#5A534E] bg-[#FAF7F2] min-h-[calc(100vh-16rem)] flex flex-col justify-center items-center">
        <h2 className="font-serif text-2xl font-bold text-[#153325] mb-2">Municipality Not Found</h2>
        <p className="text-xs text-[#5A534E] mb-6">The requested municipality gallery record could not be loaded.</p>
        <Link to="/municipalities" className="btn-editorial-primary px-6 py-2.5 text-xs">
          Return to Municipalities Directory
        </Link>
      </div>
    );
  }

  const { municipality } = data;
  const galleryImages = municipality.images || [];

  return (
    <div className="bg-[#FAF7F2] min-h-screen pb-20 text-[#232120]">
      {/* Editorial Hero Header */}
      <div className="bg-[#153325] text-white pt-12 pb-16 relative overflow-hidden border-b border-[#E8DFC8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link
            to={`/municipalities/${id}`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-xs font-semibold uppercase tracking-wider mb-6 transition-colors bg-white/10 hover:bg-white/15 px-4 py-2 rounded-full border border-white/15"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#B88B2A]" />
            Return to {municipality.name} Overview
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#B88B2A] block mb-1.5">
                PROVINCE OF ABRA • VISUAL ARCHIVE
              </span>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight">
                {municipality.name} Photo Archive
              </h1>
              <p className="text-white/80 text-xs sm:text-sm mt-2 max-w-xl leading-relaxed">
                Official photographic documentation and community landscape captures verified by the Municipal Tourism Desk.
              </p>
            </div>
            <div className="text-xs text-white/70 font-semibold self-start md:self-end bg-white/10 backdrop-blur-xs px-4 py-2 rounded-xl border border-white/15">
              {galleryImages.length} Verified {galleryImages.length === 1 ? 'Photograph' : 'Photographs'}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {galleryImages.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#E8DFC8] p-8 shadow-2xs">
            <Image className="w-12 h-12 mx-auto text-[#DCD5C9] mb-3" />
            <h3 className="font-serif font-bold text-[#153325] text-lg">No Images Uploaded Yet</h3>
            <p className="text-xs text-[#5A534E] mt-1 max-w-xs mx-auto">
              The Municipal Tourism Officer has not uploaded photos for this municipality yet.
            </p>
            <Link
              to={`/municipalities/${id}`}
              className="mt-6 inline-flex items-center gap-2 btn-editorial-primary px-5 py-2.5 text-xs"
            >
              Explore {municipality.name} Details
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {galleryImages.map((img) => (
              <div
                key={img.id}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-2xs hover:shadow-md border border-[#E8DFC8] hover:border-[#153325] transition-all duration-300"
              >
                <div className="aspect-[4/3] bg-[#FAF7F2] overflow-hidden relative">
                  <SafeImage
                    src={img.image_url}
                    alt={`${municipality.name} View`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    fallback="landscape"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3.5">
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider bg-black/50 px-2.5 py-1 rounded-full border border-white/20">
                      {img.is_featured ? '⭐ Featured' : 'Verified'}
                    </span>
                    <button
                      onClick={() => setActiveLightboxImage(img.image_url)}
                      className="p-2 bg-[#B88B2A] hover:bg-[#946E1D] text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                      title="Enlarge View"
                    >
                      <ZoomIn className="w-3.5 h-3.5 font-bold" />
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
          className="fixed inset-0 z-50 bg-[#232120]/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveLightboxImage(null)}
        >
          <button
            onClick={() => setActiveLightboxImage(null)}
            className="absolute top-6 right-6 text-white hover:text-[#B88B2A] font-semibold text-xs bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full border border-white/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <X className="w-4 h-4" /> Close View
          </button>
          <div className="max-w-5xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={formatMediaUrl(activeLightboxImage)}
              alt="Enlarged View"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10 bg-black"
            />
            <div className="mt-3 flex justify-between items-center text-white/80 text-xs px-2">
              <span className="font-serif">{municipality.name} — Provincial Media Archive</span>
              <a
                href={activeLightboxImage}
                download
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[#B88B2A] hover:underline font-semibold"
              >
                <Download className="w-3.5 h-3.5" /> Open Full Resolution
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
