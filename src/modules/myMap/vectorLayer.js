import React, { useState, useEffect } from "react"
import { GeoJSON, LayersControl, useMap } from "react-leaflet"
import * as bbox from "geojson-bbox"

import getData from "../../services/getData"

const VectorLayer = ({
  path2geojson,
  dEndPoint,
  dTable,
  dFilter,
  dToken,
  name,
  popupTemplate,
  pointToLayer,
  filter,
  checked,
  fitToContent,
  geoField
}) => {
  const [geojsonData, setGeojson] = useState()
  const [error, setError] = useState(false)
  const map = useMap()

  useEffect(() => {
    if (path2geojson) {
      getData(path2geojson, null, "json")
        .then(geoJSON => {
          setGeojson(geoJSON)
        })
        .catch(err => {
          console.log(err)
          setError("Error getting remote data from static file")
        })
    } else {
      // Define Drectus endpoint anche check all dependencies
      let endPoint
      if (dEndPoint) {
        endPoint = dEndPoint
      } else if (dTable) {
        if (!process.env.GATSBY_DIRECTUS_ENDPOINT) {
          setError(
            "Cannot calculate API end-point. Parameter dTable requires the env variable GATSBY_DIRECTUS_ENDPOINT to be set"
          )
          return
        }
        endPoint = `${process.env.GATSBY_DIRECTUS_ENDPOINT}items/${dTable}`
      } else {
        setError(
          "Cannont calculate Directus enpoint. Please provide a full endpoint as a MyMap attribute or provide dTable attribute and set GATSBY_DIRECTUS_ENDPOINT environmental variable"
        )
        return
      }
      if (dFilter) {
        endPoint += `?${dFilter}`
      }
      // Define Directus token
      const token = dToken ? dToken : process.env.GATSBY_DIRECTUS_TOKEN
      if (!token) {
        setError(
          "Cannot calculate Directus token. Please provide it as an attribute of the MyMap component or define it as the environmnetal variable GATSBY_DIRECTUS_TOKEN"
        )
        return
      }
      getData(endPoint, token, "geojson", geoField)
        .then(geoJSON => {
          setGeojson(geoJSON)
        })
        .catch(err => {
          console.log(err)
          setError("Error getting remote data")
        })
    }
  }, [path2geojson, dEndPoint, dTable, dFilter, dToken, geoField]) // L'array di dipendenze vuoto assicura che questo effetto venga eseguito solo una volta, simile a componentDidMount

  if (error) {
    console.log(error)
    return <></>
  } else if (!geojsonData) {
    return <></>
  } else {
    if (fitToContent) {
      const lBb = bbox(geojsonData)
      map.fitBounds([
        [lBb[1], lBb[0]],
        [lBb[3], lBb[2]],
      ])
    }

    return (
      <LayersControl.Overlay name={name} checked={checked}>
        <GeoJSON
          data={geojsonData}
          pointToLayer={pointToLayer ? pointToLayer : null}
          onEachFeature={(feature, layer) =>
            layer.bindPopup(popupTemplate(feature.properties))
          }
          filter={filter ? filter : null}
        />
      </LayersControl.Overlay>
    )
  }
}

export { VectorLayer }
