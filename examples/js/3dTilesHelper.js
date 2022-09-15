// Function allowing picking on a given 3D tiles layer and filling an html div
// with information on the picked feature
// Expected arguments:
// pickingArg.htmlDiv (div element which contains the picked information)
// pickingArg.view : iTowns view where the picking must be done
// pickingArg.layer : the layer on which the picking must be done
// eslint-disable-next-line
function fillHTMLWithPickingInfo(event, pickingArg) {
    if (!pickingArg.layer.isC3DTilesLayer) {
        console.warn(
            "Function fillHTMLWithPickingInfo only works" +
                " for C3DTilesLayer layers."
        );
        return;
    }

    // Remove content already in html div
    while (pickingArg.htmlDiv.firstChild) {
        pickingArg.htmlDiv.removeChild(pickingArg.htmlDiv.firstChild);
    }

    // Get intersected objects
    var intersects = pickingArg.view.pickObjectsAt(event, 5, pickingArg.layer);
    if (intersects.length === 0) {
        return;
    }

    // Get information from intersected objects (from the batch table and
    // eventually the 3D Tiles extensions
    var featureDisplayableInfo =
        pickingArg.layer.getInfoFromIntersectObject(intersects);
    if (featureDisplayableInfo) {
        // eslint-disable-next-line
        pickingArg.htmlDiv.appendChild(
            createHTMLListFromObject(featureDisplayableInfo)
        );
        featureDisplayableInfo.tile = getTileFromObjectIntersected(
            intersects[0].object
        );
        return featureDisplayableInfo;
    }
}

/**
 * It takes an object and returns the tile that contains it
 * @param object - The intersected object.
 * @returns The tile.
 */
function getTileFromObjectIntersected(object) {
    if (!object) {
        throw "Tile not loaded in view";
    }

    //Find the 'Object3D' part of the tile
    while (!!object.parent && !(object.type === "Object3D")) {
        object = object.parent;
    }

    if (!object.batchTable) {
        throw "Invalid tile : no batch table";
    }

    return object;
}

/**
 * Return the first intersected object that is visible and has a visible tile and a visible tile
 * content.
 * @param intersects - the array of intersections returned by the raycaster
 * @returns The first intersection that is visible.
 */
function getFirstIntersection(intersects) {
    for (let inter of intersects) {
        let tile = getTileFromObjectIntersected(inter.object);
        if (inter.object.visible && tile.visible && tile.content.visible) {
            return inter;
        }
    }
    return null;
}

export { getTileFromObjectIntersected, getFirstIntersection };
