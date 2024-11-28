import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet"; // Import Leaflet for custom markers
import "../scss/SearchComponent.css"; // Import styles
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"
import img1 from "../assets/ad1.jpeg";
import img2 from "../assets/ad2.jpeg";
import img3 from "../assets/ad3.jpeg";
import img4 from "../assets/ad4.jpeg";
import img5 from "../assets/ad5.jpeg";
import img6 from "../assets/ad6.jpeg";
import pinIcon from "../assets/pin.png";
import logo from "../assets/logo.png";
import searchIcon from "../assets/search.png";

// Default map center and zoom level for New York
const mapCenter = [40.7128, -74.006];
const zoomLevel = 12;

const SearchComponent = () => {
  const [query, setQuery] = useState(""); // State to store the search query
  const [results, setResults] = useState([]); // State to store the search results
  const [loading, setLoading] = useState(false); // State to track loading state
  const [error, setError] = useState(null); // State to store error messages
  const [priceRange, setPriceRange] = useState([0, 1000]); // State for price filter (min, max)
  const [roomType, setRoomType] = useState(""); // State for room type filter
  const [neighbourhood, setNeighbourhood] = useState(""); // State for neighbourhood filter
  const [isPopupOpen, setIsPopupOpen] = useState(false); // Manage popup state
  const [selectedProperty, setSelectedProperty] = useState(null); // Track which property is selected for booking
  const [totalCost, setTotalCost] = useState(0);
  const cardRefs = useRef({});
  const [selectedDates, setSelectedDates] = useState({}); // Store selected dates
  const [bookedDates, setBookedDates] = useState({}); 

  const images = [img1, img2, img3, img4, img5, img6]; // Array of images

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const response = await axios.get("http://127.0.0.1:5000/search", {
        params: { query },
      });
      setResults(response.data.results);
    } catch (err) {
      setError("An error occurred while fetching data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (id, dates) => {
    setSelectedDates(dates);

    if (dates[0] && dates[1]) {
      const diffInTime = dates[1].getTime() - dates[0].getTime();
      const numberOfNights = Math.ceil(diffInTime / (1000 * 60 * 60 * 24));
      const estimatedCost = numberOfNights * selectedProperty.price;
      setTotalCost(estimatedCost);
    } else {
      setTotalCost(0);
    }
    setSelectedDates((prev) => ({ ...prev, [id]: dates }));
  };


  const executeSearchQuery = async () => {
    setLoading(true);
    setResults([]);
    try {
      const response = await axios.get("http://127.0.0.1:5000/search", {
        params: { 'query' : 'a' },
      });
      setResults(response.data.results);
    } catch (err) {
      setError("An error occurred while fetching data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Run the search query for "Manhattan" when the component mounts
    executeSearchQuery("Manhattan");
  }, []);


  const handleFilter = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const filters = {
        price_min: priceRange[0],
        price_max: priceRange[1],
        room_type: roomType,
        neighbourhood,
      };

      const response = await axios.get("http://127.0.0.1:5000/filter", {
        params: filters,
      });
      setResults(response.data.results);
    } catch (err) {
      setError("An error occurred while applying filters. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookNowClick = (property) => {
    setSelectedProperty(property);
    setIsPopupOpen(true);
  };

  const handleDateSelect = (dates) => {
    setSelectedDates(dates);

    if (dates[0] && dates[1]) {
      const diffInTime = dates[1].getTime() - dates[0].getTime();
      const numberOfNights = Math.ceil(diffInTime / (1000 * 60 * 60 * 24));
      const estimatedCost = numberOfNights * selectedProperty.price;
      setTotalCost(estimatedCost);
    } else {
      setTotalCost(0);
    }
  };

  const handleConfirmBooking = () => {
    if (selectedDates[0] && selectedDates[1]) {
      alert(
        `Booking confirmed for ${selectedProperty.name} from ${selectedDates[0].toLocaleDateString()} to ${selectedDates[1].toLocaleDateString()}`
      );
      setIsPopupOpen(false);
    } else {
      alert("Please select valid start and end dates.");
    }
  };

  const handleMarkerClick = (id) => {
    const card = cardRefs.current[id];
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const confirmBooking = async (id) => {
    if (!selectedDates[id] || selectedDates[id].length !== 2) {
      alert("Please select a valid date range.");
      return;
    }

    const [start_date, end_date] = selectedDates[id];

    const bookingData = {
      id,
      start_date,
      end_date,
    };

    try {
      // Update Elasticsearch with the booking details
      await axios.post("http://127.0.0.1:5000/book", bookingData);

      // Update booked dates in state
      setBookedDates((prev) => ({
        ...prev,
        [id]: [...(prev[id] || []), ...selectedDates[id]],
      }));

      alert("Booking confirmed!");
    } catch (err) {
      console.error("Error confirming booking:", err);
      alert("Failed to confirm booking. Please try again.");
    }
  };

  return (
    <div className="search-component">
      {/* Header with Logo and Profile */}
      <div className="header">
        <img src={logo} alt="Logo" className="logo" />
      </div>

      {/* Search Bar Section */}
      <div className="search-bar-container">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a place"
          className="search-input"
        />
        <button onClick={handleSearch} className="search-button">
            <img src={searchIcon} alt="Search" className="search-icon" />
        </button>
      </div>

      {/* Horizontal Line */}
      <hr className="search-line" />

      {/* Filter Section in a Line */}
      <div className="filters">
        <div className="filter">
          <label>Price Range:</label>
          <input
            type="range"
            min="0"
            max="1000"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([e.target.value, priceRange[1]])}
            className="price-slider"
          />
          <input
            type="range"
            min="0"
            max="1000"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], e.target.value])}
            className="price-slider"
          />
          <span>{`$${priceRange[0]} - $${priceRange[1]}`}</span>
        </div>

        <div className="filter">
          <label>Room Type:</label>
          <select value={roomType} onChange={(e) => setRoomType(e.target.value)}>
            <option value="">Any</option>
            <option value="Entire home/apt">Entire Home/Apt</option>
            <option value="Private room">Private Room</option>
            <option value="Shared room">Shared Room</option>
          </select>
        </div>

        <div className="filter">
          <label>Neighbourhood:</label>
          <select value={neighbourhood} onChange={(e) => setNeighbourhood(e.target.value)}>
            <option value="">Any</option>
            <option value="Manhattan">Manhattan</option>
            <option value="Brooklyn">Brooklyn</option>
            <option value="Queens">Queens</option>
            <option value="Bronx">Bronx</option>
            <option value="Staten Island">Staten Island</option>
          </select>
        </div>

        <div className="filter">
          <button onClick={handleFilter} className="apply-filter-button">Apply</button>
        </div>
      </div>

      {/* Horizontal Line */}
      <hr className="search-line" />

      {/* Search Results Section */}
    <div className="search-results">
      {/* Map Section */}
      <div className="map-container">
        <MapContainer
          center={mapCenter}
          zoom={zoomLevel}
          style={{ height: "500px", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {results.map((result) => {
            if (result.latitude && result.longitude) {
              return (
                <Marker
                  key={result.id}
                  position={[result.latitude, result.longitude]}
                  icon={new L.Icon({
                    iconUrl: pinIcon,
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32],
                  })}
                  eventHandlers={{
                    click: () => handleMarkerClick(result.id),
                  }}
                >
                  <Popup>
                    <h3>{result.name}</h3>
                    <p>{result.neighbourhood_group}, {result.neighbourhood}</p>
                    <p>${result.price} / night</p>
                  </Popup>
                </Marker>
              );
            }
            return null;
          })}
        </MapContainer>
      </div>

      {/* Cards Section */}
      <div className="cards-container">
            {results.length === 0 && !loading && <p>No results found.</p>}
            {results.map((result) => {
            const randomImage = images[Math.floor(Math.random() * images.length)];
            return (
                <div className="card" 
                key={result.id}
                ref={(el) => (cardRefs.current[result.id] = el)}
                >
                <img
                    src={randomImage}
                    alt={result.name}
                    className="card-img"
                />
                <div className="card-body">
                    <h3 className="card-title">{result.name}</h3>
                    <p className="card-subtitle">
                    {result.neighbourhood_group}, {result.neighbourhood}
                    </p>
                    <p className="card-price">${result.price} / night</p>
                    <p className="card-reviews">
                    {result.number_of_reviews} Reviews | {result.room_type}
                    </p>
                    <button
                    className="card-button"
                    onClick={() => handleBookNowClick(result)}
                    >
                    Book Now
                    </button>
                </div>
                </div>
            );
            })}
        </div>
    </div>
    {/* Date Selection Popup */}
    {isPopupOpen && (
        <div className="popup">
          <div className="popup-content">
            <h2>Select Booking Dates</h2>
            <DatePicker
                    selected={selectedDates[results.id]?.[0]}
                    onChange={(dates) => handleDateChange(results.id, dates)}
                    startDate={selectedDates[results.id]?.[0]}
                    endDate={selectedDates[results.id]?.[1]}
                    selectsRange
                    inline
                    excludeDates={bookedDates[results.id]}
            />
            <p>
              <strong>Estimated Cost:</strong> ${totalCost}
            </p>
            <button onClick={() => handleConfirmBooking()} className="confirm-button">
              Confirm Booking
            </button>
            <button onClick={() => setIsPopupOpen(false)} className="cancel-button">
              Cancel
            </button>
          </div>
        </div>
      )}
  </div>
  );
};

export default SearchComponent;
