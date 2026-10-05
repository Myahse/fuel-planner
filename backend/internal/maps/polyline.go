package maps

// DecodePolyline decodes a Google-encoded polyline (Mapbox directions use precision 6).
func DecodePolyline(encoded string, precision uint32) []LatLng {
	if encoded == "" {
		return nil
	}
	factor := mathPow10(precision)
	var (
		index  int
		lat    int
		lng    int
		out    []LatLng
		length = len(encoded)
	)
	for index < length {
		var result int
		var shift uint
		for {
			if index >= length {
				return out
			}
			b := int(encoded[index]) - 63
			index++
			result |= (b & 0x1f) << shift
			shift += 5
			if b < 0x20 {
				break
			}
		}
		dlat := result >> 1
		if result&1 != 0 {
			dlat = ^dlat
		}
		lat += dlat

		result = 0
		shift = 0
		for {
			if index >= length {
				return out
			}
			b := int(encoded[index]) - 63
			index++
			result |= (b & 0x1f) << shift
			shift += 5
			if b < 0x20 {
				break
			}
		}
		dlng := result >> 1
		if result&1 != 0 {
			dlng = ^dlng
		}
		lng += dlng
		out = append(out, LatLng{
			Lat: float64(lat) / factor,
			Lng: float64(lng) / factor,
		})
	}
	return out
}

type LatLng struct {
	Lat float64
	Lng float64
}

func mathPow10(n uint32) float64 {
	p := 1.0
	for i := 0; i < int(n); i++ {
		p *= 10
	}
	return p
}
