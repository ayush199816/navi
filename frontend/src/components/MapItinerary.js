import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// City to country mapping for destinations that might be cities instead of countries
const cityToCountryMap = {
  'Dubai': 'United Arab Emirates',
  'Abu Dhabi': 'United Arab Emirates',
  'London': 'United Kingdom',
  'Paris': 'France',
  'Tokyo': 'Japan',
  'New York': 'United States',
  'Sydney': 'Australia',
  // Add more as needed
};

// Country coordinates database
const countryCoordinates = {
  'Afghanistan': { lat: 33.9391, lng: 67.7100, zoom: 6, code: 'af' },
  'Albania': { lat: 41.3275, lng: 19.8187, zoom: 7, code: 'al' },
  'Algeria': { lat: 28.0339, lng: 1.6596, zoom: 5, code: 'dz' },
  'Andorra': { lat: 42.5063, lng: 1.5218, zoom: 8, code: 'ad' },
  'Angola': { lat: -11.2027, lng: 17.8739, zoom: 5, code: 'ao' },
  'Antigua and Barbuda': { lat: 17.0608, lng: -61.7964, zoom: 9, code: 'ag' },
  'Argentina': { lat: -38.4161, lng: -63.6167, zoom: 4, code: 'ar' },
  'Armenia': { lat: 40.0691, lng: 45.0382, zoom: 7, code: 'am' },
  'Australia': { lat: -25.2744, lng: 133.7751, zoom: 4, code: 'au' },
  'Austria': { lat: 47.5162, lng: 14.5501, zoom: 7, code: 'at' },
  'Azerbaijan': { lat: 40.1431, lng: 47.5769, zoom: 7, code: 'az' },
  'Bahamas': { lat: 25.0343, lng: -77.3963, zoom: 6, code: 'bs' },
  'Bahrain': { lat: 26.0667, lng: 50.5577, zoom: 9, code: 'bh' },
  'Bangladesh': { lat: 23.6850, lng: 90.3563, zoom: 7, code: 'bd' },
  'Barbados': { lat: 13.1939, lng: -59.5432, zoom: 10, code: 'bb' },
  'Belarus': { lat: 53.7098, lng: 27.9534, zoom: 6, code: 'by' },
  'Belgium': { lat: 50.5039, lng: 4.4699, zoom: 8, code: 'be' },
  'Belize': { lat: 17.1899, lng: -88.4976, zoom: 8, code: 'bz' },
  'Benin': { lat: 9.3077, lng: 2.3158, zoom: 7, code: 'bj' },
  'Bhutan': { lat: 27.5142, lng: 90.4336, zoom: 8, code: 'bt' },
  'Bolivia': { lat: -16.2902, lng: -63.5887, zoom: 5, code: 'bo' },
  'Bosnia and Herzegovina': { lat: 43.9159, lng: 17.6791, zoom: 7, code: 'ba' },
  'Botswana': { lat: -22.3285, lng: 24.6849, zoom: 6, code: 'bw' },
  'Brazil': { lat: -14.2350, lng: -51.9253, zoom: 4, code: 'br' },
  'Brunei': { lat: 4.5353, lng: 114.7277, zoom: 8, code: 'bn' },
  'Bulgaria': { lat: 42.7339, lng: 25.4858, zoom: 7, code: 'bg' },
  'Burkina Faso': { lat: 12.2383, lng: -1.5616, zoom: 7, code: 'bf' },
  'Burundi': { lat: -3.3731, lng: 29.9189, zoom: 8, code: 'bi' },
  'Cabo Verde': { lat: 16.0021, lng: -24.0132, zoom: 8, code: 'cv' },
  'Cambodia': { lat: 12.5657, lng: 104.9910, zoom: 7, code: 'kh' },
  'Cameroon': { lat: 7.3697, lng: 12.3547, zoom: 6, code: 'cm' },
  'Canada': { lat: 56.1304, lng: -106.3468, zoom: 4, code: 'ca' },
  'Central African Republic': { lat: 6.6111, lng: 20.9394, zoom: 6, code: 'cf' },
  'Chad': { lat: 15.4542, lng: 18.7322, zoom: 5, code: 'td' },
  'Chile': { lat: -35.6751, lng: -71.5430, zoom: 4, code: 'cl' },
  'China': { lat: 35.8617, lng: 104.1954, zoom: 4, code: 'cn' },
  'Colombia': { lat: 4.5709, lng: -74.2973, zoom: 5, code: 'co' },
  'Comoros': { lat: -11.6455, lng: 43.3333, zoom: 8, code: 'km' },
  'Democratic Republic of the Congo': { lat: -4.0383, lng: 21.7587, zoom: 5, code: 'cd' },
  'Republic of the Congo': { lat: -0.2280, lng: 15.8277, zoom: 6, code: 'cg' },
  'Costa Rica': { lat: 9.7489, lng: -83.7534, zoom: 7, code: 'cr' },
  "Cote d'Ivoire": { lat: 7.5400, lng: -5.5471, zoom: 7, code: 'ci' },
  'Croatia': { lat: 45.1000, lng: 15.2000, zoom: 7, code: 'hr' },
  'Cuba': { lat: 21.5218, lng: -77.7812, zoom: 6, code: 'cu' },
  'Cyprus': { lat: 35.1264, lng: 33.4299, zoom: 8, code: 'cy' },
  'Czech Republic': { lat: 49.8175, lng: 15.4730, zoom: 7, code: 'cz' },
  'Denmark': { lat: 56.2639, lng: 9.5018, zoom: 7, code: 'dk' },
  'Djibouti': { lat: 11.8251, lng: 42.5903, zoom: 8, code: 'dj' },
  'Dominica': { lat: 15.4150, lng: -61.3710, zoom: 9, code: 'dm' },
  'Dominican Republic': { lat: 18.7357, lng: -70.1627, zoom: 8, code: 'do' },
  'Ecuador': { lat: -1.8312, lng: -78.1834, zoom: 6, code: 'ec' },
  'Egypt': { lat: 26.0963, lng: 29.9870, zoom: 6, code: 'eg' },
  'El Salvador': { lat: 13.7942, lng: -88.8965, zoom: 8, code: 'sv' },
  'Equatorial Guinea': { lat: 1.6508, lng: 10.2679, zoom: 8, code: 'gq' },
  'Eritrea': { lat: 15.1794, lng: 39.7823, zoom: 7, code: 'er' },
  'Estonia': { lat: 58.5953, lng: 25.0136, zoom: 7, code: 'ee' },
  'Eswatini': { lat: -26.5225, lng: 31.4659, zoom: 8, code: 'sz' },
  'Ethiopia': { lat: 9.1450, lng: 38.7379, zoom: 6, code: 'et' },
  'Fiji': { lat: -16.5782, lng: 179.4144, zoom: 7, code: 'fj' },
  'Finland': { lat: 61.9241, lng: 25.7482, zoom: 5, code: 'fi' },
  'France': { lat: 46.2276, lng: 2.2137, zoom: 6, code: 'fr' },
  'Gabon': { lat: -0.8037, lng: 11.6094, zoom: 6, code: 'ga' },
  'Gambia': { lat: 13.4432, lng: -15.3101, zoom: 8, code: 'gm' },
  'Georgia': { lat: 42.3154, lng: 43.3569, zoom: 7, code: 'ge' },
  'Germany': { lat: 51.1657, lng: 10.4515, zoom: 6, code: 'de' },
  'Ghana': { lat: 7.9465, lng: -1.0232, zoom: 7, code: 'gh' },
  'Greece': { lat: 39.0742, lng: 21.8243, zoom: 6, code: 'gr' },
  'Grenada': { lat: 12.1165, lng: -61.6790, zoom: 10, code: 'gd' },
  'Guatemala': { lat: 15.7835, lng: -90.2308, zoom: 7, code: 'gt' },
  'Guinea': { lat: 9.9456, lng: -9.6966, zoom: 7, code: 'gn' },
  'Guinea-Bissau': { lat: 11.8037, lng: -15.1804, zoom: 8, code: 'gw' },
  'Guyana': { lat: 4.8604, lng: -58.9302, zoom: 6, code: 'gy' },
  'Haiti': { lat: 18.9712, lng: -72.2852, zoom: 8, code: 'ht' },
  'Honduras': { lat: 15.2000, lng: -86.2419, zoom: 7, code: 'hn' },
  'Hungary': { lat: 47.1625, lng: 19.5033, zoom: 7, code: 'hu' },
  'Iceland': { lat: 64.9631, lng: -19.0208, zoom: 6, code: 'is' },
  'India': { lat: 20.5937, lng: 78.9629, zoom: 5, code: 'in' },
  'Indonesia': { lat: -0.7893, lng: 113.9213, zoom: 5, code: 'id' },
  'Iran': { lat: 32.4279, lng: 53.6880, zoom: 5, code: 'ir' },
  'Iraq': { lat: 33.2232, lng: 43.6793, zoom: 6, code: 'iq' },
  'Ireland': { lat: 53.4129, lng: -8.2439, zoom: 7, code: 'ie' },
  'Israel': { lat: 31.0461, lng: 34.8516, zoom: 8, code: 'il' },
  'Italy': { lat: 41.8719, lng: 12.5674, zoom: 6, code: 'it' },
  'Jamaica': { lat: 18.1096, lng: -77.2975, zoom: 8, code: 'jm' },
  'Japan': { lat: 36.2048, lng: 138.2529, zoom: 6, code: 'jp' },
  'Jordan': { lat: 30.5852, lng: 36.2384, zoom: 7, code: 'jo' },
  'Kazakhstan': { lat: 48.0196, lng: 66.9237, zoom: 5, code: 'kz' },
  'Kenya': { lat: -0.0236, lng: 37.9062, zoom: 6, code: 'ke' },
  'Kiribati': { lat: -3.3704, lng: -168.7340, zoom: 8, code: 'ki' },
  'Kuwait': { lat: 29.3117, lng: 47.4818, zoom: 8, code: 'kw' },
  'Kyrgyzstan': { lat: 41.2044, lng: 74.7661, zoom: 6, code: 'kg' },
  'Laos': { lat: 19.8563, lng: 102.4955, zoom: 6, code: 'la' },
  'Latvia': { lat: 56.8796, lng: 24.6032, zoom: 7, code: 'lv' },
  'Lebanon': { lat: 33.8547, lng: 35.8623, zoom: 8, code: 'lb' },
  'Lesotho': { lat: -29.6099, lng: 28.2336, zoom: 8, code: 'ls' },
  'Liberia': { lat: 6.4281, lng: -9.4295, zoom: 7, code: 'lr' },
  'Libya': { lat: 26.3351, lng: 17.2283, zoom: 5, code: 'ly' },
  'Liechtenstein': { lat: 47.1660, lng: 9.5554, zoom: 10, code: 'li' },
  'Lithuania': { lat: 55.1694, lng: 23.8813, zoom: 7, code: 'lt' },
  'Luxembourg': { lat: 49.8153, lng: 6.1296, zoom: 9, code: 'lu' },
  'Madagascar': { lat: -18.7669, lng: 46.8691, zoom: 6, code: 'mg' },
  'Malawi': { lat: -13.2543, lng: 34.3015, zoom: 7, code: 'mw' },
  'Malaysia': { lat: 4.2105, lng: 101.9758, zoom: 6, code: 'my' },
  'Maldives': { lat: 3.2028, lng: 73.2207, zoom: 8, code: 'mv' },
  'Mali': { lat: 17.5707, lng: -3.9962, zoom: 5, code: 'ml' },
  'Malta': { lat: 35.9375, lng: 14.3754, zoom: 9, code: 'mt' },
  'Marshall Islands': { lat: 7.1315, lng: 171.1845, zoom: 8, code: 'mh' },
  'Mauritania': { lat: 21.0079, lng: -10.9408, zoom: 5, code: 'mr' },
  'Mauritius': { lat: -20.3484, lng: 57.5522, zoom: 9, code: 'mu' },
  'Mexico': { lat: 23.6345, lng: -102.5528, zoom: 5, code: 'mx' },
  'Micronesia': { lat: 7.4256, lng: 150.5508, zoom: 8, code: 'fm' },
  'Moldova': { lat: 47.4116, lng: 28.3699, zoom: 7, code: 'md' },
  'Monaco': { lat: 43.7384, lng: 7.4246, zoom: 12, code: 'mc' },
  'Mongolia': { lat: 46.8625, lng: 103.8467, zoom: 5, code: 'mn' },
  'Montenegro': { lat: 42.7087, lng: 19.3744, zoom: 8, code: 'me' },
  'Morocco': { lat: 31.7917, lng: -7.0926, zoom: 6, code: 'ma' },
  'Mozambique': { lat: -18.6657, lng: 35.5296, zoom: 5, code: 'mz' },
  'Myanmar': { lat: 21.9162, lng: 95.9560, zoom: 6, code: 'mm' },
  'Namibia': { lat: -22.9576, lng: 18.4904, zoom: 6, code: 'na' },
  'Nauru': { lat: -0.5228, lng: 166.9315, zoom: 11, code: 'nr' },
  'Nepal': { lat: 28.3949, lng: 84.1240, zoom: 7, code: 'np' },
  'Netherlands': { lat: 52.1326, lng: 5.2913, zoom: 7, code: 'nl' },
  'New Zealand': { lat: -40.9006, lng: 174.8860, zoom: 5, code: 'nz' },
  'Nicaragua': { lat: 12.8654, lng: -85.2072, zoom: 7, code: 'ni' },
  'Niger': { lat: 17.6078, lng: 8.0817, zoom: 6, code: 'ne' },
  'Nigeria': { lat: 9.0820, lng: 8.6753, zoom: 6, code: 'ng' },
  'North Korea': { lat: 40.3399, lng: 127.5101, zoom: 6, code: 'kp' },
  'North Macedonia': { lat: 41.6086, lng: 21.7453, zoom: 8, code: 'mk' },
  'Norway': { lat: 60.4720, lng: 8.4689, zoom: 5, code: 'no' },
  'Oman': { lat: 21.5126, lng: 55.9233, zoom: 6, code: 'om' },
  'Pakistan': { lat: 30.3753, lng: 69.3451, zoom: 5, code: 'pk' },
  'Palau': { lat: 7.5148, lng: 134.5825, zoom: 8, code: 'pw' },
  'Palestine': { lat: 31.9522, lng: 35.2332, zoom: 8, code: 'ps' },
  'Panama': { lat: 8.5380, lng: -80.7821, zoom: 7, code: 'pa' },
  'Papua New Guinea': { lat: -6.3150, lng: 143.9555, zoom: 6, code: 'pg' },
  'Paraguay': { lat: -23.4425, lng: -58.4438, zoom: 6, code: 'py' },
  'Peru': { lat: -9.1900, lng: -75.0152, zoom: 5, code: 'pe' },
  'Philippines': { lat: 12.8797, lng: 121.7740, zoom: 6, code: 'ph' },
  'Poland': { lat: 51.9194, lng: 19.1451, zoom: 6, code: 'pl' },
  'Portugal': { lat: 39.3999, lng: -8.2245, zoom: 6, code: 'pt' },
  'Qatar': { lat: 25.3548, lng: 51.1839, zoom: 8, code: 'qa' },
  'Romania': { lat: 45.9432, lng: 24.9668, zoom: 6, code: 'ro' },
  'Russia': { lat: 61.5240, lng: 105.3188, zoom: 4, code: 'ru' },
  'Rwanda': { lat: -1.9403, lng: 29.8739, zoom: 8, code: 'rw' },
  'Saint Kitts and Nevis': { lat: 17.3578, lng: -62.7830, zoom: 9, code: 'kn' },
  'Saint Lucia': { lat: 13.9094, lng: -60.9789, zoom: 9, code: 'lc' },
  'Saint Vincent and the Grenadines': { lat: 12.9843, lng: -61.2872, zoom: 9, code: 'vc' },
  'Samoa': { lat: -13.7590, lng: -172.1046, zoom: 8, code: 'ws' },
  'San Marino': { lat: 43.9424, lng: 12.4578, zoom: 10, code: 'sm' },
  'Sao Tome and Principe': { lat: 0.1864, lng: 6.6131, zoom: 9, code: 'st' },
  'Saudi Arabia': { lat: 23.8859, lng: 45.0792, zoom: 5, code: 'sa' },
  'Senegal': { lat: 14.4974, lng: -14.4524, zoom: 7, code: 'sn' },
  'Serbia': { lat: 44.0165, lng: 21.0059, zoom: 7, code: 'rs' },
  'Seychelles': { lat: -4.6796, lng: 55.4920, zoom: 9, code: 'sc' },
  'Sierra Leone': { lat: 8.4606, lng: -11.7799, zoom: 7, code: 'sl' },
  'Singapore': { lat: 1.3521, lng: 103.8198, zoom: 10, code: 'sg' },
  'Slovakia': { lat: 48.6690, lng: 19.6990, zoom: 7, code: 'sk' },
  'Slovenia': { lat: 46.1512, lng: 14.9955, zoom: 8, code: 'si' },
  'Solomon Islands': { lat: -9.6457, lng: 160.1562, zoom: 7, code: 'sb' },
  'Somalia': { lat: 5.1521, lng: 46.1996, zoom: 6, code: 'so' },
  'South Africa': { lat: -30.5595, lng: 22.9375, zoom: 5, code: 'za' },
  'South Korea': { lat: 35.9078, lng: 127.7669, zoom: 7, code: 'kr' },
  'South Sudan': { lat: 6.8770, lng: 31.3070, zoom: 6, code: 'ss' },
  'Spain': { lat: 40.4637, lng: -3.7492, zoom: 6, code: 'es' },
  'Sri Lanka': { lat: 7.8731, lng: 80.7718, zoom: 7, code: 'lk' },
  'Sudan': { lat: 12.8628, lng: 30.2176, zoom: 5, code: 'sd' },
  'Suriname': { lat: 3.9193, lng: -56.0278, zoom: 6, code: 'sr' },
  'Sweden': { lat: 60.1282, lng: 18.6435, zoom: 5, code: 'se' },
  'Switzerland': { lat: 46.8182, lng: 8.2275, zoom: 8, code: 'ch' },
  'Syria': { lat: 34.8021, lng: 38.9968, zoom: 7, code: 'sy' },
  'Taiwan': { lat: 23.6978, lng: 120.9605, zoom: 7, code: 'tw' },
  'Tajikistan': { lat: 38.8610, lng: 71.2761, zoom: 7, code: 'tj' },
  'Tanzania': { lat: -6.3690, lng: 34.8888, zoom: 5, code: 'tz' },
  'Thailand': { lat: 15.8700, lng: 100.9925, zoom: 6, code: 'th' },
  'Timor-Leste': { lat: -8.8742, lng: 125.7275, zoom: 8, code: 'tl' },
  'Togo': { lat: 8.6195, lng: 0.8248, zoom: 8, code: 'tg' },
  'Tonga': { lat: -21.1789, lng: -175.1982, zoom: 8, code: 'to' },
  'Trinidad and Tobago': { lat: 10.6918, lng: -61.2225, zoom: 8, code: 'tt' },
  'Tunisia': { lat: 33.8869, lng: 9.5375, zoom: 6, code: 'tn' },
  'Turkey': { lat: 38.9637, lng: 35.2433, zoom: 6, code: 'tr' },
  'Turkmenistan': { lat: 38.9697, lng: 59.5563, zoom: 6, code: 'tm' },
  'Tuvalu': { lat: -7.1095, lng: 177.6493, zoom: 9, code: 'tv' },
  'Uganda': { lat: 1.3733, lng: 32.2903, zoom: 7, code: 'ug' },
  'Ukraine': { lat: 48.3794, lng: 31.1656, zoom: 6, code: 'ua' },
  'United Arab Emirates': { lat: 25.2048, lng: 55.2708, zoom: 8, code: 'ae' },
  'United Kingdom': { lat: 55.3781, lng: -3.4360, zoom: 6, code: 'gb' },
  'United States': { lat: 37.0902, lng: -95.7129, zoom: 4, code: 'us' },
  'Uruguay': { lat: -32.5228, lng: -55.7658, zoom: 6, code: 'uy' },
  'Uzbekistan': { lat: 41.3775, lng: 64.5853, zoom: 6, code: 'uz' },
  'Vanuatu': { lat: -15.3767, lng: 166.9592, zoom: 7, code: 'vu' },
  'Vatican City': { lat: 41.9029, lng: 12.4534, zoom: 12, code: 'va' },
  'Venezuela': { lat: 6.4238, lng: -66.5897, zoom: 5, code: 've' },
  'Vietnam': { lat: 14.0583, lng: 108.2772, zoom: 6, code: 'vn' },
  'Yemen': { lat: 15.5527, lng: 48.5164, zoom: 6, code: 'ye' },
  'Zambia': { lat: -13.1339, lng: 27.8493, zoom: 6, code: 'zm' },
  'Zimbabwe': { lat: -19.0154, lng: 29.1549, zoom: 6, code: 'zw' }
};

const MapItinerary = ({ extractedPlaces, destination }) => {
  /* eslint-disable no-undef */
  console.log('MapItinerary: Component rendered with extractedPlaces:', extractedPlaces, 'destination:', destination);
  console.log('MapItinerary: Checking cityToCountryMap for destination:', destination, 'mapping:', cityToCountryMap[destination]);

  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mapId = useRef(`map-itinerary-${Date.now()}-${Math.random()}`);

  // Group places by day
  const placesByDay = React.useMemo(() => {
    if (!extractedPlaces || !Array.isArray(extractedPlaces)) return {};

    // Filter out places without proper day information
    const validPlaces = extractedPlaces.filter(place =>
      place.day && place.day !== 'N/A' && place.day !== 'Unknown Day'
    );

    return validPlaces.reduce((acc, place) => {
      const day = place.day || 'Unknown Day';
      if (!acc[day]) acc[day] = [];
      acc[day].push(place);
      return acc;
    }, {});
  }, [extractedPlaces]);

  // Get coordinates for the selected destination
  const currentCoordinates = React.useMemo(() => {
    console.log('currentCoordinates memo running for destination:', destination);
    console.log('cityToCountryMap:', cityToCountryMap);
    console.log('cityToCountryMap[destination]:', cityToCountryMap[destination]);
    const countryName = cityToCountryMap[destination] || destination;
    console.log('countryName:', countryName);
    console.log('countryCoordinates[countryName]:', countryCoordinates[countryName]);
    const result = countryCoordinates[countryName] || countryCoordinates['Thailand'];
    console.log('final result:', result);
    return result;
  }, [destination]);

  // Initialize map
  useEffect(() => {
    console.log('MapItinerary: Initializing map for destination:', destination);
    console.log('MapItinerary: currentCoordinates:', currentCoordinates);

    if (map) {
      console.log('MapItinerary: Map already exists, skipping initialization');
      return;
    }

    try {
      const mapInstance = L.map(mapId.current, {
        center: [currentCoordinates.lat, currentCoordinates.lng],
        zoom: currentCoordinates.zoom,
        scrollWheelZoom: true
      });

      // Add OpenStreetMap tiles (free)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(mapInstance);

      console.log('MapItinerary: Map initialized successfully');
      setMap(mapInstance);
    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Failed to initialize map. Please refresh the page.');
    }

    return () => {
      // Clean up map on unmount or destination change
      if (map) {
        try {
          console.log('MapItinerary: Cleaning up map');
          map.remove();
          setMap(null);
        } catch (error) {
          console.warn('Error cleaning up map:', error);
        }
      }
    };
  }, [destination, currentCoordinates]); // eslint-disable-line react-hooks/exhaustive-deps

  // Geocode places and add markers
  useEffect(() => {
    const geocodePlaces = async () => {
      console.log('MapItinerary: Starting geocoding');
      console.log('MapItinerary: extractedPlaces:', extractedPlaces);
      console.log('MapItinerary: destination:', destination);
      console.log('MapItinerary: placesByDay:', placesByDay);

      if (!map || !extractedPlaces || extractedPlaces.length === 0) {
        console.log('MapItinerary: Skipping geocoding - map:', !!map, 'extractedPlaces:', !!extractedPlaces, 'length:', extractedPlaces?.length);
        console.log('MapItinerary: Map object:', map);
        return;
      }

      // Compute coordinates fresh for each geocoding run
      const countryName = cityToCountryMap[destination] || destination;
      console.log('MapItinerary: Computed countryName:', countryName);
      const currentCoords = countryCoordinates[countryName] || countryCoordinates['Thailand'];
      console.log('MapItinerary: Computed currentCoords:', currentCoords);

      setLoading(true);
      setError('');

      try {
        // Clear existing markers by removing all layers except the tile layer
        console.log('MapItinerary: Clearing existing markers');
        map.eachLayer((layer) => {
          if (!(layer instanceof L.TileLayer)) {
            map.removeLayer(layer);
          }
        });

        const newMarkers = [];

        // Process places day by day
        const dayKeys = Object.keys(placesByDay).sort();
        console.log('MapItinerary: dayKeys:', dayKeys);

        for (let dayIndex = 0; dayIndex < dayKeys.length; dayIndex++) {
          const day = dayKeys[dayIndex];
          const dayPlaces = placesByDay[day];
          console.log(`MapItinerary: Processing ${dayPlaces.length} places for ${day}`);

          // Color coding for different days
          const colors = ['red', 'blue', 'green', 'orange', 'purple', 'pink', 'brown', 'gray'];
          const color = colors[dayIndex % colors.length];

          for (const place of dayPlaces) {
            try {
              console.log(`MapItinerary: Geocoding ${place.name}`);
              // Use Nominatim (OpenStreetMap's geocoding service) - free
              const countryName = cityToCountryMap[destination] || destination;
              const query = encodeURIComponent(`${place.name}, ${countryName}`);
              console.log(`MapItinerary: Query: ${query}, Country code: ${currentCoords.code}`);
              const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=${currentCoords.code}`,
                {
                  headers: {
                    'User-Agent': 'Navi-Itinerary-App/1.0'
                  }
                }
              );

              let data;
              if (!response.ok) {
                console.warn(`Geocoding failed for ${place.name}: ${response.status} ${response.statusText}`);
                // Try without countrycodes if initial request fails
                console.log(`Retrying geocoding for ${place.name} without country filter`);
                const retryResponse = await fetch(
                  `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
                  {
                    headers: {
                      'User-Agent': 'Navi-Itinerary-App/1.0'
                    }
                  }
                );
                if (!retryResponse.ok) {
                  console.warn(`Retry geocoding also failed for ${place.name}: ${retryResponse.status}`);
                  continue;
                }
                data = await retryResponse.json();
              } else {
                data = await response.json();
              }
              console.log(`MapItinerary: Geocoding result for ${place.name}:`, data);

              if (data && data.length > 0) {
                const { lat, lon } = data[0];
                console.log(`MapItinerary: Adding marker at ${lat}, ${lon} for ${place.name}`);

                try {
                  // Create custom icon with color
                  const icon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="
                      background-color: ${color};
                      width: 20px;
                      height: 20px;
                      border-radius: 50%;
                      border: 2px solid white;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: white;
                      font-weight: bold;
                      font-size: 12px;
                    ">${dayIndex + 1}</div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                  });

                  const marker = L.marker([parseFloat(lat), parseFloat(lon)], { icon })
                    .addTo(map)
                    .bindPopup(`
                      <div style="font-family: Arial, sans-serif; max-width: 200px;">
                        <strong style="color: ${color};">${place.name}</strong><br/>
                        <small>${day} - ${place.time}</small><br/>
                        <em>${place.context}</em>
                      </div>
                    `);

                  newMarkers.push(marker);
                  console.log(`MapItinerary: Marker added successfully for ${place.name}`);
                } catch (markerError) {
                  console.error(`Error creating marker for ${place.name}:`, markerError);
                }
              } else {
                console.warn(`No geocoding results for ${place.name}`);
              }
            } catch (geocodeError) {
              console.warn(`Error geocoding ${place.name}:`, geocodeError);
            }
          }
        }

        console.log(`MapItinerary: Added ${newMarkers.length} markers`);

        // Fit map to show all markers
        if (newMarkers.length > 0) {
          console.log('MapItinerary: Fitting map to markers');
          try {
            const group = new L.featureGroup(newMarkers);
            map.fitBounds(group.getBounds().pad(0.1));
            console.log('MapItinerary: Map fitted successfully');
          } catch (fitError) {
            console.warn('Error fitting map bounds:', fitError);
          }
        } else {
          console.log('MapItinerary: No markers added, skipping fitBounds');
        }

      } catch (err) {
        console.error('Error in geocodePlaces:', err);
        setError(`Failed to load map locations: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    geocodePlaces();
  }, [map, extractedPlaces, placesByDay, destination]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!extractedPlaces || extractedPlaces.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Day-wise Map Itinerary</h3>
        <p className="text-gray-600">No places extracted yet. Generate an itinerary first to see the map.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Day-wise Map Itinerary</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.keys(placesByDay).map((day, index) => {
            const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500', 'bg-brown-500', 'bg-gray-500'];
            const color = colors[index % colors.length];
            return (
              <div key={day} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold`}>
                  {index + 1}
                </div>
                <span className="text-sm text-gray-600">{day} ({placesByDay[day].length} places)</span>
              </div>
            );
          })}
        </div>
        {loading && (
          <div className="text-blue-600 text-sm">Loading map locations...</div>
        )}
        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}
      </div>
      <div
        id={mapId.current}
        className="w-full h-96"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};

export default MapItinerary;
