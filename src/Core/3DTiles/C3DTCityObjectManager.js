import * as THREE from 'three';
import C3DTCityObject from 'Core/3DTiles/C3DTCityObject';

/* It takes a tile, finds all the city objects in it, and then adds a group to the geometry for each
city object */
class C3DTCityObjectManager {
    constructor() {
        this.cityObjects = [];
    }

    /**
     * For each mesh in the tile, for each vertex in the mesh, if the vertex has a batch ID, add the vertex
     * to the corresponding city object
     * @param {Object3D} tile - The tile that is being processed
     */
    fillCityObjects(tile) {
        const meshes = tile.content.children;
        let k = 0;

        for (const [index, mesh] of meshes.entries()) {
            mesh.geometry = mesh.geometry.toNonIndexed();
            const attributes = mesh.geometry.attributes;
            const totalVertices = attributes.position.count;

            const newbatchIds = [];
            if (attributes._BATCHID !== undefined) {
                // For each vertex get the corresponding batch ID
                for (
                    let vertexIndex = 0;
                    vertexIndex < totalVertices;
                    vertexIndex += 1
                ) {
                    const batchId = attributes._BATCHID.array[vertexIndex];

                    // Creates a dict entry for the batch ID
                    if (this.cityObjects[batchId] === undefined) {
                        this.cityObjects[batchId] = new C3DTCityObject(
                            tile,
                            batchId,
                            vertexIndex,
                            0,
                            null,
                            null,
                            index,
                        );
                        for (const key of Object.keys(
                            tile.batchTable.content,
                        )) {
                            this.cityObjects[batchId].props[key] =
                                tile.batchTable.content[key][batchId];
                        }

                        newbatchIds.push(batchId);
                    }

                    // If this is the last vertex corresponding to this batch ID
                    if (
                        vertexIndex + 1 === totalVertices ||
                        attributes._BATCHID.array[vertexIndex + 1] !== batchId
                    ) {
                        this.cityObjects[batchId].indexCount =
                            vertexIndex -
                            this.cityObjects[batchId].indexStart +
                            1;
                    }
                }
            } else {
                const batchId = k++;
                const batchIdArray = new Float32Array(totalVertices).fill(
                    batchId,
                );
                const batchIdBuffer = new THREE.BufferAttribute(
                    batchIdArray,
                    1,
                );
                this.cityObjects[batchId] = new C3DTCityObject(
                    tile,
                    batchId,
                    0,
                    totalVertices,
                    null,
                    null,
                    index,
                );
                mesh.geometry.setAttribute('_BATCHID', batchIdBuffer);
                newbatchIds.push(batchId);
            }

            // For each newly added tile part, compute the centroid
            for (const id of newbatchIds) {
                const vertexSum = new THREE.Vector3(0, 0, 0);
                const positionArray = mesh.geometry.attributes.position.array;
                for (
                    let i = this.cityObjects[id].indexStart;
                    i <= this.cityObjects[id].indexEnd;
                    ++i
                ) {
                    vertexSum.x += positionArray[i * 3];
                    vertexSum.y += positionArray[i * 3 + 1];
                    vertexSum.z += positionArray[i * 3 + 2];
                }
                const vertexCount = this.cityObjects[id].indexCount;
                this.cityObjects[id].centroid = vertexSum
                    .divideScalar(vertexCount)
                    .applyMatrix4(mesh.matrixWorld);
            }
        }
    }

    /**
     * It takes a tile, finds all the city objects in it, and then adds a group to the geometry for each
     * city object
     * @param {Object3D} tile - The tile that is being processed.
     */
    createGeometryGroupsOfCityObjectsMeshes(tile) {
        this.fillCityObjects(tile);
        const mesh = tile.content.children[0];

        mesh.geometry.groups = [];
        const defaultMaterial = Array.isArray(mesh.material)
            ? mesh.material[0]
            : mesh.material;

        // Reset the materials
        mesh.material = [
            defaultMaterial,
            new THREE.MeshStandardMaterial({ color: 'blue' }),
        ];

        this.cityObjects.forEach((co) => {
            const mesh = co.tile.content.children[co.meshId];

            mesh.geometry.addGroup(co.indexStart, co.indexCount, 0);
        });
    }
}

export default C3DTCityObjectManager;
