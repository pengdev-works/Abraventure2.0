import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, Polyline, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

import { 
  Search, MapPin, Navigation, Compass, Info, Check, 
  ChevronRight, X, ArrowRight, Heart, Star, Map as MapIcon, 
  Home as HomeIcon, Award, Phone, Mail, Navigation2, RefreshCw, Menu 
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Map Controller Component to Handle Programmatic Map Movements ───────────────
const MapController = ({ center, zoom, bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    } else if (center) {
      map.setView(center, zoom || map.getZoom(), { animate: true, duration: 1 });
    }
  }, [map, center, zoom, bounds]);
  return null;
};

// ─── Custom Cluster Layer Using Vanilla Leaflet.markercluster ─────────────────────
const ClusterLayer = ({ items, onActionClick }) => {
  const map = useMap();
  const mcgRef = useRef(null);

  useEffect(() => {
    if (!map || !items || items.length === 0) return;

    // Remove existing cluster group if any
    if (mcgRef.current) {
      map.removeLayer(mcgRef.current);
    }

    const mcg = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      // Customize cluster marker design
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-900 border-2 border-amber-400 text-white font-extrabold text-xs shadow-lg animate-pulse">
                  ${count}
                 </div>`,
          className: 'custom-cluster-icon',
          iconSize: [40, 40],
        });
      }
    });

    const markerMap = new Map();

    items.forEach((item) => {
      if (!item.latitude || !item.longitude) return;
      const lat = parseFloat(item.latitude);
      const lon = parseFloat(item.longitude);

      // Select icon content based on item type
      const isAttraction = item.type === 'attraction';
      const iconHtml = isAttraction
        ? `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-900 border-2 border-white shadow-md text-white hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mountain"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
           </div>`
        : `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 border-2 border-white shadow-md text-emerald-950 hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
           </div>`;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-div-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([lat, lon], { icon: customIcon });

      // Create Custom Popup HTML Structure
      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-1 min-w-[200px] font-sans';
      
      const imgUrl = item.image_url || (item.images && item.images[0]?.image_url);
      const imgTag = imgUrl
        ? `<img src="${imgUrl}" class="w-full h-24 object-cover rounded-lg mb-2 border border-slate-200" alt="${item.name}" />`
        : `<div class="w-full h-20 bg-slate-100 rounded-lg flex items-center justify-center mb-2 text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>`;

      const typeLabel = isAttraction ? '🏞️ Attraction' : '🏠 Homestay';
      const typeBadge = isAttraction ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200';

      popupDiv.innerHTML = `
        ${imgTag}
        <h4 class="font-extrabold text-slate-800 text-sm leading-snug mb-0.5">${item.name}</h4>
        <span class="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border ${typeBadge} uppercase tracking-wider mb-2">${typeLabel}</span>
        ${item.category ? `<span class="text-[10px] text-slate-500 font-semibold block mb-1">Category: ${item.category}</span>` : ''}
        ${item.address ? `<p class="text-[10px] text-slate-500 truncate mb-2">📍 ${item.address}</p>` : ''}
        
        <div class="flex items-center gap-1.5 pt-1 border-t border-slate-100">
          <button id="pop-detail-${item.id}" class="flex-1 text-[10px] bg-emerald-900 text-white font-extrabold py-1 px-2 rounded hover:bg-emerald-800 transition-all text-center">Details</button>
          <button id="pop-route-${item.id}" class="bg-amber-500 text-emerald-950 font-bold p-1 rounded hover:bg-amber-400 transition-all flex items-center justify-center w-6 h-6" title="Get Directions">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-navigation2"><polygon points="12 2 22 22 12 17 2 22 12 2"/></svg>
          </button>
        </div>
      `;

      marker.bindPopup(popupDiv);

      marker.on('popupopen', () => {
        document.getElementById(`pop-detail-${item.id}`)?.addEventListener('click', () => {
          onActionClick(item, 'details');
        });
        document.getElementById(`pop-route-${item.id}`)?.addEventListener('click', () => {
          onActionClick(item, 'route');
          marker.closePopup();
        });
      });

      mcg.addLayer(marker);
      markerMap.set(item.id, marker);
    });

    map.addLayer(mcg);
    mcgRef.current = mcg;

    // Attach marker-focus controller directly to the window for programmatic calls
    window.focusMarkerOnMap = (id) => {
      const targetMarker = markerMap.get(id);
      if (targetMarker) {
        mcg.zoomToShowLayer(targetMarker, () => {
          targetMarker.openPopup();
          map.setView(targetMarker.getLatLng(), 15, { animate: true });
        });
        return true;
      }
      return false;
    };

    return () => {
      if (mcgRef.current) {
        map.removeLayer(mcgRef.current);
      }
      delete window.focusMarkerOnMap;
    };
  }, [map, items]);

  return null;
};

// ─── Main Interactive Map Page ──────────────────────────────────────────────────
const InteractiveMap = () => {
  // Master API database
  const [data, setData] = useState({ municipalities: [], attractions: [], homestays: [] });
  const [loading, setLoading] = useState(true);

  // GeoJSON Municipalities Borders
  const [geoJsonData, setGeoJsonData] = useState(null);

  // Filter States
  const [activeTab, setActiveTab] = useState('all'); // all | attraction | homestay | directions
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Helper to auto-close sidebar on mobile
  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Map Navigation Focus State
  const [mapCenter, setMapCenter] = useState([17.6000, 120.6200]); // Abra Centroid
  const [mapZoom, setMapZoom] = useState(10);
  const [mapBounds, setMapBounds] = useState(null);

  // Detail Modal / Sidebar Detail View
  const [activeDetailItem, setActiveDetailItem] = useState(null);

  // Routing State
  const [startPoint, setStartPoint] = useState({ lat: null, lon: null, name: '' });
  const [endPoint, setEndPoint] = useState({ lat: null, lon: null, name: '', id: null });
  const [routeLine, setRouteLine] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null); // distance, duration
  const [routeLoading, setRouteLoading] = useState(false);
  const [userGeolocation, setUserGeolocation] = useState(null);

  // Fetch Master Map data from backend
  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const response = await fetch('/api/municipalities/map/data');
        if (response.ok) {
          const resData = await response.json();
          setData({
            municipalities: resData.municipalities || [],
            attractions: resData.attractions || [],
            homestays: resData.homestays || [],
          });
        }
      } catch (err) {
        console.error('Error fetching map data:', err);
        toast.error('Failed to load locations database.');
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();

    // Fetch GeoJSON borders file locally
    fetch('/abra-municipalities.geojson')
      .then(res => res.json())
      .then(geoJson => setGeoJsonData(geoJson))
      .catch(err => {
        console.error('Failed to load GeoJSON:', err);
      });
  }, []);

  // Filter listings based on active tab, selected municipality, and search
  const getFilteredItems = () => {
    const list = [];
    if (activeTab === 'all' || activeTab === 'attraction') {
      data.attractions.forEach(a => list.push({ ...a, type: 'attraction' }));
    }
    if (activeTab === 'all' || activeTab === 'homestay') {
      data.homestays.forEach(h => list.push({ ...h, type: 'homestay' }));
    }

    return list.filter(item => {
      // 1. Municipality filter
      if (selectedMunicipality && !item.isGeoJsonOnly) {
        if (item.municipality_id !== selectedMunicipality.id && item.municipalityId !== selectedMunicipality.id) {
          return false;
        }
      }
      // 2. Search term filter
      if (searchTerm) {
        const nameMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const descMatch = (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        const catMatch = (item.category || '').toLowerCase().includes(searchTerm.toLowerCase());
        const addrMatch = (item.address || '').toLowerCase().includes(searchTerm.toLowerCase());
        return nameMatch || descMatch || catMatch || addrMatch;
      }
      return true;
    });
  };

  // Build autocomplete search suggestions
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const suggestions = [];

    // Municipalities
    data.municipalities.forEach(mun => {
      if (mun.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        suggestions.push({ id: mun.id, name: mun.name, type: 'municipality', data: mun });
      }
    });

    // Attractions
    data.attractions.forEach(att => {
      if (att.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        suggestions.push({ id: att.id, name: att.name, type: 'attraction', data: att });
      }
    });

    // Homestays
    data.homestays.forEach(hom => {
      if (hom.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        suggestions.push({ id: hom.id, name: hom.name, type: 'homestay', data: hom });
      }
    });

    setSearchResults(suggestions.slice(0, 10)); // Cap suggestions to 10
  }, [searchTerm, data]);

  // Handle clicking a search recommendation
  const handleSelectSuggestion = (suggestion) => {
    setSearchTerm('');
    setShowSearchSuggestions(false);
    closeSidebarOnMobile();

    if (suggestion.type === 'municipality') {
      const mun = suggestion.data;
      setSelectedMunicipality(mun);
      
      // Zoom map to the municipality border if available in GeoJSON
      if (geoJsonData) {
        const feature = geoJsonData.features.find(
          f => f.properties.ADM3_EN.toLowerCase() === mun.name.toLowerCase()
        );
        if (feature) {
          // Approximate center or bounds zoom
          const bounds = L.geoJSON(feature).getBounds();
          setMapBounds(bounds);
          return;
        }
      }
      // Fallback
      toast.info(`Filtered by ${mun.name}`);
    } else {
      // It is an attraction or homestay
      const item = suggestion.data;
      const typeLabel = suggestion.type;
      setActiveDetailItem({ ...item, type: typeLabel });

      // Focus map to that marker
      setTimeout(() => {
        if (window.focusMarkerOnMap) {
          const success = window.focusMarkerOnMap(item.id);
          if (!success && item.latitude && item.longitude) {
            setMapCenter([parseFloat(item.latitude), parseFloat(item.longitude)]);
            setMapZoom(15);
          }
        }
      }, 300);
    }
  };

  // GeoJSON style handler
  const geoJsonStyle = (feature) => {
    const isSelected = selectedMunicipality && selectedMunicipality.name.toLowerCase() === feature.properties.ADM3_EN.toLowerCase();
    return {
      fillColor: isSelected ? '#D4AF37' : '#0F3D3E',
      weight: isSelected ? 3 : 1.5,
      opacity: 1,
      color: isSelected ? '#ffffff' : '#D4AF37', // Kaparkan Gold border
      fillOpacity: isSelected ? 0.35 : 0.08,
      dashArray: isSelected ? '' : '3',
    };
  };

  // GeoJSON interaction handler
  const onEachGeoJsonFeature = (feature, layer) => {
    const name = feature.properties.ADM3_EN;
    
    // Bind subtle tooltip
    layer.bindTooltip(name, {
      permanent: false,
      direction: 'center',
      className: 'bg-emerald-950 text-white border border-amber-400 font-extrabold px-2 py-0.5 rounded text-[10px] shadow-md pointer-events-none'
    });

    layer.on({
      mouseover: (e) => {
        const lyr = e.target;
        lyr.setStyle({
          fillColor: '#D4AF37',
          fillOpacity: 0.25,
          weight: 2.5
        });
      },
      mouseout: (e) => {
        const lyr = e.target;
        lyr.setStyle(geoJsonStyle(feature));
      },
      click: (e) => {
        closeSidebarOnMobile();
        const lyr = e.target;
        const mapObj = lyr._map;
        
        mapObj.fitBounds(lyr.getBounds(), { padding: [30, 30] });
        
        const dbMun = data.municipalities.find(m => m.name.toLowerCase() === name.toLowerCase());
        if (dbMun) {
          setSelectedMunicipality(dbMun);
        } else {
          setSelectedMunicipality({ name: name, isGeoJsonOnly: true });
        }
      }
    });
  };

  // Handle marker popup button click events
  const handleMarkerAction = (item, action) => {
    closeSidebarOnMobile();
    if (action === 'details') {
      setActiveDetailItem(item);
    } else if (action === 'route') {
      // Trigger directions with this item as destination
      setEndPoint({
        lat: parseFloat(item.latitude),
        lon: parseFloat(item.longitude),
        name: item.name,
        id: item.id
      });
      setActiveTab('directions');
      
      // Auto-set start to user location or Bangued
      if (userGeolocation) {
        setStartPoint({
          lat: userGeolocation.lat,
          lon: userGeolocation.lon,
          name: 'My Current Location'
        });
      } else {
        setStartPoint({
          lat: 17.5973, // Bangued
          lon: 120.6200,
          name: 'Bangued (Capital)'
        });
      }
    }
  };

  // Get user geolocation with automatic fallback
  const handleAcquireLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    // Secure context check for modern mobile browsers
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      toast.error('Location detection is blocked by your browser on unsecure HTTP connections. Please choose a starting municipality from the dropdown instead.', { duration: 6000 });
      return;
    }

    toast.loading('Acquiring location coordinates...', { id: 'geoloc' });
    
    const options = { enableHighAccuracy: true, timeout: 4000, maximumAge: 0 };

    const success = (pos) => {
      const coords = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        name: 'My Current Location'
      };
      setUserGeolocation(coords);
      setStartPoint(coords);
      toast.success('Successfully detected location!', { id: 'geoloc' });
    };

    const error = (err) => {
      // Retrying with high accuracy disabled
      if (options.enableHighAccuracy) {
        console.warn(`High accuracy geolocation failed (${err.message}). Retrying with standard accuracy...`);
        options.enableHighAccuracy = false;
        options.timeout = 6000;
        navigator.geolocation.getCurrentPosition(success, finalError, options);
      } else {
        finalError(err);
      }
    };

    const finalError = (err) => {
      console.error('Geolocation failed:', err);
      let errMsg = 'Unable to retrieve location. Please select a starting municipality instead.';
      if (err.code === 1) { // PERMISSION_DENIED
        errMsg = 'Location permission denied. Please allow browser location access or select a starting municipality.';
      } else if (err.code === 2) { // POSITION_UNAVAILABLE
        errMsg = 'Position unavailable. Please select a starting municipality from the dropdown instead.';
      } else if (err.code === 3) { // TIMEOUT
        errMsg = 'Location request timed out. Please select a starting municipality from the dropdown instead.';
      }
      toast.error(errMsg, { id: 'geoloc' });
    };

    navigator.geolocation.getCurrentPosition(success, error, options);
  };

  // Calculate driving route using OSRM client-side
  useEffect(() => {
    if (!startPoint.lat || !endPoint.lat) {
      setRouteLine(null);
      setRouteSummary(null);
      return;
    }

    const fetchOSRMRoute = async () => {
      setRouteLoading(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${startPoint.lon},${startPoint.lat};${endPoint.lon},${endPoint.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('OSRM service failed to route.');
        
        const routeData = await res.json();
        
        if (routeData.code === 'Ok' && routeData.routes && routeData.routes.length > 0) {
          const route = routeData.routes[0];
          // Coordinates in OSRM GeoJSON geometry are [lon, lat], Leaflet wants [lat, lon]
          const coordList = route.geometry.coordinates.map(c => [c[1], c[0]]);
          
          setRouteLine(coordList);
          
          const distanceKm = (route.distance / 1000).toFixed(1);
          const durationMins = Math.round(route.duration / 60);
          const durationText = durationMins > 60 
            ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m` 
            : `${durationMins} mins`;

          setRouteSummary({
            distance: distanceKm,
            duration: durationText
          });

          // Zoom map to fit the route bounds
          const routePolyline = L.polyline(coordList);
          setMapBounds(routePolyline.getBounds());
          toast.success(`Route calculated: ${distanceKm} km`);
        } else {
          toast.error('No road route found between selected points.');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to calculate road route.');
      } finally {
        setRouteLoading(false);
      }
    };

    fetchOSRMRoute();
  }, [startPoint, endPoint]);

  // Clean / Reset directions state
  const handleClearRoute = () => {
    setStartPoint({ lat: null, lon: null, name: '' });
    setEndPoint({ lat: null, lon: null, name: '', id: null });
    setRouteLine(null);
    setRouteSummary(null);
  };

  // Reset entire map filters and center
  const handleResetMap = () => {
    setSelectedMunicipality(null);
    setSearchTerm('');
    handleClearRoute();
    setMapCenter([17.6000, 120.6200]);
    setMapZoom(10);
    setMapBounds(null);
    toast.success('Map layout reset successfully.');
  };

  const filteredItems = getFilteredItems();

    return (
    <div className="relative flex h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-50">
      
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-25 transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ─── LEFT SIDEBAR PANEL ────────────────────────────────────────────────────── */}
      <div className={`fixed inset-y-0 left-0 z-35 w-[85vw] max-w-[360px] flex flex-col bg-white border-r border-slate-200/80 shadow-2xl transition-transform duration-300 md:relative md:translate-x-0 md:w-96 md:flex ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Search header container */}
        <div className="p-4 bg-gradient-to-br from-slate-900 to-emerald-950 text-white relative">
          <div className="absolute inset-0 bg-woven-dark opacity-20 pointer-events-none" />
          
          <div className="flex items-center justify-between mb-3.5 relative z-10">
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400 rotate-45" />
              Abra Interactive Map
            </h2>
            
            <div className="flex items-center gap-1.5">
              {/* Reset Map Layout */}
              <button 
                onClick={handleResetMap}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 transition-all"
                title="Reset Map Layout"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Mobile Close Button */}
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden p-1.5 rounded-lg text-white/80 hover:text-white bg-white/10 hover:bg-white/20 transition-all"
                title="Close Sidebar"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Core Autocomplete Search */}
          <div className="relative z-10" onFocus={() => setShowSearchSuggestions(true)}>
            <div className="relative">
              <input
                type="text"
                placeholder="Find attractions, homestays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-white/15 backdrop-blur-md text-white placeholder:text-white/60 text-xs font-medium rounded-xl border border-white/15 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:bg-white focus:text-slate-900 focus:placeholder:text-slate-400 transition-all"
              />
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-white/60 pointer-events-none focus-within:text-slate-400" />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-3.5 top-3 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Suggestions Overlay Dropdown */}
            {showSearchSuggestions && searchResults.length > 0 && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowSearchSuggestions(false)} 
                />
                <div className="absolute left-0 right-0 mt-1.5 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden max-h-80 overflow-y-auto">
                  <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    Matches Found
                  </div>
                  <div className="divide-y divide-slate-50">
                    {searchResults.map(res => (
                      <button
                        key={`${res.type}-${res.id}`}
                        onClick={() => handleSelectSuggestion(res)}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-amber-500/10 flex items-center justify-between transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-3.5 h-3.5 ${
                            res.type === 'municipality' ? 'text-indigo-600' :
                            res.type === 'attraction' ? 'text-emerald-700' : 'text-amber-500'
                          }`} />
                          <span className="text-slate-800 font-bold group-hover:text-emerald-950">{res.name}</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider text-slate-400 font-bold">
                          {res.type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Categories Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-2 gap-1 flex-shrink-0">
          {[
            { id: 'all', label: 'All Listings', icon: Compass },
            { id: 'attraction', label: 'Attractions', icon: MapIcon },
            { id: 'homestay', label: 'Homestays', icon: HomeIcon },
            { id: 'directions', label: 'Directions', icon: Navigation2 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-xl transition-all border ${
                activeTab === tab.id
                  ? 'bg-emerald-900 border-emerald-900 text-white font-bold shadow-md shadow-emerald-900/15'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5 mb-0.5" />
              <span className="text-[10px] tracking-wide">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Selected Filter Info Status */}
        {selectedMunicipality && (
          <div className="px-4 py-2 bg-emerald-50 text-emerald-900 text-xs font-bold flex items-center justify-between border-b border-emerald-100 flex-shrink-0">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
              Scope: {selectedMunicipality.name}
            </span>
            <button 
              onClick={() => setSelectedMunicipality(null)}
              className="text-[10px] text-emerald-600 hover:text-red-500 font-bold uppercase transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Content list body */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/50">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-emerald-900" />
              <p className="font-semibold text-slate-500">Loading map database...</p>
            </div>
          ) : activeTab === 'directions' ? (
            
            /* ─── ROUTING INTERFACE PANEL ─── */
            <div className="p-4 space-y-4">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Navigation className="w-4 h-4 text-emerald-900" />
                  Route Navigation Planner
                </h3>

                {/* Start Location Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Start Point</label>
                  <div className="flex gap-1.5">
                    <select
                      value={startPoint.name === 'My Current Location' ? 'current' : startPoint.id || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'current') {
                          handleAcquireLocation();
                        } else if (val === '') {
                          setStartPoint({ lat: null, lon: null, name: '' });
                        } else {
                          const mun = data.municipalities.find(m => m.id === parseInt(val));
                          if (mun) {
                            let lat = 17.5973;
                            let lon = 120.6200;
                            if (geoJsonData) {
                              const feature = geoJsonData.features.find(
                                f => f.properties.ADM3_EN.toLowerCase() === mun.name.toLowerCase()
                              );
                              if (feature) {
                                const bounds = L.geoJSON(feature).getBounds();
                                const center = bounds.getCenter();
                                lat = center.lat;
                                lon = center.lng;
                              }
                            }
                            setStartPoint({
                              lat: lat,
                              lon: lon,
                              name: `${mun.name} (Centroid)`,
                              id: mun.id
                            });
                          }
                        }
                      }}
                      className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-800 text-slate-800"
                    >
                      <option value="">-- Choose Origin --</option>
                      {userGeolocation && <option value="current">📍 My Current Location</option>}
                      {!userGeolocation && <option value="current">🔍 Detect My Location</option>}
                      {data.municipalities.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Destination Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Destination</label>
                  <select
                    value={endPoint.id || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) {
                        setEndPoint({ lat: null, lon: null, name: '', id: null });
                      } else {
                        // Find matching attraction or homestay
                        const att = data.attractions.find(a => a.id === val);
                        const hom = data.homestays.find(h => h.id === val);
                        const target = att || hom;
                        if (target) {
                          setEndPoint({
                            lat: parseFloat(target.latitude),
                            lon: parseFloat(target.longitude),
                            name: target.name,
                            id: target.id
                          });
                        }
                      }
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-800 text-slate-800"
                  >
                    <option value="">-- Select Destination --</option>
                    <optgroup label="🏞️ Tourist Attractions">
                      {data.attractions.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🏠 Verified Homestays">
                      {data.homestays.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Route Summary Results */}
              {routeLoading && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-950 mb-2" />
                  <span className="text-[10px] font-bold">Calculating optimal route...</span>
                </div>
              )}

              {routeSummary && !routeLoading && (
                <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-4 rounded-2xl shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-woven-dark opacity-15" />
                  <div className="relative z-10">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 mb-3">Trip Summary</h4>
                    <div className="grid grid-cols-2 gap-4 border-b border-white/10 pb-3 mb-3">
                      <div>
                        <span className="text-[10px] text-white/50 font-bold block uppercase">Distance</span>
                        <span className="text-xl font-extrabold">{routeSummary.distance} <span className="text-xs font-medium">km</span></span>
                      </div>
                      <div>
                        <span className="text-[10px] text-white/50 font-bold block uppercase">Travel Time</span>
                        <span className="text-xl font-extrabold">{routeSummary.duration}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-white/80">
                      <span className="text-amber-400 font-extrabold">Route:</span>
                      <span className="truncate">{startPoint.name.split(' (')[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                      <span className="truncate">{endPoint.name}</span>
                    </div>

                    <button
                      onClick={handleClearRoute}
                      className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs rounded-xl shadow transition-all"
                    >
                      Clear Directions
                    </button>
                  </div>
                </div>
              )}

              {!routeSummary && !routeLoading && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center text-slate-400 text-xs">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-500 mb-1">No Active Directions</p>
                  <p className="text-[10px] text-slate-400">Select an origin and destination to chart driving routes, distances, and duration in Abra.</p>
                </div>
              )}
            </div>

          ) : (

            /* ─── STANDARD SIDEBAR CARDS LISTING ─── */
            <div className="p-3 space-y-2.5">
              {filteredItems.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <MapIcon className="w-10 h-10 mx-auto mb-2 opacity-35" />
                  <p className="font-bold">No locations match the filters</p>
                  <p className="text-[10px]">Try clearing search words or scoped boundaries.</p>
                </div>
              ) : (
                filteredItems.map(item => (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => {
                      closeSidebarOnMobile();
                      // Move map directly to this marker
                      if (window.focusMarkerOnMap) {
                        const success = window.focusMarkerOnMap(item.id);
                        if (!success && item.latitude && item.longitude) {
                          setMapCenter([parseFloat(item.latitude), parseFloat(item.longitude)]);
                          setMapZoom(15);
                        }
                      }
                    }}
                    className="p-3 bg-white hover:bg-amber-50/20 border border-slate-200/70 hover:border-amber-400/40 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 group"
                  >
                    <div className="flex gap-3">
                      {/* Image Thumbnail */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                        {item.image_url || (item.images && item.images[0]?.image_url) ? (
                          <img
                            src={item.image_url || (item.images && item.images[0]?.image_url)}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            {item.type === 'attraction' ? <MapIcon className="w-6 h-6" /> : <HomeIcon className="w-6 h-6" />}
                          </div>
                        )}
                      </div>

                      {/* Info Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1 mb-0.5">
                          <h4 className="text-xs font-bold text-slate-800 truncate leading-snug group-hover:text-emerald-950">{item.name}</h4>
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border flex-shrink-0 tracking-wider ${
                            item.type === 'attraction' 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {item.type}
                          </span>
                        </div>
                        
                        <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wide">{item.category || 'Eco-Tourism'}</p>
                        {item.address && (
                          <p className="text-[10px] text-slate-500 truncate mb-2">📍 {item.address}</p>
                        )}

                        {/* Interactive Buttons */}
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDetailItem(item);
                            }}
                            className="text-[10px] text-emerald-800 hover:text-emerald-950 font-extrabold uppercase tracking-wide flex items-center"
                          >
                            Details <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkerAction(item, 'route');
                            }}
                            className="ml-auto text-[10px] bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm transition-all"
                          >
                            <Navigation className="w-2.5 h-2.5 fill-current" />
                            Route
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          )}
        </div>
      </div>

      {/* ─── MAIN MAP DISPLAY AND FLOATING WIDGETS ─────────────────────────────────── */}
      <div className="flex-1 relative h-full">
        
        {/* Floating Mobile Open Sidebar Button */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden absolute top-4 left-4 z-[999] w-10 h-10 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-900 rounded-xl shadow-lg border border-slate-200/80 flex items-center justify-center transition-all hover:scale-105"
          title="Open Sidebar"
        >
          <Menu className="w-5 h-5 text-emerald-950" />
        </button>
        
        {/* Routing overlay floating card */}
        {routeSummary && (
          <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur shadow-2xl rounded-2xl border border-slate-200 p-3 max-w-[280px] hidden md:block animate-fadeSlideDown">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-900 text-white flex items-center justify-center flex-shrink-0">
                <Navigation2 className="w-4 h-4 fill-current rotate-45 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Navigation Route</p>
                <h5 className="text-xs font-bold text-slate-800 truncate mb-1">{endPoint.name}</h5>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-emerald-900">{routeSummary.distance} km</span>
                  <span className="text-[10px] text-slate-400">•</span>
                  <span className="text-xs font-bold text-slate-600">{routeSummary.duration} driving</span>
                </div>
              </div>
              <button 
                onClick={handleClearRoute} 
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Map Controls Floating Widget */}
        <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
          <button
            onClick={handleAcquireLocation}
            className="w-10 h-10 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-900 rounded-xl shadow-lg border border-slate-200/80 flex items-center justify-center transition-all hover:scale-105"
            title="Locate My Position"
          >
            <Navigation className="w-5 h-5 text-emerald-900" />
          </button>
          
          <button
            onClick={() => {
              setMapCenter([17.6000, 120.6200]);
              setMapZoom(10);
              setMapBounds(null);
            }}
            className="w-10 h-10 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-900 rounded-xl shadow-lg border border-slate-200/80 flex items-center justify-center transition-all hover:scale-105"
            title="Reset Map Scope"
          >
            <MapIcon className="w-5 h-5 text-emerald-900" />
          </button>
        </div>

        {/* Map Container Rendering */}
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <ZoomControl position="topright" />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Controller component to handle bounds changes */}
          <MapController center={mapCenter} zoom={mapZoom} bounds={mapBounds} />

          {/* GeoJSON Boundary Polygons Overlay */}
          {geoJsonData && (
            <GeoJSON
              key={selectedMunicipality ? `geojson-selected-${selectedMunicipality.id || selectedMunicipality.name}` : 'geojson-normal'}
              data={geoJsonData}
              style={geoJsonStyle}
              onEachFeature={onEachGeoJsonFeature}
            />
          )}

          {/* Cluster layer component for Attractions and Homestays */}
          <ClusterLayer 
            items={[
              ...data.attractions.map(a => ({ ...a, type: 'attraction' })),
              ...data.homestays.map(h => ({ ...h, type: 'homestay' }))
            ]}
            onActionClick={handleMarkerAction}
          />

          {/* Glowing Polyline Layer for Routing Directions */}
          {routeLine && (
            <>
              {/* Neon Glow underlay */}
              <Polyline
                positions={routeLine}
                color="#f0f9ff"
                weight={8}
                opacity={0.35}
                lineCap="round"
              />
              {/* Outer stroke line */}
              <Polyline
                positions={routeLine}
                color="#4f46e5" // Indigo
                weight={5}
                opacity={0.8}
                lineCap="round"
              />
              {/* Inner glowing core line */}
              <Polyline
                positions={routeLine}
                color="#6366f1"
                weight={2}
                opacity={0.9}
                lineCap="round"
              />
            </>
          )}
        </MapContainer>
      </div>

      {/* ─── LISTING DETAILS DRAWER MODAL ─────────────────────────────────────────── */}
      {activeDetailItem && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 max-w-lg w-full max-h-[85vh] flex flex-col animate-scaleUp">
            
            {/* Image Header */}
            <div className="relative h-56 bg-slate-900">
              {activeDetailItem.image_url || (activeDetailItem.images && activeDetailItem.images[0]?.image_url) ? (
                <img
                  src={activeDetailItem.image_url || (activeDetailItem.images && activeDetailItem.images[0]?.image_url)}
                  alt={activeDetailItem.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <MapIcon className="w-16 h-16 opacity-30" />
                </div>
              )}
              {/* Close Button */}
              <button
                onClick={() => setActiveDetailItem(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur text-white transition-all shadow-md"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-4 z-10">
                <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full border shadow-md ${
                  activeDetailItem.type === 'attraction' 
                    ? 'bg-emerald-900/90 text-white border-emerald-700/50' 
                    : 'bg-amber-500/90 text-emerald-950 border-amber-400/50'
                }`}>
                  {activeDetailItem.type === 'attraction' ? '🏞️ Attraction' : '🏠 Verified Homestay'}
                </span>
              </div>
            </div>

            {/* Scrollable Information Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800 leading-tight mb-1">{activeDetailItem.name}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{activeDetailItem.category || 'Eco-Tourism'}</span>
              </div>

              {activeDetailItem.description && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Overview</span>
                  <p className="text-slate-600 text-xs leading-relaxed font-light">{activeDetailItem.description}</p>
                </div>
              )}

              {activeDetailItem.address && (
                <div className="flex gap-2 items-start py-2 border-t border-b border-slate-100">
                  <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Address Location</span>
                    <span className="text-slate-700 text-xs font-semibold">{activeDetailItem.address}</span>
                  </div>
                </div>
              )}

              {/* Homestay specific contact data */}
              {activeDetailItem.type === 'homestay' && (
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Owner Contact Channels</span>
                  <div className="grid grid-cols-2 gap-3.5">
                    {activeDetailItem.contact_phone && (
                      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <Phone className="w-3.5 h-3.5 text-emerald-800 flex-shrink-0" />
                        <span className="text-[10px] font-bold text-slate-700 truncate">{activeDetailItem.contact_phone}</span>
                      </div>
                    )}
                    {activeDetailItem.contact_email && (
                      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <Mail className="w-3.5 h-3.5 text-emerald-800 flex-shrink-0" />
                        <span className="text-[10px] font-bold text-slate-700 truncate" title={activeDetailItem.contact_email}>{activeDetailItem.contact_email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => {
                  handleMarkerAction(activeDetailItem, 'route');
                  setActiveDetailItem(null);
                }}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all shadow-amber-500/10"
              >
                <Navigation className="w-3.5 h-3.5 fill-current" />
                Navigate Driving Directions
              </button>

              <button
                onClick={() => setActiveDetailItem(null)}
                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default InteractiveMap;
