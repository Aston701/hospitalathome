import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { what3words } = await req.json();
    
    if (!what3words) {
      return new Response(
        JSON.stringify({ error: 'what3words address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('WHAT3WORDS_API_KEY');
    if (!apiKey) {
      console.error('WHAT3WORDS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'What3Words API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean the what3words address (remove /// if present)
    const cleanAddress = what3words.replace(/^\/\/\//, '');

    console.log('Converting what3words address:', cleanAddress);

    // Call What3Words API
    const w3wResponse = await fetch(
      `https://api.what3words.com/v3/convert-to-coordinates?words=${encodeURIComponent(cleanAddress)}&key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!w3wResponse.ok) {
      const errorData = await w3wResponse.json();
      console.error('What3Words API error:', errorData);
      return new Response(
        JSON.stringify({ error: errorData.error?.message || 'Invalid what3words address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const w3wData = await w3wResponse.json();
    console.log('What3Words response:', w3wData);

    // Get coordinates
    const { lat, lng } = w3wData.coordinates;

    // Use Google Geocoding API to get full address details
    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!googleApiKey) {
      console.error('GOOGLE_PLACES_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Google Places API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geocodeResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}`
    );

    const geocodeData = await geocodeResponse.json();
    
    if (geocodeData.status !== 'OK' || !geocodeData.results || geocodeData.results.length === 0) {
      console.error('Geocoding failed:', geocodeData);
      return new Response(
        JSON.stringify({ 
          error: 'Could not convert coordinates to address',
          coordinates: { lat, lng }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = geocodeData.results[0];
    const addressComponents = {
      address_line1: "",
      suburb: "",
      city: "",
      province: "",
      postal_code: "",
      formatted_address: result.formatted_address,
      coordinates: { lat, lng }
    };

    // Parse address components
    for (const component of result.address_components) {
      const types = component.types;

      if (types.includes("street_number")) {
        addressComponents.address_line1 = component.long_name + " ";
      }
      if (types.includes("route")) {
        addressComponents.address_line1 += component.long_name;
      }
      if (types.includes("sublocality_level_1") || types.includes("sublocality")) {
        addressComponents.suburb = component.long_name;
      }
      if (types.includes("locality")) {
        addressComponents.city = component.long_name;
      }
      if (types.includes("administrative_area_level_1")) {
        addressComponents.province = component.long_name;
      }
      if (types.includes("postal_code")) {
        addressComponents.postal_code = component.long_name;
      }
    }

    console.log('Parsed address:', addressComponents);

    return new Response(
      JSON.stringify(addressComponents),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in convert-what3words function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
