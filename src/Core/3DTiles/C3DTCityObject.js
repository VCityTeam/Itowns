/**
 * Represents a city object.
 */
class C3DTCityObject {
    /**
     * Constructs a city object from the given parameters.
     *
     * @param {Object} tile The tile holding the city object.
     * @param {number} batchId Batch ID of the city object in the tile.
     * @param {number} indexStart Start index of the vertex array in the tile.
     * @param {number} [indexCount] Number of vertices corresponding to this batch
     * ID in the tile.
     * @param {THREE.Vector3} [centroid] Centroid of the geometry.
     * @param {Object} [props] Properties from the batch table.
     * @param {number} meshId The ID of the mesh containing the CityObject
     */
    constructor(
        tile,
        batchId,
        indexStart,
        indexCount,
        centroid,
        props,
        meshId,
    ) {
        /**
         * The tile holding the city object.
         *
         */
        this.tile = tile;

        /**
         * Batch ID of the city object in the tile.
         *
         * @type {number}
         */
        this.batchId = batchId;

        /**
         * The city object ID.
         *
         * @type {CityObjectID}
         */
        this.cityObjectId = { tileId: this.tile.tileId, batchId: this.batchId };

        /**
         * Start index of the vertex array in the tile.
         *
         * @type {number}
         */
        this.indexStart = indexStart;

        /**
         * Number of vertices corresponding to this batch ID in the tile.
         *
         * @type {number}
         */
        this.indexCount = indexCount || 0;

        /**
         * Centroid of the geometry.
         *
         * @type {THREE.Vector3}
         */
        this.centroid = centroid;

        /**
         * Properties from the batch table.
         *
         * @type {Object}
         */
        this.props = props || {};

        /**
         * The ID of the mesh containing the CityObject
         *
         * @type {number}
         */
        this.meshId = meshId;

        /**
         * The ID of the mesh's geometry group
         *
         * @type {number}
         */
        this.groupId = 0;
    }

    /**
     * "Set the material index of the batch to the given index."
     *
     * The first line of the function gets the mesh from the tile's content. The second line sets
     * the material index of the batch to the given index
     * @param {number} indexMaterial - the index of the material to use for this batch
     */
    setIndexMaterial(indexMaterial) {
        const mesh = this.tile.content.children[this.meshId];
        mesh.geometry.groups[this.groupId].materialIndex = indexMaterial;
    }

    /**
     * Last index of the vertex array.
     */
    get indexEnd() {
        return this.indexStart + this.indexCount - 1;
    }

    /**
     * Get the identifier of this CityObject default style
     */
    get defaultStyleId() {
        return `default${this.tile.tileId}m${this.meshId}`;
    }
}

/**
 * It takes a city object and returns an object ID
 * @param {Object} object - The object to create the ID for.
 * @returns {Object} A function that takes an object as an argument and returns an object with a tileId and
 * batchId property.
 */
export function createCityObjectID(object) {
    if (
        object === undefined ||
        typeof object.tileId !== 'number' ||
        (typeof object.batchId !== 'number' && !Array.isArray(object.batchId))
    ) {
        throw new Error('A city object must have a tileId and a batchId');
    }

    return { tileId: object.tileId, batchId: object.batchId };
}

export default C3DTCityObject;
