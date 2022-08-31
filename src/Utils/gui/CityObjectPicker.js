import { CONTROL_EVENTS } from 'Controls/GlobeControls';
import { GLOBE_VIEW_EVENTS } from 'Core/Prefab/GlobeView';
import { PLANAR_CONTROL_EVENT } from 'Controls/PlanarControls';
import * as THREE from 'three';
import Widget from './Widget';
import View from '../../Core/View';
import { getTileFromObjectIntersected } from '../../../examples/js/3dTilesHelper';

const DEFAULT_OPTIONS = {
    width: 200,
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
     * @param {[string]}  layerIDs - The layer IDs to which the city-object-picker is linked.
     * @param {Object} [options] - An object containing the options of the widget.
     */
    constructor(view, layerIDs, options = {}) {
        // ---------- BUILD PROPERTIES ACCORDING TO DEFAULT OPTIONS AND OPTIONS PASSED IN PARAMETERS : ----------

        super(view, options, DEFAULT_OPTIONS);

        // ---------- this.domElement SETTINGS SPECIFIC TO city-object-picker : ----------

        this.domElement.id = 'widgets-city-object-picker';

        this.view = view;

        this.layerIDs = layerIDs;

        // Initialize the text content of the city-object-picker, which will later be updated by a numerical value.
        this.domElement.innerHTML = 'City Object Picker';

        this.width = options.width || DEFAULT_OPTIONS.width;
        window.addEventListener('mousedown', this.pick.bind(this));
    }

    pick(event) {
        const info = this.getInfoFromCityObject(event);

        // // reset the selected city object
        // if (coSelected) {
        //     coSelected.setIndexMaterial(0); // set the material to the default one
        // }
        // // set the selected city object
        // if (info && info.tile) {
        //     const coManager = info.tile.cityObjectManager;
        //     coSelected = coManager.cityObjects[info.batchID];
        //     coSelected.setIndexMaterial(1); // set the material to the selected one
        // } else {
        //     coSelected = null;
        // }
        // view.notifyChange();
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
}

export default CityObjectPicker;
