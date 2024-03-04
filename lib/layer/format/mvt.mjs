/**
### mapp.layer.formats.mvt()

@module /layer/formats/mvt
*/

export default layer => {

  // Assign default SRID if nullish.
  layer.srid ??= '3857'

  // If 4326, return an error as this is not supported anymore. 
  if (layer.srid !== '3857') {
    console.warn(`Layer ${layer.key} must be set to use SRID 3857.`)
    return;
  }

  // Update feature style config.
  mapp.layer.styleParser(layer)

  // Set default layer params if nullish.
  layer.params ??= {}

  if (layer.mvt_cache) {

    console.warn(`Layer ${layer.key} mvt_cache has been disabled.`)
  }

  // MVT query must not have a viewport, this is defined by the tile extent.
  delete layer.params.viewport

  // The layer may be zoom level restricted.
  layer.tables && layer.mapview.Map.getTargetElement().addEventListener('changeEnd', () => {

    if (!layer.tableCurrent() && layer.display) {

      // Layer should be shown if possible.
      layer.zoomDisplay = true

      layer.hide()
      
    } else if (layer.zoomDisplay && !layer.display) {

      // Prevents layer.show() being fired on zoom change within range.
      delete layer.zoomDisplay

      // Show layer if within zoomDisplay range.
      layer.show()
    }
  })

  layer.reload = () => {

    if (layer.wkt_properties) {
      changeEndLoad(layer)
      return;
    }

    layer.source.clear()
    layer.source.refresh()
    layer.featureSource.refresh()
  }

  layer.clones = new Set()

  // The snapSource is required for snap interactions on vector tile layer.
  // The featureClasss is detrimental to the render performance.
  layer.featureSource = new ol.source.VectorTile({
    format: new ol.format.MVT({
      featureClass: ol.Feature,
      //idProperty: 'id'
    }),
    transition: 0,
    cacheSize: 0,
    tileUrlFunction
  })

  // Define source for mvt layer.
  layer.source = new ol.source.VectorTile({
    format: new ol.format.MVT(),
    transition: layer.transition,
    cacheSize: layer.cacheSize
  })

  // Assign wkt properties load method.
  if (layer.wkt_properties) {
    layer.source.setTileUrlFunction(wktTileUrlFunction(layer))
    layer.mapview.Map.getTargetElement().addEventListener('changeEnd', () => changeEndLoad(layer));

  } else {

    layer.source.setTileUrlFunction(tileUrlFunction(layer))
  }

  layer.L = new ol.layer.VectorTile({
    key: layer.key,
    source: layer.source,
    renderBuffer: 200,
    //renderMode: 'vector',
    zIndex: layer.style?.zIndex || 1,
    style: mapp.layer.featureStyle(layer)
  })
}

function wktTileUrlFunction(layer) {

  return tileCoord => {

    const table = layer.tableCurrent()

    // The layer has no data for this zoom level.
    if (!table) {
      layer.source.clear();
      return;
    }

    // The layer does not display and doesn't have clones.
    if (!layer.display && !layer.clones?.size) {
      layer.source.clear();
      return;
    }

    const geom = layer.geomCurrent()

    const url = `${layer.mapview.host}/api/query?${mapp.utils.paramString({
      template: 'mvt',
      z: tileCoord[0],
      x: tileCoord[1],
      y: tileCoord[2],
      locale: layer.mapview.locale.key,
      layer: layer.key,
      srid: layer.mapview.srid,
      table,
      geom
    })}`

    return url
  }
}

function tileUrlFunction(layer) {

  return tileCoord => {

    const table = layer.tableCurrent()

    // The layer has no data for this zoom level.
    if (!table) {
      layer.source.clear();
      return;
    }

    // The layer does not display and doesn't have clones.
    if (!layer.display && !layer.clones?.size) {
      layer.source.clear();
      return;
    }

    const geom = layer.geomCurrent()

    // Create a set of feature properties for styling.
    layer.params.fields = [...new Set([
      Array.isArray(layer.style.theme?.fields) ?
        layer.style.theme.fields : layer.style.theme?.field,
      layer.style.theme?.field,
      layer.style.label?.field
    ].flat().filter(field => !!field))]

    const url = `${layer.mapview.host}/api/query?${mapp.utils.paramString({
      template: 'mvt',
      z: tileCoord[0],
      x: tileCoord[1],
      y: tileCoord[2],
      locale: layer.mapview.locale.key,
      layer: layer.key,
      table,
      geom,
      filter: layer.filter?.current,
      ...layer.params
    })}`

    return url
  }

}

function changeEndLoad(layer) {

  layer.xhr?.abort()

  const table = layer.tableCurrent()

  if ((!table || !layer.display) && !layer.clones?.size) return layer.source.clear()

  const geom = layer.geomCurrent()

  // Create a set of feature properties for styling.
  layer.params.fields = [...new Set([
    Array.isArray(layer.style.theme?.fields) ?
      layer.style.theme.fields : layer.style.theme?.field,
    layer.style.theme?.field,
    layer.style.label?.field
  ].flat().filter(field => !!field))]

  // Do not query WKT without fields.
  if (!layer.params.fields.length) return;

  const bounds = layer.mapview.getBounds()

  // Assign current viewport if queryparam is truthy.
  let viewport = [bounds.west, bounds.south, bounds.east, bounds.north, layer.mapview.srid];

  // Assign current viewport if queryparam is truthy.
  let z = layer.mapview.Map.getView().getZoom();

  layer.xhr = new XMLHttpRequest()

  layer.xhr.responseType = 'json'

  layer.xhr.onload = e => {

    layer.featuresObject = {}

    if (!e.target?.response) {
      layer.L.changed()
      return;
    }

    mapp.layer.featureFormats.wkt_properties(layer, e.target.response)

    layer.L.changed()
  }

  layer.xhr.open('GET', `${layer.mapview.host}/api/query?${mapp.utils.paramString({
    template: 'wkt',
    locale: layer.mapview.locale.key,
    layer: layer.key,
    table,
    geom,
    no_geom: true,
    viewport,
    z,
    filter: layer.filter?.current,
    ...layer.params
  })}`)

  layer.xhr.send()
}