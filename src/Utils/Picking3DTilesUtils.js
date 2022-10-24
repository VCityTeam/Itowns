/**
 * It takes an object and returns the tile that contains it
 * @param {Object} object - The intersected object.
 * @returns {Object} The tile.
 */
function getTileFromObjectIntersected(object) {
    if (!object) {
        throw new Error('Tile not loaded in view');
    }

    // Find the 'Object3D' part of the tile
    while (!!object.parent && !(object.type === 'Object3D')) {
        object = object.parent;
    }

    if (!object.batchTable) {
        throw new Error('Invalid tile : no batch table');
    }

    return object;
}

/**
 * Return the first intersected object that is visible and has a visible tile and a visible tile
 * content.
 * @param {Array<Object>} intersects - the array of intersections returned by the raycaster
 * @returns {Object | null} The first intersection that is visible.
 */
function getFirstIntersection(intersects) {
    /* Iterating through the array of intersections returned by the raycaster and returning the first intersection that is visible. */
    for (const inter of intersects) {
        const tile = getTileFromObjectIntersected(inter.object);
        if (inter.object.visible && tile.visible && tile.content.visible) {
            return { firstInteraction: inter, tile };
        }
    }
    return { firstInteraction: null, tile: null };
}

export { getTileFromObjectIntersected, getFirstIntersection };
