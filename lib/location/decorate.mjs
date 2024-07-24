/**
### /location/decorate

@module /location/decorate
*/

/**
@function decorate

@description
The location decorator method creates mapp-location typedef object from a JSON location.

@param {object} location JSON location.

@returns {location} Decorated Mapp Location.
*/

export default function decorate(location) {

  Object.assign(location, {
    flyTo,
    Layers: [],
    remove,
    removeCallbacks: [],
    removeEdits,
    restoreEdits,
    trash,
    update,
    syncFields,
    updateCallbacks: [],
  })

  return location;
}

function remove() {

  // Checks may be performed after async oprations
  // whether a location has already been removed.
  delete this.remove

  this.layer.mapview.hooks && mapp.hooks.filter('locations', this.hook)

  delete this.layer.mapview.locations[this.hook]

  this.view instanceof HTMLElement && this.view.remove()

  this.Layers?.forEach(
    L => this.layer.mapview.Map.removeLayer(L))

  this.layer.mapview.interaction.type !== 'highlight'
    && this.layer.mapview.interactions.highlight()

  // Reload the layer if possible.
  this.layer.reload && this.layer.reload()

  this.removeCallbacks?.forEach(
    fn => typeof fn === 'function' && fn(this))
}

/**
Update a location from host
@function update
*/

async function update() {

  if (this.infoj.some(entry => entry.invalid)) {

    alert(`Unable to update location with invalid entry value.`)
    return new Error('Unable to update.');
  }

  this.infoj
  .filter(entry => entry.jsonb_key)
  .filter(entry => entry.jsonb_field)
  .filter(entry => typeof entry.newValue !== 'undefined')
  .forEach(entry => {

    entry.newValue = {
      'jsonb': {
        [entry.jsonb_field]: {
          [entry.jsonb_key]: entry.newValue
        }
      }
    }
  })

  this.infoj
    .filter(entry => entry.json_field)
    .filter(entry => entry.json_key)
    .filter(entry => typeof entry.newValue !== 'undefined')
    .forEach(entry => {

      const fieldEntry = this.infoj.find(_entry => _entry.field === entry.json_field)

      fieldEntry.newValue ??= fieldEntry.value || {}

      fieldEntry.newValue[entry.json_key] = entry.newValue

      delete entry.newValue
    })

  // Map new values into newValues object.
  const newValues = Object.fromEntries(this.infoj
    .filter(entry => typeof entry.newValue !== 'undefined')
    .map(entry => [entry.field, entry.newValue]))

  if (!Object.keys(newValues).length) return;

  const location_update = await mapp.utils.xhr({
    method: 'POST',
    url:
      `${this.layer.mapview.host}/api/query?` +
      mapp.utils.paramString({
        template: 'location_update',
        locale: this.layer.mapview.locale.key,
        layer: this.layer.key,
        table: this.table,
        id: this.id,
      }),
    body: JSON.stringify(newValues),
  });

  if (location_update instanceof Error) {
    alert(`Location update has failed.`)
    this.view?.classList.remove('disabled')
    return;
  }

  // Update entry.values with newValues.
  // Return dependents from updated entries.
  const dependents = this.infoj
    .filter(entry => typeof entry.newValue !== 'undefined')
    .map(entry => {

      entry.value = entry.newValue;
      delete entry.newValue;

      return entry.dependents
    })
    .flat()
    .filter(dependents => dependents !== undefined)

  // sync dependent fields
  if (dependents.length) await this.syncFields([...new Set(dependents)])

  // Reload layer.
  this.layer.reload()

  this.updateCallbacks?.forEach(fn => typeof fn === 'function' && fn(this))
}

async function syncFields(fields) {

  const response = await mapp.utils.xhr(
    `${this.layer.mapview.host}/api/query?` +
    mapp.utils.paramString({
      template: 'location_get',
      locale: this.layer.mapview.locale.key,
      layer: this.layer.key,
      table: this.table,
      id: this.id,
      fields: fields.join(),
    }));

  // Return if response is falsy or error.
  if (!response || response instanceof Error) {
    console.warn('No data returned from location_get request using ID:', this.id)
    return
  }
  // Check if the response is an array.
  else if (Array.isArray(response)) {
    console.warn(`Location response returned more than one record for Layer: ${this.layer.key}.`)
    console.log('Location Get Response:', response)
    return
  }

  this.infoj
    .filter(entry => typeof response[entry.field] !== 'undefined')
    .forEach(entry => {
      entry.value = response[entry.field];
    })
}

function flyTo(maxZoom) {
  const sourceVector = new ol.source.Vector();

  this.Layers.forEach((layer) => {
    const source = layer.getSource();
    typeof source.getFeatures === 'function' && sourceVector.addFeatures(source.getFeatures());
  });

  this.layer.mapview.fitView(sourceVector.getExtent(), {
    maxZoom
  });
}

async function trash() {

  if (!confirm(mapp.dictionary.confirm_delete)) return;

  await mapp.utils.xhr(`${this.layer.mapview.host}/api/query?` +
    mapp.utils.paramString({
      template: 'location_delete',
      locale: this.layer.mapview.locale.key,
      layer: this.layer.key,
      table: this.table,
      id: this.id
    }))

  this.remove()
}

function removeEdits() {

  // Iterate through the location.infoj entries.
  this.infoj.forEach(entry => {

    if (!entry.edit) return;

    // Remove newValue
    // Unsaved edits will be lost.
    delete entry.newValue

    // Change edit key to _edit
    entry._edit = entry.edit
    delete entry.edit
  })
}

function restoreEdits() {

  // Restore edit in infoj entries
  this.infoj.forEach(entry => {

    if (!entry._edit) return;

    entry.edit = entry._edit
    delete entry._edit
  })
}