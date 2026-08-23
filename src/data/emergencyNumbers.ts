export interface EmergencyContact {
  service: string;
  number: string;
  description: string;
}

export interface CountryEmergency {
  country: string;
  countryCode: string;
  generalEmergency: string;
  contacts: EmergencyContact[];
}

export const EMERGENCY_DATABASE: CountryEmergency[] = [
  {
    country: "India",
    countryCode: "IN",
    generalEmergency: "112",
    contacts: [
      { service: "Police", number: "100", description: "National Police Helpline" },
      { service: "Ambulance", number: "102", description: "National Ambulance Service (108 in some states)" },
      { service: "Fire", number: "101", description: "Fire Department" },
      { service: "General Emergency", number: "112", description: "National Emergency Number" },
      { service: "Disaster Management", number: "1078", description: "NDMA Helpline" },
      { service: "Women Helpline", number: "1091", description: "Women in Distress Helpline" },
      { service: "Child Helpline", number: "1098", description: "Child in Distress Helpline" },
      { service: "Railway", number: "139", description: "Railway Enquiry & Emergency" }
    ]
  },
  {
    country: "United States",
    countryCode: "US",
    generalEmergency: "911",
    contacts: [
      { service: "General Emergency", number: "911", description: "All Emergencies" },
      { service: "Poison Control", number: "1-800-222-1222", description: "National Poison Help" },
      { service: "Disaster Management", number: "1-800-621-3362", description: "FEMA" },
      { service: "Mental Health", number: "988", description: "Suicide & Crisis Lifeline" }
    ]
  },
  {
    country: "United Kingdom",
    countryCode: "GB",
    generalEmergency: "999",
    contacts: [
      { service: "General Emergency", number: "999", description: "All Emergencies (or 112)" },
      { service: "Non-Emergency Medical", number: "111", description: "NHS Non-Emergency" },
      { service: "Non-Emergency Police", number: "101", description: "Police Non-Emergency" }
    ]
  },
  {
    country: "Australia",
    countryCode: "AU",
    generalEmergency: "000",
    contacts: [
      { service: "General Emergency", number: "000", description: "Triple Zero (or 112 from mobile)" },
      { service: "Disaster Management", number: "132 500", description: "State Emergency Service (SES)" },
      { service: "Mental Health", number: "13 11 14", description: "Lifeline" }
    ]
  },
  {
    country: "Canada",
    countryCode: "CA",
    generalEmergency: "911",
    contacts: [
      { service: "General Emergency", number: "911", description: "All Emergencies" },
      { service: "Poison Control", number: "1-800-222-1222", description: "Poison Help" },
      { service: "Non-Emergency Police", number: "311", description: "Non-emergency services in major cities" }
    ]
  },
  {
    country: "Germany",
    countryCode: "DE",
    generalEmergency: "112",
    contacts: [
      { service: "Police", number: "110", description: "Police Emergency" },
      { service: "Ambulance & Fire", number: "112", description: "Medical & Fire Emergency" },
      { service: "Medical on-call", number: "116117", description: "Non-emergency medical" }
    ]
  },
  {
    country: "France",
    countryCode: "FR",
    generalEmergency: "112",
    contacts: [
      { service: "Ambulance", number: "15", description: "SAMU" },
      { service: "Police", number: "17", description: "Police Secours" },
      { service: "Fire", number: "18", description: "Sapeurs-pompiers" },
      { service: "General Emergency", number: "112", description: "EU Standard" }
    ]
  },
  {
    country: "Japan",
    countryCode: "JP",
    generalEmergency: "110",
    contacts: [
      { service: "Police", number: "110", description: "Police Emergency" },
      { service: "Fire & Ambulance", number: "119", description: "Fire & Ambulance Services" },
      { service: "Coast Guard", number: "118", description: "Maritime Emergency" }
    ]
  },
  {
    country: "China",
    countryCode: "CN",
    generalEmergency: "110",
    contacts: [
      { service: "Police", number: "110", description: "Public Security" },
      { service: "Ambulance", number: "120", description: "First Aid Center" },
      { service: "Fire", number: "119", description: "Fire Service" },
      { service: "Traffic Accident", number: "122", description: "Traffic Police" }
    ]
  },
  {
    country: "Brazil",
    countryCode: "BR",
    generalEmergency: "190",
    contacts: [
      { service: "Police", number: "190", description: "Military Police" },
      { service: "Ambulance", number: "192", description: "SAMU" },
      { service: "Fire", number: "193", description: "Fire Department" },
      { service: "Civil Defense", number: "199", description: "Disaster response" }
    ]
  },
  {
    country: "Mexico",
    countryCode: "MX",
    generalEmergency: "911",
    contacts: [
      { service: "General Emergency", number: "911", description: "All Emergencies" }
    ]
  },
  {
    country: "South Korea",
    countryCode: "KR",
    generalEmergency: "112",
    contacts: [
      { service: "Police", number: "112", description: "Police Service" },
      { service: "Fire & Ambulance", number: "119", description: "Fire & Emergency Services" }
    ]
  },
  {
    country: "Russia",
    countryCode: "RU",
    generalEmergency: "112",
    contacts: [
      { service: "General Emergency", number: "112", description: "All Emergencies" },
      { service: "Fire", number: "101", description: "Fire & Rescue" },
      { service: "Police", number: "102", description: "Police Service" },
      { service: "Ambulance", number: "103", description: "Medical Emergency" }
    ]
  },
  {
    country: "Indonesia",
    countryCode: "ID",
    generalEmergency: "112",
    contacts: [
      { service: "General Emergency", number: "112", description: "All Emergencies" },
      { service: "Police", number: "110", description: "National Police" },
      { service: "Ambulance", number: "118", description: "Ambulance/Medical" },
      { service: "Fire", number: "113", description: "Fire Department" },
      { service: "Search & Rescue", number: "115", description: "BASARNAS" }
    ]
  },
  {
    country: "Pakistan",
    countryCode: "PK",
    generalEmergency: "1122",
    contacts: [
      { service: "Police", number: "15", description: "Police Emergency" },
      { service: "Rescue", number: "1122", description: "Rescue 1122 Service" },
      { service: "Ambulance", number: "115", description: "Edhi Ambulance" },
      { service: "Fire", number: "16", description: "Fire Service" }
    ]
  },
  {
    country: "Bangladesh",
    countryCode: "BD",
    generalEmergency: "999",
    contacts: [
      { service: "General Emergency", number: "999", description: "Police, Fire, Ambulance" }
    ]
  },
  {
    country: "Nigeria",
    countryCode: "NG",
    generalEmergency: "112",
    contacts: [
      { service: "General Emergency", number: "112", description: "National Emergency Number" },
      { service: "Police/Fire", number: "199", description: "Police & Fire" }
    ]
  },
  {
    country: "South Africa",
    countryCode: "ZA",
    generalEmergency: "10111",
    contacts: [
      { service: "Police", number: "10111", description: "Flying Squad" },
      { service: "Ambulance & Fire", number: "10177", description: "Medical & Fire" },
      { service: "General Emergency", number: "112", description: "From mobile phones" }
    ]
  },
  {
    country: "United Arab Emirates",
    countryCode: "AE",
    generalEmergency: "999",
    contacts: [
      { service: "Police", number: "999", description: "Police Emergency" },
      { service: "Ambulance", number: "998", description: "Medical Emergency" },
      { service: "Fire", number: "997", description: "Civil Defence" },
      { service: "Coast Guard", number: "996", description: "Maritime Emergency" }
    ]
  },
  {
    country: "Saudi Arabia",
    countryCode: "SA",
    generalEmergency: "911",
    contacts: [
      { service: "General Emergency", number: "911", description: "Unified Emergency (most regions)" },
      { service: "Police", number: "999", description: "Police (regions without 911)" },
      { service: "Ambulance", number: "997", description: "Red Crescent" },
      { service: "Fire", number: "998", description: "Civil Defense" }
    ]
  },
  {
    country: "Philippines",
    countryCode: "PH",
    generalEmergency: "911",
    contacts: [
      { service: "General Emergency", number: "911", description: "National Emergency Hotline" },
      { service: "Red Cross", number: "143", description: "Philippine Red Cross" }
    ]
  },
  {
    country: "Thailand",
    countryCode: "TH",
    generalEmergency: "191",
    contacts: [
      { service: "Police", number: "191", description: "General Police" },
      { service: "Ambulance", number: "1669", description: "Medical Emergency" },
      { service: "Fire", number: "199", description: "Fire Department" },
      { service: "Tourist Police", number: "1155", description: "For tourists" }
    ]
  },
  {
    country: "Vietnam",
    countryCode: "VN",
    generalEmergency: "113",
    contacts: [
      { service: "Police", number: "113", description: "Police Service" },
      { service: "Ambulance", number: "115", description: "Medical Emergency" },
      { service: "Fire", number: "114", description: "Fire Service" }
    ]
  },
  {
    country: "Egypt",
    countryCode: "EG",
    generalEmergency: "122",
    contacts: [
      { service: "Police", number: "122", description: "Emergency Police" },
      { service: "Ambulance", number: "123", description: "Ambulance Service" },
      { service: "Fire", number: "180", description: "Fire Brigade" },
      { service: "Tourist Police", number: "126", description: "Tourist Emergency" }
    ]
  },
  {
    country: "Turkey",
    countryCode: "TR",
    generalEmergency: "112",
    contacts: [
      { service: "General Emergency", number: "112", description: "All Emergencies" },
      { service: "Police", number: "155", description: "Police Emergency" },
      { service: "Fire", number: "110", description: "Fire Service" }
    ]
  },
  {
    country: "Italy",
    countryCode: "IT",
    generalEmergency: "112",
    contacts: [
      { service: "General Emergency", number: "112", description: "EU Standard / Carabinieri" },
      { service: "Police", number: "113", description: "State Police" },
      { service: "Fire", number: "115", description: "Fire Brigade" },
      { service: "Ambulance", number: "118", description: "Medical Emergency" }
    ]
  },
  {
    country: "Spain",
    countryCode: "ES",
    generalEmergency: "112",
    contacts: [
      { service: "General Emergency", number: "112", description: "All Emergencies" },
      { service: "National Police", number: "091", description: "Policía Nacional" },
      { service: "Local Police", number: "092", description: "Policía Local" },
      { service: "Ambulance", number: "061", description: "Medical Emergency" },
      { service: "Fire", number: "080", description: "Fire Brigade" }
    ]
  },
  {
    country: "Netherlands",
    countryCode: "NL",
    generalEmergency: "112",
    contacts: [
      { service: "General Emergency", number: "112", description: "All Emergencies" },
      { service: "Police Non-Emergency", number: "0900-8844", description: "Non-emergency police" }
    ]
  },
  {
    country: "Singapore",
    countryCode: "SG",
    generalEmergency: "999",
    contacts: [
      { service: "Police", number: "999", description: "Police Emergency" },
      { service: "Ambulance & Fire", number: "995", description: "SCDF" },
      { service: "Non-Emergency Ambulance", number: "1777", description: "Non-emergency cases" }
    ]
  },
  {
    country: "New Zealand",
    countryCode: "NZ",
    generalEmergency: "111",
    contacts: [
      { service: "General Emergency", number: "111", description: "Police, Fire, Ambulance" },
      { service: "Police Non-Emergency", number: "105", description: "Non-emergency police" }
    ]
  },
  {
    country: "Israel",
    countryCode: "IL",
    generalEmergency: "100",
    contacts: [
      { service: "Police", number: "100", description: "Police Emergency" },
      { service: "Ambulance", number: "101", description: "Magen David Adom" },
      { service: "Fire", number: "102", description: "Fire & Rescue" },
      { service: "Home Front Command", number: "104", description: "National Emergency" }
    ]
  },
  {
    country: "Nepal",
    countryCode: "NP",
    generalEmergency: "100",
    contacts: [
      { service: "Police", number: "100", description: "Police Emergency" },
      { service: "Ambulance", number: "102", description: "Ambulance Service" },
      { service: "Fire", number: "101", description: "Fire Brigade" },
      { service: "Tourist Police", number: "1144", description: "Tourist Emergency" }
    ]
  },
  {
    country: "Sri Lanka",
    countryCode: "LK",
    generalEmergency: "119",
    contacts: [
      { service: "Police", number: "119", description: "Police Emergency" },
      { service: "Ambulance", number: "1990", description: "Suwaseriya Ambulance" },
      { service: "Fire", number: "110", description: "Fire Brigade" },
      { service: "General Emergency", number: "112", description: "From mobile phones" }
    ]
  }
];

export function getEmergencyNumbers(countryCode: string): CountryEmergency | null {
  if (!countryCode) return null;
  const upperCode = countryCode.toUpperCase();
  return EMERGENCY_DATABASE.find((c) => c.countryCode === upperCode) || null;
}

export function getDefaultEmergencyNumbers(): CountryEmergency {
  return {
    country: "Global Standard",
    countryCode: "GLOBAL",
    generalEmergency: "112 / 911",
    contacts: [
      { service: "General Emergency", number: "112", description: "Standard in Europe & many regions" },
      { service: "General Emergency", number: "911", description: "Standard in Americas & many regions" }
    ]
  };
}

// Bounding boxes [minLng, minLat, maxLng, maxLat]
const COUNTRY_BOUNDING_BOXES: Record<string, [number, number, number, number]> = {
  "IN": [68.1, 6.7, 97.4, 35.5],
  "US": [-125.0, 24.3, -66.9, 49.38],
  "GB": [-8.6, 49.8, 1.7, 60.8],
  "AU": [112.9, -43.6, 153.6, -10.0],
  "CA": [-141.0, 41.6, -52.6, 83.1],
  "DE": [5.8, 47.2, 15.0, 55.0],
  "FR": [-5.1, 41.3, 9.5, 51.0],
  "JP": [122.9, 24.0, 153.9, 45.5],
  "CN": [73.5, 18.1, 134.7, 53.5],
  "BR": [-73.9, -33.7, -34.7, 5.2],
  "MX": [-117.1, 14.5, -86.7, 32.7],
  "KR": [125.0, 33.1, 131.8, 38.6],
  "RU": [19.6, 41.1, -169.0, 81.8], // Spans 180 meridian, simplified
  "ID": [95.0, -11.0, 141.0, 6.0],
  "PK": [60.8, 23.6, 75.5, 37.0],
  "BD": [88.0, 20.7, 92.6, 26.6],
  "NG": [2.6, 4.2, 14.6, 13.8],
  "ZA": [16.4, -34.8, 32.9, -22.1],
  "AE": [51.5, 22.6, 56.3, 26.0],
  "SA": [34.5, 16.3, 55.6, 32.1],
  "PH": [116.9, 4.5, 126.6, 21.1],
  "TH": [97.3, 5.6, 105.6, 20.4],
  "VN": [102.1, 8.5, 109.4, 23.3],
  "EG": [24.7, 21.9, 36.8, 31.6],
  "TR": [25.6, 35.8, 44.8, 42.1],
  "IT": [6.6, 36.6, 18.5, 47.0],
  "ES": [-9.3, 36.0, 3.3, 43.7],
  "NL": [3.3, 50.7, 7.2, 53.5],
  "SG": [103.6, 1.1, 104.0, 1.4],
  "NZ": [166.4, -47.3, 178.6, -34.1],
  "IL": [34.2, 29.4, 35.8, 33.3],
  "NP": [80.0, 26.3, 88.2, 30.4],
  "LK": [79.5, 5.9, 81.8, 9.8]
};

export function getCountryFromCoordinates(lat: number, lng: number): string {
  // Simple point in bounding box lookup
  for (const [countryCode, bbox] of Object.entries(COUNTRY_BOUNDING_BOXES)) {
    const [minLng, minLat, maxLng, maxLat] = bbox;
    
    // Handle Russia specifically as it spans across the 180th meridian
    if (countryCode === 'RU') {
      if (lat >= minLat && lat <= maxLat) {
        if (lng >= minLng || lng <= maxLng) {
          return countryCode;
        }
      }
      continue;
    }

    if (lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat) {
      return countryCode;
    }
  }
  
  // Default to global if no match found
  return "GLOBAL";
}
