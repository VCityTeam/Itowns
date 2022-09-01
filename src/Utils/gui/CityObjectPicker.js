import Widget from './Widget';

import { getTileFromObjectIntersected } from '../../../examples/js/3dTilesHelper';

const DEFAULT_OPTIONS = {
    height: 'fit-content',
    position: 'top-right',
};

/**
 * example path : "/examples/widgets_city_object_picker.html"
 *
 * @extends Widget
 *
 * @property {HTMLElement} domElement An html div containing the minimap.
 */
class CityObjectPicker extends Widget {
    /**
     * It creates a widget that displays the camera's position and rotation, and allows the user to
     * change them
     * @param {View} view - The view to which the city-object-picker is linked. Only work with {@link PlanarView}
     * @param {[string]} layerIDs - The layer IDs to which the city-object-picker is linked.
     * @param {Object} [options] - An object containing the options of the widget.
     */
    constructor(view, layerIDs, options = {}) {
        // ---------- BUILD PROPERTIES ACCORDING TO DEFAULT OPTIONS AND OPTIONS PASSED IN PARAMETERS : ----------

        super(view, options, DEFAULT_OPTIONS);

        // ---------- this.domElement SETTINGS SPECIFIC TO city-object-picker : ----------

        this.domElement.id = 'widgets-city-object-picker';
        this.selectionInfo = null;

        this.view = view;

        this.layerIDs = layerIDs;

        this.coSelected = null;

        // Initialize the text content of the city-object-picker, which will later be updated by a numerical value.
        this.domElement.innerHTML = 'City Object Picker';

        window.addEventListener('mousedown', this.pick.bind(this));

        this.initUI();
        this.width = options.width || DEFAULT_OPTIONS.width;
    }

    pick(event) {
        const info = this.getInfoFromCityObject(event);

        // reset the selected city object
        if (this.coSelected) {
            this.coSelected.setIndexMaterial(0); // set the material to the default one
        }
        // set the selected city object
        if (info && info.tile) {
            const coManager = info.tile.cityObjectManager;
            this.coSelected = coManager.cityObjects[info.batchInfo.batchID];
            this.coSelected.setIndexMaterial(1); // set the material to the selected one
        } else {
            this.coSelected = null;
        }
        this.view.notifyChange();

        this.updateSelectionInfo(info);
    }

    getInfoFromCityObject(event) {
        const info = {};
        const intersects = this.view.pickObjectsAt(event, 5, ...this.layerIDs);
        if (intersects.length > 0) {
            info.tile = getTileFromObjectIntersected(intersects[0].object);
            info.layer = info.tile.layer;
            info.batchInfo = info.layer.getInfoFromIntersectObject([
                intersects[0],
            ]);

            return info;
        }
        return null;
    }

    initUI() {
        const selectionSection = document.createElement('section');

        const selectionTitle = document.createElement('h3');
        selectionTitle.innerHTML = 'Selected city object : ';

        const selectionInfo = document.createElement('ul');
        this.selectionInfo = selectionInfo;

        selectionSection.appendChild(selectionTitle);
        selectionSection.appendChild(selectionInfo);
        this.domElement.appendChild(selectionSection);

        this.updateSelectionInfo(null);
    }

    updateSelectionInfo(info) {
        if (info) {
            const { layer, batchInfo, tile } = info;

            this.selectionInfo.innerHTML = '';

            const color = layer.secondaryMaterials[0].color;
            this.selectionInfo.style.color = `rgb(${color.r * 255}, ${
                color.g * 255
            }, ${color.b * 255})`;

            const tileIDLi = document.createElement('li');
            tileIDLi.innerHTML = `Tile ID : ${tile.id}`;
            this.selectionInfo.appendChild(tileIDLi);

            const batchIDLi = document.createElement('li');
            batchIDLi.innerHTML = `Batch ID : ${batchInfo.batchID}`;
            this.selectionInfo.appendChild(batchIDLi);

            const layerIDLi = document.createElement('li');
            layerIDLi.innerHTML = `Layer ID : ${layer.id}`;
            this.selectionInfo.appendChild(layerIDLi);

            for (const keys of Object.keys(batchInfo.batchTable)) {
                const li = document.createElement('li');
                li.innerHTML = `BatchTable ${keys} : ${batchInfo.batchTable[keys]}`;
                this.selectionInfo.appendChild(li);
            }
        } else {
            this.selectionInfo.innerHTML = 'No city object selected';
            this.selectionInfo.style.color = 'whitesmoke';
        }
    }
}

export default CityObjectPicker;
