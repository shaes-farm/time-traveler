'use client'
import {useTheme} from '@mui/material/styles';
import {
  Annotation,
  ComposableMap,
  Geographies,
  Geography,
  Graticule,
  // Line,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";

// const WORLD_COUNTRIES_WO_ANTARCTICA = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries-sans-antarctica.json"
// const WORLD_COUNTRIES = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json"
// const WORLD_CONTINENTS = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-continents.json"
const WORLD_COUNTRIES_110m = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
// const WORLD_COUNTRIES_50m = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"
// const WORLD_COUNTRIES_10m = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-10m.json"

const GEO_URL = WORLD_COUNTRIES_110m;

interface GeoJSON {
  rsmKey: string;
}

export interface WorldMapMarker {
  style: 'dot' | 'text';
  coordinates: [number, number];
  radius?: number;
  text?: string;
}

export interface WorldMapAnnotation {
  anchor?: 'start' | 'middle' | 'end';
  coordinates: [number, number];
  dx: number;
  dy: number;
  label: string;
  labelX?: number;
  labelY?: number;
}

interface WorldMapProps {
  annotations?: WorldMapAnnotation[];
  center?: [number, number];
  geoUrl?: string | URL;
  graticule?: boolean;
  markers?: WorldMapMarker[];
  projection?: string;
  projectionConfig?: object;
  zoom?: number;
}

export function WorldMap(props: WorldMapProps): JSX.Element {
  const {
    annotations = [],
    center = [0, 0],
    geoUrl = GEO_URL,
    graticule = false,
    markers = [],
    projection,
    projectionConfig,
    zoom = 1,
  } = props;

  const theme = useTheme();

  return (
    <ComposableMap projection={projection} projectionConfig={projectionConfig}>
      <ZoomableGroup center={center} zoom={zoom}>
        {graticule ? <Graticule stroke={theme.palette.divider} /> : null}
        <Geographies geography={geoUrl}>
          {
            ({geographies}: {geographies: GeoJSON[]}) =>
              geographies.map((geo) => (
                <Geography
                  geography={geo}
                  key={geo.rsmKey}
                  stroke={theme.palette.divider}
                  style={{
                    default: {
                      fill: "#0d7",
                    },
                    hover: {
                      fill: theme.palette.secondary.dark,
                    },
                    pressed: {
                      fill: "#d42",
                    },
                  }}
                />
              )
            )
          }
        </Geographies>
        {markers.map((marker, index) => (
          <Marker coordinates={marker.coordinates} key={Symbol(index).toString()}>
            {marker.style === 'dot' && <circle fill={theme.palette.primary.dark} r={marker.radius} />}
            {marker.style === 'text' && <text fill={theme.palette.primary.dark} textAnchor="middle">{marker.text}</text>}
          </Marker>
        ))}
        {annotations.map((annotation, index) => (
          <Annotation
            connectorProps={{
              stroke: theme.palette.primary.dark,
              strokeWidth: 1,
              strokeLinecap: "round"
            }}
            dx={annotation.dx}
            dy={annotation.dy}
            key={Symbol(index).toString()}
            subject={annotation.coordinates}
          >
            <text alignmentBaseline="middle" fill={theme.palette.primary.dark} textAnchor={annotation.anchor} x={annotation.labelX} y={annotation.labelY}>
              {annotation.label}
            </text>
          </Annotation>
        ))}
      </ZoomableGroup>
    </ComposableMap>
  );
}
