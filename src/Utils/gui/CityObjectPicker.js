import CameraUtils from 'Utils/CameraUtils';
import Widget from './Widget';

import {
    getTileFromObjectIntersected,
    getFirstIntersection,
} from '../Picking3DTilesUtils';
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
        this.selectionInfo = null;

        this.view = view;

        this.layerIDs = layerIDs;
        this.rangeFocus = config.rangeFocus || 200;
        this.tiltFocus = config.tiltFocus || 60;

        this.coSelected = null;
        this.savedCameraPosRot = null;

        // Initialize the text content of the city-object-picker, which will later be updated by a numerical value.
        this.domElement.innerHTML = 'City Object Picker';

        window.addEventListener('mousedown', () => {
            this.saveCameraPosRot();
        });
        window.addEventListener('mouseup', this.pick.bind(this));

        this.initUI();
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
    pick(event) {
        if (
            event.button != 0 ||
            !this.comparePosRot(this.savedCameraPosRot, this.getCameraPosRot())
        ) {
            return;
        }
        const info = this.getInfoFromCityObject(event);

        if (!info) {
            return;
        }

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

    /**
 * It gets the first intersection of the mouse with a tile, and returns the tile, the layer, and the
 * batch info
 * @param {MouseEvent} event - The event object from the mouse event.
 * @returns {Object} An object with the tile, layer, and batchInfo.
 */
    getInfoFromCityObject(event) {
        const info = {};
        const intersects = this.view.pickObjectsAt(event, 5, ...this.layerIDs);
        if (intersects.length > 0) {
            const firstIntersect = getFirstIntersection(intersects);
            if (firstIntersect != null) {
                info.tile = getTileFromObjectIntersected(firstIntersect.object);
                info.layer = info.tile.layer;
                info.batchInfo = info.layer.getInfoFromIntersectObject([
                    firstIntersect,
                ]);

                return info;
            }
        }
        return null;
    }

    /**
 * It creates a section element, adds a title and a list element to it, and then adds the section to
 * the main DOM element
 */
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

    /* Updating the selection info. */
    updateSelectionInfo(info) {
        if (info) {
            const { layer, batchInfo, tile } = info;

            this.selectionInfo.innerHTML = '';

            const color = layer.secondaryMaterials[0].color;
            this.selectionInfo.style.backgroundColor = `rgba(${
                color.r * 255
            }, ${color.g * 255}, ${color.b * 255}, ${0.15})`;

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

            const focusButton = document.createElement('button');
            focusButton.innerHTML = 'Focus';
            const _this = this;
            focusButton.addEventListener('click', () => {
                if (!_this.coSelected) {
                    return;
                }

                const view = _this.view;
                const camera = view.camera.camera3D;
                const co = _this.coSelected;
                // const cameraTransformOptions =
                //     CameraUtils.getTransformCameraLookingAtTarget(
                //         view,
                //         camera,
                //         co.centroid.clone(),
                //     );
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
            this.selectionInfo.appendChild(focusButton);
        } else {
            this.selectionInfo.innerHTML = 'No city object selected';
            this.selectionInfo.style.backgroundColor = '';
        }
    }
}

export default CityObjectPicker;
