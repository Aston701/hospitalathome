import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddressComponents {
  address_line1: string;
  suburb: string;
  city: string;
  province: string;
  postal_code: string;
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: AddressComponents) => void;
  value?: string;
  disabled?: boolean;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

export const AddressAutocomplete = ({ onAddressSelect, value, disabled }: AddressAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");

  useEffect(() => {
    // Check if script is already loaded
    if (window.google && window.google.maps) {
      setScriptLoaded(true);
      return;
    }

    // Load Google Maps script
    // Google Places API key
    const apiKey = "AIzaSyCAEP4G0YqP7eoCHIORrSw6Ag1o6rfrM84";
    
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !inputRef.current || autocompleteRef.current) return;

    // Initialize autocomplete
    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "za" }, // Restrict to South Africa
      fields: ["address_components", "formatted_address"],
    });

    // Add listener for place selection
    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current.getPlace();
      
      if (!place.address_components) return;

      const components: AddressComponents = {
        address_line1: "",
        suburb: "",
        city: "",
        province: "",
        postal_code: "",
      };

      // Extract address components
      for (const component of place.address_components) {
        const types = component.types;

        if (types.includes("street_number")) {
          components.address_line1 = component.long_name + " ";
        }
        if (types.includes("route")) {
          components.address_line1 += component.long_name;
        }
        if (types.includes("sublocality_level_1") || types.includes("sublocality")) {
          components.suburb = component.long_name;
        }
        if (types.includes("locality")) {
          components.city = component.long_name;
        }
        if (types.includes("administrative_area_level_1")) {
          components.province = component.long_name;
        }
        if (types.includes("postal_code")) {
          components.postal_code = component.long_name;
        }
      }

      setInputValue(place.formatted_address || "");
      onAddressSelect(components);
    });
  }, [scriptLoaded, onAddressSelect]);

  return (
    <div className="space-y-2">
      <Label htmlFor="address_autocomplete">Search Address *</Label>
      <Input
        id="address_autocomplete"
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Start typing an address..."
        disabled={disabled || !scriptLoaded}
      />
      {!scriptLoaded && (
        <p className="text-xs text-muted-foreground">Loading address search...</p>
      )}
    </div>
  );
};
