import './App.css'
import 'leaflet/dist/leaflet.css'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { AppBar, CssBaseline, Grid, Toolbar, Typography } from '@mui/material';
import { MapContainer } from 'react-leaflet/MapContainer'
import { TileLayer } from 'react-leaflet/TileLayer'
import { Marker } from 'react-leaflet/Marker'
import { Popup } from 'react-leaflet/Popup'


const position = [43.0495, -76.1474] as [number, number]

// Popular free map tile providers/themes
const mapThemes = {
  // Light, minimal, modern - great for most apps
  positron: {
    name: 'Positron (Light)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: ''
  }
}

// Change this to switch themes: 'positron' | 'darkMatter' | 'voyager' | 'toner' | 'terrain' | 'watercolor' | 'osm'
const currentTheme = 'positron'

function App() {
  const selectedTheme = mapThemes[currentTheme]

  return (
    <>
      <CssBaseline />
      <div>
        <AppBar position="static" color='secondary' elevation={5}>
          <Toolbar >
            <Typography variant="h6">Spot Hop</Typography>
          </Toolbar>
        </AppBar>

        <Grid container spacing={2} sx={{ height: 'calc(100vh - 64px)' }}>
          <Grid size={{ xs: 12, md: 8 }} sx={{ height: '100%', p: 0, position: 'relative' }}>
            <MapContainer
              center={position}
              zoom={15}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
              <TileLayer
                url={selectedTheme.url}
                attribution={selectedTheme.attribution}
              />
              <Marker position={position}>
                <Popup>
                  A pretty CSS3 popup. <br /> Easily customizable.
                </Popup>
              </Marker>
            </MapContainer>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <h1>List</h1>
          </Grid>
        </Grid>
      </div>
    </>
  )
}

export default App
