import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import './LocationPickerModal.css';

// ✅ Use the API Key from your .env file
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const LIBRARIES = ['places'];

const defaultCenter = {
  lat: 31.0461, // Israel Center
  lng: 34.8516
};

const LocationPickerModal = ({ isOpen, onClose, onLocationSelect }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES
  });

  const [map, setMap] = useState(null);
  const [selectedCoord, setSelectedCoord] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  
  // ✅ NEW: Full Screen State
  const [isFullScreen, setIsFullScreen] = useState(false);

  const autocompleteRef = useRef(null);

  const onLoad = useCallback(function callback(mapInstance) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  // ✅ Toggle Full Screen & Resize Map
  const toggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
    
    // Nudge the map to resize correctly after the transition
    setTimeout(() => {
      if (map) {
        const currCenter = map.getCenter();
        window.google.maps.event.trigger(map, 'resize');
        map.setCenter(currCenter);
      }
    }, 300);
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      
      if (!place.geometry || !place.geometry.location) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const newPos = { lat, lng };
        
      setSelectedCoord(newPos);
      if (map) {
        map.panTo(newPos);
        map.setZoom(15);
      }
    }
  };

  const handleMapClick = (e) => {
    setSelectedCoord({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  };

  const handleConfirm = async () => {
    if (!selectedCoord) return;
    setLoadingAddress(true);
    try {
      const [enRes, arRes, heRes] = await Promise.all([
        fetchAddress(selectedCoord.lat, selectedCoord.lng, 'en'),
        fetchAddress(selectedCoord.lat, selectedCoord.lng, 'ar'),
        fetchAddress(selectedCoord.lat, selectedCoord.lng, 'he')
      ]);

      onLocationSelect({
        en: enRes,
        ar: arRes,
        he: heRes,
        coords: selectedCoord
      });
      onClose();
    } catch (error) {
      console.error("Geocoding failed", error);
    } finally {
      setLoadingAddress(false);
    }
  };

  const fetchAddress = async (lat, lng, lang) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=${lang}`
      );
      const data = await response.json();
      return data.results && data.results.length > 0 ? data.results[0].formatted_address : "";
    } catch (err) { return ""; }
  };

  if (!isOpen) return null;

  return (
    <div className={`location-modal-overlay ${isFullScreen ? 'fullscreen-mode' : ''}`}>
      <div className={`location-modal-content ${isFullScreen ? 'fullscreen' : ''}`}>
        
        {/* Header */}
        <div className="location-modal-header">
          <h3>Select Location</h3>
          
          <div className="header-actions-group">
            {/* ✅ Full Screen Toggle Button */}
            <button 
              type="button" 
              className="location-icon-btn" 
              onClick={toggleFullScreen}
              title={isFullScreen ? "Exit Fullscreen" : "Maximize"}
            >
              {isFullScreen ? (
                // Minimize Icon
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                </svg>
              ) : (
                // Maximize Icon
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              )}
            </button>

            <button type="button" className="location-close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>
        
        {/* Map Body */}
        <div className="location-modal-body">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={selectedCoord || defaultCenter}
              zoom={10}
              onLoad={onLoad}
              onUnmount={onUnmount}
              onClick={handleMapClick}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false, // We built our own custom one
              }}
            >
              <div className="map-search-container">
                <Autocomplete
                  onLoad={(ref) => (autocompleteRef.current = ref)}
                  onPlaceChanged={onPlaceChanged}
                  fields={['geometry.location', 'formatted_address']}
                >
                  <input
                    type="text"
                    placeholder="Search for a city or street..."
                    className="map-search-input"
                  />
                </Autocomplete>
              </div>

              {selectedCoord && (
                <Marker position={selectedCoord} animation={window.google && window.google.maps.Animation.DROP} />
              )}
            </GoogleMap>
          ) : (
            <div className="map-loading-state">
              <div className="spinner"></div>
              <p>Loading Maps...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="location-modal-footer">
          <div className="location-coords">
            {selectedCoord 
              ? `${selectedCoord.lat.toFixed(6)}, ${selectedCoord.lng.toFixed(6)}`
              : "Click map to select"}
          </div>
          <div className="location-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button 
              type="button" 
              className="btn-confirm" 
              onClick={handleConfirm}
              disabled={!selectedCoord || loadingAddress}
            >
              {loadingAddress ? 'Translating...' : 'Confirm Location'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;