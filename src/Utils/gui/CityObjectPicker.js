import CameraUtils from 'Utils/CameraUtils';
import Widget from './Widget';

import { getFirstIntersection } from '../Picking3DTilesUtils';
import Coordinates from '../../Core/Geographic/Coordinates';

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
     * @param {Object} config - The configuration of the city-object-picker.
     * @param {Object} [options] - An object containing the options of the widget.
     */
    constructor(view, layerIDs, config = {}, options = {}) {
        // ---------- BUILD PROPERTIES ACCORDING TO DEFAULT OPTIONS AND OPTIONS PASSED IN PARAMETERS : ----------

        super(view, options, DEFAULT_OPTIONS);

        // ---------- this.domElement SETTINGS SPECIFIC TO city-object-picker : ----------

        this.domElement.id = 'widgets-city-object-picker';

        this.view = view;

        this.layerIDs = layerIDs;
        this.rangeFocus = config.rangeFocus || 200;
        this.tiltFocus = config.tiltFocus || 60;
        this.refreshUI = config.refreshUI || this.refreshUI;

        this.coSelected = null;
        this.savedCameraPosRot = null;

        // Initialize the text content of the city-object-picker, which will later be updated by a numerical value.
        this.domElement.innerHTML = 'City Object Picker';

        window.addEventListener('mousedown', () => {
            this.saveCameraPosRot();
        });

        window.addEventListener('mouseup', (event) => {
            this.pickCityObject(event);
            this.refreshUI();
        });

        this.refreshUI();
        this.width = options.width || DEFAULT_OPTIONS.width;
    }

    saveCameraPosRot() {
        this.savedCameraPosRot = this.getCameraPosRot();
    }

    getCameraPosRot() {
        return {
            position: this.view.camera.camera3D.position.clone(),
            rotation: this.view.camera.camera3D.rotation.clone(),
        };
    }

    /**
     * "Compare two position and rotation of the camera and return true if they are the same."
     *
     * The first thing we do is round the position values to the nearest integer. This is because the
     * position values are floats, and we want to compare them as integers
     * @param {Object} posRot1 - The first position and rotation.
     * @param {Object} posRot2 - The second position and rotation.
     * @returns {Boolean} A boolean value.
     */
    comparePosRot(posRot1, posRot2) {
        [posRot1, posRot2].forEach((posRot) => {
            posRot.position.x = Math.floor(posRot.position.x);
            posRot.position.y = Math.floor(posRot.position.y);
            posRot.position.z = Math.floor(posRot.position.z);
        });

        return (
            posRot1.position.equals(posRot2.position) &&
            posRot1.rotation.equals(posRot2.rotation)
        );
    }

    /**
     * If the mouse button is pressed and the camera hasn't moved, then get the city object that was
     * clicked on and update the selection info
     * @param {MouseEvent} event - the event object
     */
    pickCityObject(event) {
        if (
            event.button != 0 ||
            !this.comparePosRot(this.savedCameraPosRot, this.getCameraPosRot())
        ) {
            return;
        }

        // reset the selected city object
        if (this.getCityObjectSelected()) {
            this.getCityObjectSelected().setIndexMaterial(0); // set the material to the default one
        }

        this.setInfo(this.createInfoObjectFromIntersectObject(event));

        const info = this.getInfo();
        if (!info) {
            return;
        }

        // set the selected city object
        if (info && info.tile) {
            const coManager = info.tile.cityObjectManager;
            this.setCityObjectSelected(
                coManager.cityObjects[info.batchInfo.batchID],
            );
            this.getCityObjectSelected().setIndexMaterial(1); // set the material to the selected one
        } else {
            this.setCityObjectSelected(null);
        }
        this.view.notifyChange();
    }

    /**
     * It gets the first intersection of the mouse with a tile, and returns the tile, the layer, and the
     * batch info
     * @param {MouseEvent} event - The event object from the mouse event.
     * @returns {Object} An object with the tile, layer, and batchInfo.
     */
    createInfoObjectFromIntersectObject(event) {
        const info = {};
        // Get the intersecting objects where our mouse pointer is
        let intersects = [];
        // As the current pickObjectsAt on all layer is not working, we need
        // to call pickObjectsAt() for each layer.
        for (let i = 0; i < this.layerIDs.length; i++) {
            intersects = intersects.concat(
                this.view.pickObjectsAt(event, 5, this.layerIDs[i]),
            );
        }
        if (intersects.length > 0) {
            const { firstInteraction, tile } = getFirstIntersection(intersects);
            if (firstInteraction != null) {
                info.tile = tile;
                info.layer = info.tile.layer;
                info.batchInfo = info.layer.getInfoFromIntersectObject([
                    firstInteraction,
                ]);

                return info;
            }
        }
        return null;
    }

    /**
     * It creates / refresh the UI of the city-object-picker.
     */
    refreshUI() {
        /* Creating a section, a title, and a list. */
        this.domElement.innerHTML = '';
        const selectionSection = document.createElement('section');

        const selectionTitle = document.createElement('h3');
        selectionTitle.innerHTML = 'Selected city object : ';

        const selectionInfo = document.createElement('ul');

        selectionSection.appendChild(selectionTitle);
        selectionSection.appendChild(selectionInfo);
        this.domElement.appendChild(selectionSection);

        const info = this.getInfo();
        if (info) {
            const { layer, batchInfo, tile } = info;
            const color = layer.secondaryMaterials[0].color;
            selectionInfo.style.backgroundColor = `rgba(${color.r * 255}, ${
                color.g * 255
            }, ${color.b * 255}, ${0.15})`;

            const tileIDLi = document.createElement('li');
            tileIDLi.innerHTML = `Tile ID : ${tile.id}`;
            selectionInfo.appendChild(tileIDLi);

            const batchIDLi = document.createElement('li');
            batchIDLi.innerHTML = `Batch ID : ${batchInfo.batchID}`;
            selectionInfo.appendChild(batchIDLi);

            const layerIDLi = document.createElement('li');
            layerIDLi.innerHTML = `Layer ID : ${layer.id}`;
            selectionInfo.appendChild(layerIDLi);

            for (const keys of Object.keys(batchInfo.batchTable)) {
                const li = document.createElement('li');
                li.innerHTML = `BatchTable ${keys} : ${batchInfo.batchTable[keys]}`;
                selectionInfo.appendChild(li);
            }

            const focusButton = this.createFocusButton();
            selectionInfo.appendChild(focusButton);
        } else {
            selectionInfo.innerHTML = 'No city object selected';
            selectionInfo.style.backgroundColor = '';
        }
    }

    /**
     * It creates a button that, when clicked, will animate the camera to look at the selected city object
     * @returns {HTMLButtonElement} A button element with the text "Focus"
     */
    createFocusButton() {
        const focusButton = document.createElement('button');
        focusButton.innerHTML = 'Focus';
        const _this = this;
        focusButton.addEventListener('click', () => {
            if (!_this.getCityObjectSelected()) {
                return;
            }

            const view = _this.view;
            const camera = view.camera.camera3D;
            const co = _this.getCityObjectSelected();
            const coord = new Coordinates(
                view.referenceCrs,
                co.centroid.clone(),
            );

            const params = {
                coord,
                range: _this.rangeFocus,
                tilt: _this.tiltFocus,
            };

            CameraUtils.animateCameraToLookAtTarget(view, camera, params);
        });
        return focusButton;
    }

    /**
     * This function sets the selected city object to the one passed in
     * @param {C3DTCityObject | null} co - The city object that was selected.
     */
    setCityObjectSelected(co) {
        this.coSelected = co;
    }

    /**
     * It returns the value of the variable `coSelected`
     * @returns {C3DTCityObject | null} The city object selected.
     */
    getCityObjectSelected() {
        return this.coSelected;
    }

    /**
     * This function sets the info property of the object to the value of the info parameter.
     * @param {Object | null} info - The info object that is passed to the constructor of the class.
     */
    setInfo(info) {
        this.info = info;
    }

    /**
     * It returns the value of the `info` property of the object that called it
     * @returns {Object | null} The info property of the object.
     */
    getInfo() {
        return this.info;
    }
}

export default CityObjectPicker;
