import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [isWhat3Words, setIsWhat3Words] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

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
    // Check if input looks like a what3words address
    const w3wPattern = /^\/\/\/[a-z]+\.[a-z]+\.[a-z]+$/i;
    setIsWhat3Words(w3wPattern.test(inputValue.trim()));
  }, [inputValue]);

  useEffect(() => {
    if (!scriptLoaded || !inputRef.current || autocompleteRef.current) return;

    // Initialize autocomplete - always initialize, regardless of what3words
    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: ["za", "bw"] }, // Restrict to South Africa and Botswana
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
      setIsWhat3Words(false); // Reset what3words state after Google selection
    });
  }, [scriptLoaded, onAddressSelect]);

  const handleWhat3WordsConvert = async () => {
    if (!inputValue.trim()) {
      toast.error("Please enter a what3words address");
      return;
    }

    setIsConverting(true);
    try {
      const { data, error } = await supabase.functions.invoke('convert-what3words', {
        body: { what3words: inputValue.trim() }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Update input with formatted address
      setInputValue(data.formatted_address);
      
      // Pass address components to parent
      onAddressSelect({
        address_line1: data.address_line1,
        suburb: data.suburb,
        city: data.city,
        province: data.province,
        postal_code: data.postal_code,
      });

      toast.success("Address converted successfully!");
    } catch (error) {
      console.error('Error converting what3words:', error);
      toast.error("Failed to convert what3words address");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="address_autocomplete">Search Address or what3words *</Label>
      <div className="flex gap-2">
        <Input
          id="address_autocomplete"
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Start typing an address or ///what.three.words"
          disabled={disabled || (!scriptLoaded && !isWhat3Words)}
          className="flex-1"
        />
        {isWhat3Words && (
          <Button
            type="button"
            onClick={handleWhat3WordsConvert}
            disabled={isConverting || disabled}
          >
            {isConverting ? "Converting..." : "Convert"}
          </Button>
        )}
      </div>
      {!scriptLoaded && !isWhat3Words && (
        <p className="text-xs text-muted-foreground">Loading address search...</p>
      )}
      {isWhat3Words && (
        <p className="text-xs text-muted-foreground">
          what3words address detected. Click "Convert" to populate address fields.
        </p>
      )}
    </div>
  );
};
