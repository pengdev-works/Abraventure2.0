import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, Polyline, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

import SafeImage, { formatMediaUrl } from '../../components/common/SafeImage';

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

    if (mcgRef.current) {
      map.removeLayer(mcgRef.current);
    }

    const mcg = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="flex items-center justify-center w-10 h-10 rounded-full bg-[#153325] border-2 border-[#B88B2A] text-white font-bold text-xs shadow-md">
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

      const isAttraction = item.type === 'attraction';
      const iconHtml = isAttraction
        ? `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-[#153325] border-2 border-[#FAF7F2] shadow-md text-white hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
           </div>`
        : `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-[#B88B2A] border-2 border-[#FAF7F2] shadow-md text-[#153325] hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
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
      popupDiv.className = 'p-1 min-w-[210px] font-sans text-left';

      const rawImgUrl = item.image_url || (item.images && item.images[0]?.image_url);
      const imgUrl = formatMediaUrl(rawImgUrl);
      const imgTag = imgUrl
        ? `<img src="${imgUrl}" class="w-full h-24 object-cover rounded-lg mb-2 border border-[#E8DFC8]" alt="${item.name}" />`
        : `<div class="w-full h-20 bg-[#FAF7F2] rounded-lg flex items-center justify-center mb-2 text-[#5A534E]"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>`;

      const typeLabel = isAttraction ? 'Heritage Site / Attraction' : 'Accredited Homestay';
      const typeBadge = isAttraction ? 'bg-[#153325]/10 text-[#153325] border-[#153325]/20' : 'bg-[#B88B2A]/15 text-[#946E1D] border-[#B88B2A]/30';

      popupDiv.innerHTML = `
        ${imgTag}
        <h4 class="font-serif font-bold text-[#153325] text-sm leading-snug mb-1">${item.name}</h4>
        <span class="inline-block text-[9px] font-bold px-2 py-0.5 rounded border ${typeBadge} uppercase tracking-wider mb-2">${typeLabel}</span>
        ${item.category ? `<span class="text-[10px] text-[#5A534E] font-medium block mb-1">Category: ${item.category}</span>` : ''}
        ${item.address ? `<p class="text-[10px] text-[#5A534E] truncate mb-2">📍 ${item.address}</p>` : ''}
        
        <div class="flex items-center gap-2 pt-2 border-t border-[#E8DFC8]">
          <button id="pop-detail-${item.id}" class="flex-1 text-[11px] bg-[#153325] hover:bg-[#1D4433] text-white font-bold py-1.5 px-2 rounded-lg transition-all text-center">View Details</button>
          <button id="pop-route-${item.id}" class="bg-[#B88B2A] hover:bg-[#946E1D] text-white font-bold p-1.5 rounded-lg transition-all flex items-center justify-center w-7 h-7" title="Get Directions">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 22 12 17 2 22 12 2"/></svg>
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
  const [data, setData] = useState({ municipalities: [], attractions: [], homestays: [] });
  const [loading, setLoading] = useState(true);

  // GeoJSON Municipalities Borders
  const [geoJsonData, setGeoJsonData] = useState(null);

  // Filter States
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Map Navigation Focus State
  const [mapCenter, setMapCenter] = useState([17.6000, 120.6200]);
  const [mapZoom, setMapZoom] = useState(10);
  const [mapBounds, setMapBounds] = useState(null);

  // Detail Modal
  const [activeDetailItem, setActiveDetailItem] = useState(null);

  // Routing State
  const [startPoint, setStartPoint] = useState({ lat: null, lon: null, name: '' });
  const [endPoint, setEndPoint] = useState({ lat: null, lon: null, name: '', id: null });
  const [routeLine, setRouteLine] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null);
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

    fetch('/abra-municipalities.geojson')
      .then(res => res.json())
      .then(geoJson => setGeoJsonData(geoJson))
      .catch(err => {
        console.error('Failed to load GeoJSON:', err);
      });
  }, []);

  const getFilteredItems = () => {
    const list = [];
    if (activeTab === 'all' || activeTab === 'attraction') {
      data.attractions.forEach(a => list.push({ ...a, type: 'attraction' }));
    }
    if (activeTab === 'all' || activeTab === 'homestay') {
      data.homestays.forEach(h => list.push({ ...h, type: 'homestay' }));
    }

    return list.filter(item => {
      if (selectedMunicipality && !item.isGeoJsonOnly) {
        if (item.municipality_id !== selectedMunicipality.id && item.municipalityId !== selectedMunicipality.id) {
          return false;
        }
      }
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

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const suggestions = [];

    data.municipalities.forEach(mun => {
      if (mun.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        suggestions.push({ id: mun.id, name: mun.name, type: 'municipality', data: mun });
      }
    });

    data.attractions.forEach(att => {
      if (att.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        suggestions.push({ id: att.id, name: att.name, type: 'attraction', data: att });
      }
    });

    data.homestays.forEach(hom => {
      if (hom.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        suggestions.push({ id: hom.id, name: hom.name, type: 'homestay', data: hom });
      }
    });

    setSearchResults(suggestions.slice(0, 10));
  }, [searchTerm, data]);

  const handleSelectSuggestion = (suggestion) => {
    setSearchTerm('');
    setShowSearchSuggestions(false);
    closeSidebarOnMobile();

    if (suggestion.type === 'municipality') {
      const mun = suggestion.data;
      setSelectedMunicipality(mun);

      if (geoJsonData) {
        const feature = geoJsonData.features.find(
          f => f.properties.ADM3_EN.toLowerCase() === mun.name.toLowerCase()
        );
        if (feature) {
          const bounds = L.geoJSON(feature).getBounds();
          setMapBounds(bounds);
          return;
        }
      }
      toast.info(`Filtered by ${mun.name}`);
    } else {
      const item = suggestion.data;
      const typeLabel = suggestion.type;
      setActiveDetailItem({ ...item, type: typeLabel });

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

  const geoJsonStyle = (feature) => {
    const isSelected = selectedMunicipality && selectedMunicipality.name.toLowerCase() === feature.properties.ADM3_EN.toLowerCase();
    return {
      fillColor: isSelected ? '#B88B2A' : '#153325',
      weight: isSelected ? 3 : 1.5,
      opacity: 1,
      color: isSelected ? '#FAF7F2' : '#B88B2A',
      fillOpacity: isSelected ? 0.35 : 0.08,
      dashArray: isSelected ? '' : '3',
    };
  };

  const onEachGeoJsonFeature = (feature, layer) => {
    const name = feature.properties.ADM3_EN;

    layer.bindTooltip(name, {
      permanent: false,
      direction: 'center',
      className: 'bg-[#153325] text-white border border-[#B88B2A] font-bold px-2 py-0.5 rounded text-[10px] shadow-sm pointer-events-none'
    });

    layer.on({
      mouseover: (e) => {
        const lyr = e.target;
        lyr.setStyle({
          fillColor: '#B88B2A',
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

  const handleMarkerAction = (item, action) => {
    closeSidebarOnMobile();
    if (action === 'details') {
      setActiveDetailItem(item);
    } else if (action === 'route') {
      setEndPoint({
        lat: parseFloat(item.latitude),
        lon: parseFloat(item.longitude),
        name: item.name,
        id: item.id
      });
      setActiveTab('directions');

      if (userGeolocation) {
        setStartPoint({
          lat: userGeolocation.lat,
          lon: userGeolocation.lon,
          name: 'My Current Location'
        });
      } else {
        setStartPoint({
          lat: 17.5973,
          lon: 120.6200,
          name: 'Bangued (Capital)'
        });
      }
    }
  };

  const handleAcquireLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      toast.error('Location detection requires secure connection. Please choose origin municipality below.', { duration: 6000 });
      return;
    }

    toast.loading('Acquiring location coordinates...', { id: 'geoloc' });

    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

    const success = (pos) => {
      const coords = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        name: 'My Current Location'
      };
      setUserGeolocation(coords);
      setStartPoint(coords);
      toast.success('Location detected!', { id: 'geoloc' });
    };

    const error = (err) => {
      if (options.enableHighAccuracy) {
        options.enableHighAccuracy = false;
        options.timeout = 15000;
        navigator.geolocation.getCurrentPosition(success, finalError, options);
      } else {
        finalError(err);
      }
    };

    const finalError = (err) => {
      console.error('Geolocation failed:', err);
      let errMsg = 'Location retrieval timed out.';
      if (err.code === 1) errMsg = 'Location permission denied.';
      else if (err.code === 2) errMsg = 'Position unavailable.';

      setStartPoint({
        lat: 17.5973,
        lon: 120.6200,
        name: 'Bangued (Capital - Fallback)'
      });

      toast.error(`${errMsg} Defaulting start to Bangued.`, { id: 'geoloc', duration: 5000 });
    };

    navigator.geolocation.getCurrentPosition(success, error, options);
  };

  useEffect(() => {
    if (!startPoint.lat || !endPoint.lat) {
      setRouteLine(null);
      setRouteSummary(null);
      return;
    }

    const calculateFallbackRoute = () => {
      const lat1 = startPoint.lat;
      const lon1 = startPoint.lon;
      const lat2 = endPoint.lat;
      const lon2 = endPoint.lon;

      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = (R * c).toFixed(1);

      const coordList = [
        [lat1, lon1],
        [lat2, lon2]
      ];

      setRouteLine(coordList);
      setRouteSummary({
        distance: distanceKm,
        duration: 'Direct aerial path',
        isFallback: true
      });

      const routePolyline = L.polyline(coordList);
      setMapBounds(routePolyline.getBounds());
      toast.success(`Calculated straight path: ${distanceKm} km`);
    };

    const fetchOSRMRoute = async () => {
      setRouteLoading(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${startPoint.lon},${startPoint.lat};${endPoint.lon},${endPoint.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('OSRM service failed to route.');

        const routeData = await res.json();

        if (routeData.code === 'Ok' && routeData.routes && routeData.routes.length > 0) {
          const route = routeData.routes[0];
          const coordList = route.geometry.coordinates.map(c => [c[1], c[0]]);

          setRouteLine(coordList);

          const distanceKm = (route.distance / 1000).toFixed(1);
          const durationMins = Math.round(route.duration / 60);
          const durationText = durationMins > 60
            ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`
            : `${durationMins} mins`;

          setRouteSummary({
            distance: distanceKm,
            duration: durationText,
            isFallback: false
          });

          const routePolyline = L.polyline(coordList);
          setMapBounds(routePolyline.getBounds());
          toast.success(`Route calculated: ${distanceKm} km`);
        } else {
          calculateFallbackRoute();
        }
      } catch (err) {
        console.error('OSRM service error:', err);
        calculateFallbackRoute();
      } finally {
        setRouteLoading(false);
      }
    };

    fetchOSRMRoute();
  }, [startPoint, endPoint]);

  const handleClearRoute = () => {
    setStartPoint({ lat: null, lon: null, name: '' });
    setEndPoint({ lat: null, lon: null, name: '', id: null });
    setRouteLine(null);
    setRouteSummary(null);
  };

  const handleResetMap = () => {
    setSelectedMunicipality(null);
    setSearchTerm('');
    handleClearRoute();
    setMapCenter([17.6000, 120.6200]);
    setMapZoom(10);
    setMapBounds(null);
    toast.success('Map layout reset.');
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="relative flex h-[calc(100vh-64px)] w-full overflow-hidden bg-[#FAF7F2]">

      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-[#232120]/50 backdrop-blur-xs z-[9990] transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ─── LEFT SIDEBAR PANEL ─── */}
      <div className={`fixed inset-y-0 left-0 z-[9999] w-[85vw] max-w-[370px] flex flex-col bg-white border-r border-[#E8DFC8] shadow-xl transition-transform duration-300 md:relative md:translate-x-0 md:w-96 md:flex ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Sidebar Header Container */}
        <div className="p-4 bg-[#153325] text-white relative">
          <div className="flex items-center justify-between mb-3.5 relative z-10">
            <div>
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#B88B2A] font-semibold block">Cartographic Explorer</span>
              <h2 className="font-serif text-base font-bold flex items-center gap-2 text-white">
                <Compass className="w-4 h-4 text-[#B88B2A]" /> Abra Interactive Map
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleResetMap}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 transition-all cursor-pointer"
                title="Reset Map Layout"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden p-1.5 rounded-lg text-white/80 hover:text-white bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
                title="Close Sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Autocomplete Search */}
          <div className="relative z-10" onFocus={() => setShowSearchSuggestions(true)}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search waterfalls, churches, homestays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-white/10 text-white placeholder:text-white/50 text-xs rounded-xl border border-white/15 focus:outline-none focus:bg-white focus:text-[#232120] focus:placeholder:text-[#5A534E] transition-all"
              />
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-white/60 pointer-events-none" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-white/60 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
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
                <div className="absolute left-0 right-0 mt-1.5 bg-white text-[#232120] rounded-xl shadow-xl border border-[#E8DFC8] z-50 overflow-hidden max-h-80 overflow-y-auto">
                  <div className="px-3 py-1.5 bg-[#FAF7F2] text-[9px] font-bold text-[#5A534E] uppercase tracking-widest border-b border-[#E8DFC8]">
                    Verified Matches
                  </div>
                  <div className="divide-y divide-[#F3ECE0]">
                    {searchResults.map(res => (
                      <button
                        key={`${res.type}-${res.id}`}
                        onClick={() => handleSelectSuggestion(res)}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-[#FAF7F2] flex items-center justify-between transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-3.5 h-3.5 ${res.type === 'municipality' ? 'text-[#153325]' :
                              res.type === 'attraction' ? 'text-[#153325]' : 'text-[#B88B2A]'
                            }`} />
                          <span className="text-[#232120] font-bold group-hover:text-[#153325]">{res.name}</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider text-[#5A534E] font-bold bg-[#FAF7F2] border-[#E8DFC8]">
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
        <div className="flex border-b border-[#E8DFC8] bg-[#FAF7F2] p-2 gap-1 flex-shrink-0">
          {[
            { id: 'all', label: 'All Items', icon: Compass },
            { id: 'attraction', label: 'Attractions', icon: MapIcon },
            { id: 'homestay', label: 'Homestays', icon: HomeIcon },
            { id: 'directions', label: 'Route', icon: Navigation2 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-xl transition-all border text-xs cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#153325] border-[#153325] text-white font-bold shadow-xs'
                  : 'bg-white border-[#E8DFC8] text-[#5A534E] hover:bg-[#F3ECE0] font-medium'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5 mb-0.5" />
              <span className="text-[10px] tracking-wide">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Selected Municipality Filter Scope */}
        {selectedMunicipality && (
          <div className="bg-[#FAF7F2] border-b border-[#E8DFC8] p-3 flex flex-col gap-1.5 flex-shrink-0">
            <div className="flex items-center justify-between text-xs font-bold text-[#153325]">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#B88B2A]" />
                Scope: {selectedMunicipality.name}
              </span>
              <button
                onClick={() => setSelectedMunicipality(null)}
                className="text-[10px] text-[#5A534E] hover:text-red-700 font-bold uppercase transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
            {selectedMunicipality.id && (
              <Link
                to={`/municipalities/${selectedMunicipality.id}`}
                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-white hover:bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-[10px] font-bold text-[#153325] shadow-2xs transition-all"
              >
                View Full {selectedMunicipality.name} Page
                <ChevronRight className="w-3 h-3 text-[#B88B2A]" />
              </Link>
            )}
          </div>
        )}

        {/* Content list body */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#5A534E] text-xs gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#153325]" />
              <p className="font-semibold">Loading map database...</p>
            </div>
          ) : activeTab === 'directions' ? (

            /* Routing Interface Panel */
            <div className="p-4 space-y-4">
              <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DFC8] space-y-3">
                <h3 className="font-serif text-xs font-bold text-[#153325] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#E8DFC8] pb-2">
                  <Navigation className="w-3.5 h-3.5 text-[#B88B2A]" />
                  Expedition Routing Guide
                </h3>

                {/* Start Location Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#5A534E] uppercase tracking-wider">Start Point</label>
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
                    className="w-full p-2 bg-white border border-[#DCD5C9] rounded-lg text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                  >
                    <option value="">-- Choose Starting Point --</option>
                    {userGeolocation && <option value="current">📍 My Current Location</option>}
                    {!userGeolocation && <option value="current">🔍 Detect My Location</option>}
                    {data.municipalities.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* Destination Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#5A534E] uppercase tracking-wider">Destination</label>
                  <select
                    value={endPoint.id || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) {
                        setEndPoint({ lat: null, lon: null, name: '', id: null });
                      } else {
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
                    className="w-full p-2 bg-white border border-[#DCD5C9] rounded-lg text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
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
                <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-[#E8DFC8] flex flex-col items-center justify-center text-[#5A534E] gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#153325]" />
                  <span className="text-xs font-semibold">Calculating optimal trail route...</span>
                </div>
              )}

              {routeSummary && !routeLoading && (
                <div className="bg-[#153325] text-white p-4 rounded-2xl border border-[#1D4433] shadow-sm space-y-3">
                  <div>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#B88B2A] font-bold block mb-1">
                      Route Trajectory
                    </span>
                    <div className="grid grid-cols-2 gap-4 border-b border-white/10 pb-3 mb-3">
                      <div>
                        <span className="text-[10px] text-white/60 font-medium block">Distance</span>
                        <span className="font-serif text-2xl font-bold text-white">{routeSummary.distance} <span className="text-xs font-normal">km</span></span>
                      </div>
                      <div>
                        <span className="text-[10px] text-white/60 font-medium block">Est. Duration</span>
                        <span className="font-serif text-2xl font-bold text-[#B88B2A]">{routeSummary.duration}</span>
                      </div>
                    </div>

                    {routeSummary.isFallback && (
                      <div className="mb-3 p-2.5 bg-white/10 border border-[#B88B2A]/40 rounded-xl text-[10px] text-white/90 leading-relaxed">
                        ⚠️ Aerial Straight-Line: Local terrain/mountain trail requires guided 4x4 or trekking approach.
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 mb-3 text-xs text-white/80">
                      <span className="font-semibold truncate">{startPoint.name.split(' (')[0]}</span>
                      <ArrowRight className="w-3 h-3 text-[#B88B2A] flex-shrink-0" />
                      <span className="font-semibold truncate">{endPoint.name}</span>
                    </div>

                    <button
                      onClick={handleClearRoute}
                      className="w-full py-2 btn-editorial-outline text-xs tracking-wider border-white/20 text-white hover:bg-white/10 cursor-pointer"
                    >
                      Clear Directions
                    </button>
                  </div>
                </div>
              )}

              {!routeSummary && !routeLoading && (
                <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-[#E8DFC8] text-center text-[#5A534E] text-xs">
                  <MapPin className="w-6 h-6 mx-auto mb-2 text-[#B88B2A]" />
                  <p className="font-serif font-bold text-[#153325] text-sm mb-1">Select Waypoints</p>
                  <p className="text-[11px] text-[#5A534E]">Choose origin and destination above to calculate driving route, distances, and duration in Abra.</p>
                </div>
              )}
            </div>

          ) : (

            /* Standard Listing Cards */
            <div className="p-3 space-y-2.5">
              {filteredItems.length === 0 ? (
                <div className="py-16 text-center text-[#5A534E] text-xs">
                  <MapIcon className="w-8 h-8 mx-auto mb-2 text-[#DCD5C9]" />
                  <p className="font-serif font-bold text-sm text-[#153325]">No locations found</p>
                  <p className="text-[11px] mt-1 text-[#5A534E]">Try clearing search filters or selecting another category.</p>
                </div>
              ) : (
                filteredItems.map(item => (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => {
                      closeSidebarOnMobile();
                      if (window.focusMarkerOnMap) {
                        const success = window.focusMarkerOnMap(item.id);
                        if (!success && item.latitude && item.longitude) {
                          setMapCenter([parseFloat(item.latitude), parseFloat(item.longitude)]);
                          setMapZoom(15);
                        }
                      }
                    }}
                    className="p-3 bg-[#FAF7F2] hover:bg-white border border-[#E8DFC8] hover:border-[#153325] rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-white flex-shrink-0 border border-[#E8DFC8]">
                        {item.image_url || (item.images && item.images[0]?.image_url) ? (
                          <img
                            src={item.image_url || (item.images && item.images[0]?.image_url)}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#9E978E]">
                            {item.type === 'attraction' ? <MapIcon className="w-5 h-5" /> : <HomeIcon className="w-5 h-5" />}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1 mb-0.5">
                          <h4 className="font-serif font-bold text-xs text-[#153325] truncate leading-snug group-hover:text-[#B88B2A]">
                            {item.name}
                          </h4>
                          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border flex-shrink-0 tracking-wider ${
                            item.type === 'attraction'
                              ? 'bg-[#153325]/10 text-[#153325] border-[#153325]/20'
                              : 'bg-[#B88B2A]/15 text-[#946E1D] border-[#B88B2A]/30'
                          }`}>
                            {item.type}
                          </span>
                        </div>

                        <p className="text-[10px] text-[#5A534E] mb-1 font-medium">{item.category || 'Eco-Tourism Site'}</p>
                        {item.address && (
                          <p className="text-[10px] text-[#5A534E] truncate mb-2">📍 {item.address}</p>
                        )}

                        <div className="flex gap-2 items-center pt-1 border-t border-[#E8DFC8]/60">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDetailItem(item);
                            }}
                            className="text-[10px] text-[#153325] hover:text-[#B88B2A] font-bold uppercase tracking-wider flex items-center gap-0.5 cursor-pointer"
                          >
                            Details <ChevronRight className="w-3 h-3" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkerAction(item, 'route');
                            }}
                            className="ml-auto text-[10px] bg-[#B88B2A] hover:bg-[#946E1D] text-white font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
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

      {/* ─── MAIN MAP DISPLAY ─── */}
      <div className="flex-1 relative h-full">

        {/* Floating Mobile Open Sidebar Button */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden absolute top-4 left-4 z-[9999] pointer-events-auto w-10 h-10 bg-white text-[#153325] rounded-xl shadow-md border border-[#E8DFC8] flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
          title="Open Sidebar"
        >
          <Menu className="w-5 h-5 text-[#153325]" />
        </button>

        {/* Routing overlay floating card */}
        {routeSummary && (
          <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-[#E8DFC8] p-3 max-w-[280px] hidden md:block animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#153325] text-white flex items-center justify-center flex-shrink-0">
                <Navigation2 className="w-4 h-4 fill-current text-[#B88B2A]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-[#5A534E] font-bold uppercase tracking-wider">Active Route</p>
                <h5 className="font-serif font-bold text-xs text-[#153325] truncate mb-0.5">{endPoint.name}</h5>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#153325]">{routeSummary.distance} km</span>
                  <span className="text-[10px] text-[#5A534E]">•</span>
                  <span className="text-xs text-[#5A534E]">{routeSummary.isFallback ? 'Aerial trail' : `${routeSummary.duration} driving`}</span>
                </div>
              </div>
              <button
                onClick={handleClearRoute}
                className="text-[#9E978E] hover:text-[#232120] p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Map Controls */}
        <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
          <button
            onClick={handleAcquireLocation}
            className="w-10 h-10 bg-white hover:bg-[#FAF7F2] text-[#153325] rounded-xl shadow-md border border-[#E8DFC8] flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
            title="Locate My Position"
          >
            <Navigation className="w-4 h-4 text-[#153325]" />
          </button>

          <button
            onClick={() => {
              setMapCenter([17.6000, 120.6200]);
              setMapZoom(10);
              setMapBounds(null);
            }}
            className="w-10 h-10 bg-white hover:bg-[#FAF7F2] text-[#153325] rounded-xl shadow-md border border-[#E8DFC8] flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
            title="Reset Map Scope"
          >
            <MapIcon className="w-4 h-4 text-[#153325]" />
          </button>
        </div>

        {/* Leaflet Map */}
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

          <MapController center={mapCenter} zoom={mapZoom} bounds={mapBounds} />

          {geoJsonData && (
            <GeoJSON
              key={selectedMunicipality ? `geojson-selected-${selectedMunicipality.id || selectedMunicipality.name}` : 'geojson-normal'}
              data={geoJsonData}
              style={geoJsonStyle}
              onEachFeature={onEachGeoJsonFeature}
            />
          )}

          <ClusterLayer
            items={[
              ...data.attractions.map(a => ({ ...a, type: 'attraction' })),
              ...data.homestays.map(h => ({ ...h, type: 'homestay' }))
            ]}
            onActionClick={handleMarkerAction}
          />

          {routeLine && (
            <>
              <Polyline
                positions={routeLine}
                color="#FAF7F2"
                weight={8}
                opacity={0.6}
                lineCap="round"
                dashArray={routeSummary?.isFallback ? "8, 8" : undefined}
              />
              <Polyline
                positions={routeLine}
                color={routeSummary?.isFallback ? "#B88B2A" : "#153325"}
                weight={4}
                opacity={0.9}
                lineCap="round"
                dashArray={routeSummary?.isFallback ? "8, 8" : undefined}
              />
            </>
          )}
        </MapContainer>
      </div>

      {/* ─── LISTING DETAILS MODAL ─── */}
      {activeDetailItem && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-[#232120]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-[#E8DFC8] max-w-lg w-full max-h-[85vh] flex flex-col animate-scaleUp">

            {/* Image Header */}
            <div className="relative h-56 bg-[#153325]">
              {activeDetailItem.image_url || (activeDetailItem.images && activeDetailItem.images[0]?.image_url) ? (
                <img
                  src={activeDetailItem.image_url || (activeDetailItem.images && activeDetailItem.images[0]?.image_url)}
                  alt={activeDetailItem.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/40">
                  <MapIcon className="w-12 h-12" />
                </div>
              )}
              <button
                onClick={() => setActiveDetailItem(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-[#232120]/60 hover:bg-[#232120] text-white transition-all shadow-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 left-4 z-10">
                <span className={`text-[9px] font-bold uppercase px-3 py-1 rounded-full border shadow-sm ${
                  activeDetailItem.type === 'attraction'
                    ? 'bg-[#153325] text-white border-white/20'
                    : 'bg-[#B88B2A] text-white border-white/20'
                }`}>
                  {activeDetailItem.type === 'attraction' ? '🏞️ Heritage Site / Attraction' : '🏠 Verified Homestay'}
                </span>
              </div>
            </div>

            {/* Information Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#153325] leading-tight mb-1">{activeDetailItem.name}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A534E]">{activeDetailItem.category || 'Eco-Tourism Site'}</span>
              </div>

              {activeDetailItem.description && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#5A534E] uppercase tracking-wider block">Overview</span>
                  <p className="text-[#5A534E] text-xs leading-relaxed">{activeDetailItem.description}</p>
                </div>
              )}

              {activeDetailItem.video_url && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold text-[#B88B2A] uppercase tracking-wider block">Video Showcase</span>
                  <video
                    src={formatMediaUrl(activeDetailItem.video_url)}
                    controls
                    className="w-full max-h-48 object-cover rounded-xl border border-[#E8DFC8] bg-black shadow-sm"
                  />
                </div>
              )}

              {activeDetailItem.address && (
                <div className="flex gap-2 items-start py-2.5 border-t border-b border-[#F3ECE0]">
                  <MapPin className="w-4 h-4 text-[#B88B2A] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-[#5A534E] uppercase tracking-wider block">Location Address</span>
                    <span className="text-[#232120] text-xs font-semibold">{activeDetailItem.address}</span>
                  </div>
                </div>
              )}

              {activeDetailItem.type === 'homestay' && (
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold text-[#5A534E] uppercase tracking-wider block">Direct Contact Channels</span>
                  <div className="grid grid-cols-2 gap-3">
                    {activeDetailItem.contact_phone && (
                      <div className="flex items-center gap-2 p-2 bg-[#FAF7F2] rounded-lg border border-[#E8DFC8]">
                        <Phone className="w-3.5 h-3.5 text-[#153325] flex-shrink-0" />
                        <span className="text-xs font-bold text-[#232120] truncate">{activeDetailItem.contact_phone}</span>
                      </div>
                    )}
                    {activeDetailItem.contact_email && (
                      <div className="flex items-center gap-2 p-2 bg-[#FAF7F2] rounded-lg border border-[#E8DFC8]">
                        <Mail className="w-3.5 h-3.5 text-[#153325] flex-shrink-0" />
                        <span className="text-xs font-bold text-[#232120] truncate" title={activeDetailItem.contact_email}>{activeDetailItem.contact_email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-[#FAF7F2] border-t border-[#E8DFC8] flex gap-3">
              <button
                onClick={() => {
                  handleMarkerAction(activeDetailItem, 'route');
                  setActiveDetailItem(null);
                }}
                className="flex-1 py-2.5 btn-editorial-gold text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5 fill-current" />
                Navigate Driving Directions
              </button>

              <button
                onClick={() => setActiveDetailItem(null)}
                className="px-5 py-2.5 btn-editorial-ghost text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default InteractiveMap;
