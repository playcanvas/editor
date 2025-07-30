class Unwrap {
    now = (!performance.now || !performance.timing) ? Date.now : () => performance.now();

    progress = null;

    cancel = false;

    swap(arr, dest, src) {
        const tmp = arr[dest];
        arr[dest] = arr[src];
        arr[src] = tmp;
    }

    crossNormalize(p, q) {
        let crossX = p.y * q.z - p.z * q.y;
        let crossY = p.z * q.x - p.x * q.z;
        let crossZ = p.x * q.y - p.y * q.x;

        const len = Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ);
        crossX /= len;
        crossY /= len;
        crossZ /= len;

        return { x: crossX, y: crossY, z: crossZ };
    }

    triNormal(ax, ay, az, bx, by, bz, cx, cy, cz) {
        const px = ax - bx;
        const py = ay - by;
        const pz = az - bz;

        const qx = bx - cx;
        const qy = by - cy;
        const qz = bz - cz;

        let crossX = py * qz - pz * qy;
        let crossY = pz * qx - px * qz;
        let crossZ = px * qy - py * qx;

        const len = Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ);
        crossX /= len;
        crossY /= len;
        crossZ /= len;

        return { x: crossX, y: crossY, z: crossZ };
    }

    cubeFaceFromNormal(n) {
        const ax = Math.abs(n.x);
        const ay = Math.abs(n.y);
        const az = Math.abs(n.z);
        if (ax >= ay && ax >= az) {
            return n.x < 0 ? 0 : 1;
        } else if (ay >= ax && ay >= az) {
            return n.y < 0 ? 2 : 3;
        }
        return n.z < 0 ? 4 : 5;

    }

    // (in/out) ib: index buffer
    // (in/out) positions: float3 vertex positions
    // return value: {append: indices of vertices, whose attributes to copy at the end, uv: generated overlapping UVs}
    boxUnwrap(ib, positions) {
        let vertCount = positions.length / 3;
        let p0x, p0y, p0z;
        let p1x, p1y, p1z;
        let p2x, p2y, p2z;
        let triNormalI;
        let numVertsAdded = 0;
        let i;
        let cubeFace = 0;
        const ibCube = [];
        const ibFaceStart = [];

        for (i = 0; i < 6; i++) {
            ibCube[i] = [];
        }

        // split triangles into 6 groups
        for (i = 0; i < ib.length; i += 3) {
            p0x = positions[ib[i] * 3];
            p0y = positions[ib[i] * 3 + 1];
            p0z = positions[ib[i] * 3 + 2];

            p1x = positions[ib[i + 1] * 3];
            p1y = positions[ib[i + 1] * 3 + 1];
            p1z = positions[ib[i + 1] * 3 + 2];

            p2x = positions[ib[i + 2] * 3];
            p2y = positions[ib[i + 2] * 3 + 1];
            p2z = positions[ib[i + 2] * 3 + 2];

            triNormalI = this.triNormal(p0x, p0y, p0z, p1x, p1y, p1z, p2x, p2y, p2z);
            cubeFace = this.cubeFaceFromNormal(triNormalI);

            ibCube[cubeFace].push(ib[i]);
            ibCube[cubeFace].push(ib[i + 1]);
            ibCube[cubeFace].push(ib[i + 2]);
        }

        ibFaceStart[0] = 0;
        for (i = 1; i < 6; i++) {
            ibFaceStart[i] = ibFaceStart[i - 1] + ibCube[i - 1].length;
        }

        // make vertices of each group unique
        let face, face2;
        let remapVertList = [];
        const addVerts = [];
        // var addVertsNew = [];
        for (face = 0; face < 6; face++) {
            for (face2 = face + 1; face2 < 6; face2++) {

                for (i = 0; i < ibCube[face].length; i++) {
                    remapVertList = [];
                    for (let j = 0; j < ibCube[face2].length; j++) {
                        if (ibCube[face][i] === ibCube[face2][j]) { // 2 verts in different faces are same - have to split
                            remapVertList.push(j);
                        }
                    }
                    if (remapVertList.length > 0) {
                        for (let j = 0; j < remapVertList.length; j++) {
                            ibCube[face2][remapVertList[j]] = vertCount;
                        }
                        addVerts.push(ibCube[face][i]);
                        // addVertsNew.push( ibFaceStart[face] + i );
                        vertCount++;
                        numVertsAdded++;
                    }
                }
            }
        }

        // add new vertices
        for (i = 0; i < numVertsAdded; i++) {
            const vert = addVerts[i];
            positions.push(positions[vert * 3]);
            positions.push(positions[vert * 3 + 1]);
            positions.push(positions[vert * 3 + 2]);
        }

        // patch IB and generate UVs
        const UV = [];
        const cubeNormal = [
            { x: -1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
            { x: 0, y: -1, z: 0 }, { x: 0, y: 1, z: 0 },
            { x: 0, y: 0, z: -1 }, { x: 0, y: 0, z: 1 }
        ];
        let normal, tangent, binormal;
        let offset = 0;
        for (face = 0; face < 6; face++) {
            normal = cubeNormal[face];
            tangent = this.crossNormalize(normal, Math.abs(normal.y) > 0.5 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 });
            binormal = this.crossNormalize(normal, tangent);
            tangent = this.crossNormalize(normal, binormal);

            for (i = 0; i < ibCube[face].length; i++) {
                ib[offset] = ibCube[face][i];

                p0x = positions[ib[offset] * 3];
                p0y = positions[ib[offset] * 3 + 1];
                p0z = positions[ib[offset] * 3 + 2];
                UV[ib[offset] * 2] = tangent.x * p0x + tangent.y * p0y + tangent.z * p0z;
                UV[ib[offset] * 2 + 1] = binormal.x * p0x + binormal.y * p0y + binormal.z * p0z;

                offset++;
            }
        }

        return { append: addVerts, uv: UV };
    }


    // (in/out) ib: index buffer
    // return value: array of triangle counts in each consequent chart
    findCharts(ib) {

        let i, j, v0i, v0j;
        const charts = [];
        let ptr = 0;
        let chartFinish;

        // Actual chart search
        for (i = 0; i < ib.length; i++) {
            v0i = Math.floor(i / 3) * 3;
            ptr = Math.max(v0i, ptr);
            if (i % 3 === 0) {
                chartFinish = 3;
            }

            for (j = ptr; j < ib.length; j++) {
                if (ib[i] === ib[j]) { // same index in different triangle
                    v0j = Math.floor(j / 3) * 3;

                    // pack connected triangles together
                    this.swap(ib, ptr, v0j);
                    this.swap(ib, ptr + 1, v0j + 1);
                    this.swap(ib, ptr + 2, v0j + 2);

                    j = v0j + 2;
                    ptr += 3;
                    chartFinish--;
                }
            }

            if (i % 3 === 2 && chartFinish < 3) {
                if (charts.length > 0 && charts[charts.length - 1] > v0i) {
                    charts[charts.length - 1] = ptr;
                } else {
                    charts.push(ptr);
                }
            }
        }

        let prev = 0;
        for (i = 0; i < charts.length; i++) {
            charts[i] = (charts[i] - prev * 3) / 3;
            prev += charts[i];
        }

        return charts;
    }


    triangleArea(Ax, Ay, Az, Bx, By, Bz, Cx, Cy, Cz) {
        Bx -= Ax;
        By -= Ay;
        Bz -= Az;

        Cx -= Ax;
        Cy -= Ay;
        Cz -= Az;

        const cx = By * Cz - Bz * Cy;
        const cy = Bz * Cx - Bx * Cz;
        const cz = Bx * Cy - By * Cx;

        return 0.5 * Math.sqrt(cx * cx + cy * cy + cz * cz);
    }


    // (in) ib: index buffer
    // (in) charts: result of findCharts
    // (in) positions: float3 vertex positions
    // (in) uv: float2 vertex uvs
    // return value: {areas: array of chart world-space areas, areasT: array of chart UV-space areas, totalArea: total world-space area, aabbs: AABBs of charts}
    calculateChartArea(ib, charts, positions, uv) {
        let i, j, chartTris, tri, v0, v1, v2;
        let p0x, p0y, p0z;
        let p1x, p1y, p1z;
        let p2x, p2y, p2z;

        let t0x, t0y;
        let t1x, t1y;
        let t2x, t2y;

        let offset = 0;
        let area, areaT;
        const areas = [];
        const areasT = [];
        let totalArea = 0;
        let totalAreaT = 0;

        let minx, miny, maxx, maxy;
        const aabbs = [];

        for (i = 0; i < charts.length; i++) {
            chartTris = charts[i];
            area = 0;
            areaT = 0;
            minx = miny = 99999;
            maxx = maxy = -99999;
            for (j = 0; j < chartTris; j++) {
                tri = offset + j;
                v0 = ib[tri * 3];
                v1 = ib[tri * 3 + 1];
                v2 = ib[tri * 3 + 2];

                p0x = positions[v0 * 3];
                p0y = positions[v0 * 3 + 1];
                p0z = positions[v0 * 3 + 2];

                p1x = positions[v1 * 3];
                p1y = positions[v1 * 3 + 1];
                p1z = positions[v1 * 3 + 2];

                p2x = positions[v2 * 3];
                p2y = positions[v2 * 3 + 1];
                p2z = positions[v2 * 3 + 2];

                area += this.triangleArea(p0x, p0y, p0z, p1x, p1y, p1z, p2x, p2y, p2z);

                t0x = uv[v0 * 2];
                t0y = uv[v0 * 2 + 1];

                t1x = uv[v1 * 2];
                t1y = uv[v1 * 2 + 1];

                t2x = uv[v2 * 2];
                t2y = uv[v2 * 2 + 1];

                areaT += this.triangleArea(t0x, t0y, 0, t1x, t1y, 0, t2x, t2y, 0);

                minx = Math.min(minx, t0x);
                minx = Math.min(minx, t1x);
                minx = Math.min(minx, t2x);

                miny = Math.min(miny, t0y);
                miny = Math.min(miny, t1y);
                miny = Math.min(miny, t2y);

                maxx = Math.max(maxx, t0x);
                maxx = Math.max(maxx, t1x);
                maxx = Math.max(maxx, t2x);

                maxy = Math.max(maxy, t0y);
                maxy = Math.max(maxy, t1y);
                maxy = Math.max(maxy, t2y);
            }

            if (area === 0) {
                area = 0.01;
                areaT = 0.01;
                maxx = minx + 0.01;
                maxy = miny + 0.01;
            }

            if (isNaN(area)) {
                area = 0.01;
                areaT = 0.01;
                maxx = minx + 0.01;
                maxy = miny + 0.01;
            }

            if (areaT === 0) {
                areaT = 0.01;
                maxx = minx + 0.01;
                maxy = miny + 0.01;
            }

            totalArea += area;
            areas.push(area);
            offset += chartTris;

            aabbs[i] = { x: 0, y: 0, z: 0, w: 0 };
            aabbs[i].x = minx;
            aabbs[i].y = miny;
            aabbs[i].z = maxx - aabbs[i].x;
            aabbs[i].w = maxy - aabbs[i].y;

            // areaT = aabbs[i].z * aabbs[i].w;
            // areaT = Math.max(aabbs[i].z, aabbs[i].w);
            // areaT *= areaT;

            totalAreaT += areaT;
            areasT.push(areaT);
        }
        return { areas: areas, areasT: areasT, totalArea: totalArea, totalAreaT: totalAreaT, aabbs: aabbs };
    }


    normalizeCharts(ib, charts, areasObj, uv, aabbs, mult) {
        let i, scale;

        const areas = areasObj.areas;
        const areasT = areasObj.areasT;
        const totalArea = areasObj.totalArea;
        const scales = [];
        aabbs = areasObj.aabbs;

        for (i = 0; i < charts.length; i++) {
            const scaleNormalize = 1.0 / areasT[i];
            const scaleByArea = areas[i] / totalArea;
            scale = Math.sqrt(scaleNormalize * scaleByArea) * 0.8; // magic constant


            // var scaleNormalize2 = 1.0 / (aabbs[i].z * aabbs[i].w);
            // var scale2 = Math.sqrt(scaleNormalize2 * scaleByArea) * 0.8;
            // scale = Math.min(scale, scale2);
            //
            // if (scale > 100000) {
            //     scale = 0.1;
            // }

            scales.push(scale);
        }
        return scales;
    }


    fits(what, where) {
        return (what.z <= where.z && what.w <= where.w);
    }

    fitsExactly(what, where) {
        return (what.z === where.z && what.w === where.w);
    }

    findHoles(node, id, aabb, uv, charts, ib, aabbs, scale) {
        let i;
        const tilePixelSize = 4;
        const gridPixelWidth = Math.floor((node.aabb.z * this.resolution - this.padding * 2) / tilePixelSize);
        const gridPixelHeight = Math.floor((node.aabb.w * this.resolution - this.padding * 2) / tilePixelSize);
        if (gridPixelWidth <= 0 || gridPixelHeight <= 0) {
            return [];
        }
        if (gridPixelWidth > 1000 || gridPixelHeight > 1000) {
            return [];
        }


        const grid = new Uint8Array(gridPixelWidth * gridPixelHeight);

        let offset = 0;
        for (i = 0; i < charts.length; i++) {
            if (i === id) {
                break;
            }
            offset += charts[i];
        }

        const numTris = charts[id];
        let a, b, c;
        const gridXstart = aabbs[id].x * scale;
        const gridYstart = aabbs[id].y * scale;
        const gridWidth = aabbs[id].z * scale;
        const gridHeight = aabbs[id].w * scale;
        let x, y;
        let minx, miny, maxx, maxy;

        for (i = 0; i < numTris; i++) {

            a = ib[(offset + i) * 3];
            b = ib[(offset + i) * 3 + 1];
            c = ib[(offset + i) * 3 + 2];
            let aU = uv[a * 2] * scale;
            let aV = uv[a * 2 + 1] * scale;
            let bU = uv[b * 2] * scale;
            let bV = uv[b * 2 + 1] * scale;
            let cU = uv[c * 2] * scale;
            let cV = uv[c * 2 + 1] * scale;
            aU = (aU - gridXstart) / gridWidth;
            bU = (bU - gridXstart) / gridWidth;
            cU = (cU - gridXstart) / gridWidth;
            aV = (aV - gridYstart) / gridHeight;
            bV = (bV - gridYstart) / gridHeight;
            cV = (cV - gridYstart) / gridHeight;
            minx = 99999;
            miny = 99999;
            maxx = -99999;
            maxy = -99999;

            minx = Math.min(minx, aU);
            minx = Math.min(minx, bU);
            minx = Math.min(minx, cU);
            miny = Math.min(miny, aV);
            miny = Math.min(miny, bV);
            miny = Math.min(miny, cV);
            maxx = Math.max(maxx, aU);
            maxx = Math.max(maxx, bU);
            maxx = Math.max(maxx, cU);
            maxy = Math.max(maxy, aV);
            maxy = Math.max(maxy, bV);
            maxy = Math.max(maxy, cV);

            minx *= gridPixelWidth;
            maxx *= gridPixelWidth;
            miny *= gridPixelHeight;
            maxy *= gridPixelHeight;
            minx = Math.floor(minx) - this.padding;
            miny = Math.floor(miny) - this.padding;
            maxx = Math.floor(maxx) + this.padding;
            maxy = Math.floor(maxy) + this.padding;

            if (minx < 0) {
                minx = 0;
            }
            if (minx >= gridPixelWidth) {
                minx = gridPixelWidth - 1;
            }
            if (miny < 0) {
                miny = 0;
            }
            if (miny >= gridPixelHeight) {
                miny = gridPixelHeight - 1;
            }

            if (maxx < 0) {
                maxx = 0;
            }
            if (maxx >= gridPixelWidth) {
                maxx = gridPixelWidth - 1;
            }
            if (maxy < 0) {
                maxy = 0;
            }
            if (maxy >= gridPixelHeight) {
                maxy = gridPixelHeight - 1;
            }


            for (y = miny; y <= maxy; y++) {
                for (x = minx; x <= maxx; x++) {
                    grid[y * gridPixelWidth + x] = 255;
                }
            }
        }

        let maxAxis = Math.max(gridPixelWidth, gridPixelHeight);
        const mips = [grid];
        let mipW = gridPixelWidth;
        let mipH = gridPixelHeight;
        const mipWidths = [mipW];
        const mipHeights = [mipH];
        let mipID = 0;
        let subX, subY;
        let mip, w, h;
        while (maxAxis > 8) {
            w = Math.floor(mipW / 2);
            h = Math.floor(mipH / 2);
            mip = new Uint8Array(w * h);
            for (y = 0; y < h; y++) {
                for (x = 0; x < w; x++) {
                    c = 0;
                    for (subY = 0; subY < 2; subY++) {
                        for (subX = 0; subX < 2; subX++) {
                            c = Math.max(c, mips[mipID][(y * 2 + subY) * mipW + (x * 2 + subX)]);
                        }
                    }
                    mip[y * w + x] = c;
                }
            }
            maxAxis = Math.max(w, h);
            mipW = w;
            mipH = h;
            mipID++;
            mips[mipID] = mip;
            mipWidths[mipID] = w;
            mipHeights[mipID] = h;
        }

        const rects = [];
        let j;
        for (i = mips.length - 1; i >= 0; i--) {
            w = mipWidths[i];
            h = mipHeights[i];
            mip = mips[i];
            const wMult = gridPixelWidth / w;
            const hMult = gridPixelHeight / h;
            for (y = 0; y < h; y++) {
                for (x = 0; x < w; x++) {
                    if (mip[y * w + x] === 0) {
                        // hole - expand on hires
                        const hiX = Math.floor(x * wMult);
                        const hiY = Math.floor(y * hMult);
                        minx = hiX;
                        maxx = hiX;
                        miny = hiY;
                        maxy = hiY;
                        let prevMinX = minx;
                        let prevMinY = miny;
                        let prevMaxX = maxx;
                        let prevMaxY = maxy;

                        let freeRect = true;
                        let growMode = 0;
                        let earlyExit = true;
                        while (freeRect) {

                            if (minx < 0 || miny < 0 || maxx > gridPixelWidth - 1 || maxy > gridPixelHeight - 1) {
                                freeRect = false; // can't expand out of bounds
                            } else {
                                for (subY = miny; subY <= maxy; subY++) {
                                    for (subX = minx; subX <= maxx; subX++) {
                                        if (grid[subY * gridPixelWidth + subX] > 0) {
                                            freeRect = false; // can't expand over obstacle
                                            break;
                                        }
                                    }
                                    if (!freeRect) {
                                        break;
                                    }
                                }
                            }

                            if (freeRect) {
                                for (j = 0; j < rects.length; j++) {
                                    const overlap = !(rects[j].maxx < minx || rects[j].minx > maxx || rects[j].maxy < miny || rects[j].miny > maxy);
                                    if (overlap) {
                                        freeRect = false; // can't expand over other rects
                                        break;
                                    }
                                }
                            }

                            if (!freeRect) {
                                if (earlyExit) {
                                    break;
                                }
                                minx = prevMinX;
                                miny = prevMinY;
                                maxx = prevMaxX;
                                maxy = prevMaxY;
                                growMode++;
                                if (growMode < 6) {
                                    freeRect = true;
                                } else {
                                    break;
                                }
                            }
                            earlyExit = false;

                            prevMinX = minx;
                            prevMinY = miny;
                            prevMaxX = maxx;
                            prevMaxY = maxy;
                            if (growMode === 0) {
                                miny--;
                                minx--;
                            } else if (growMode === 1) {
                                maxy++;
                                maxx++;
                            } else if (growMode === 2) {
                                minx--;
                            } else if (growMode === 3) {
                                miny--;
                            } else if (growMode === 4) {
                                maxx++;
                            } else if (growMode === 5) {
                                maxy++;
                            }
                        }
                        if (!earlyExit) {
                            rects.push({ minx: minx, miny: miny, maxx: maxx, maxy: maxy });
                        }
                    }
                }
            }
        }

        for (i = 0; i < rects.length; i++) {
            const r = { x: 0, y: 0, z: 0, w: 0 };
            r.x = (rects[i].minx / gridPixelWidth) * node.aabb.z + node.aabb.x;
            r.y = (rects[i].miny / gridPixelHeight) * node.aabb.w + node.aabb.y;
            r.z = ((rects[i].maxx - rects[i].minx) / gridPixelWidth) * node.aabb.z;
            r.w = ((rects[i].maxy - rects[i].miny) / gridPixelHeight) * node.aabb.w;
            rects[i] = { aabb: r, id: -1, child: [], leaf: true, insideHole: true };
        }

        return rects;
    }

    insertToAtlas(node, id, aabb, uv, charts, ib, aabbs, scale) {
        if (node.leaf) {
            if (node.id >= 0) {
                return null;
            }
            if (!this.fits(aabb, node.aabb)) {
                return null;
            }
            if (this.fitsExactly(aabb, node.aabb)) {
                node.id = id;

                if (this.fillHoles) {
                    const rects = this.findHoles(node, id, aabb, uv, charts, ib, aabbs, scale);
                    if (rects.length > 0) {
                        node.leaf = false;
                        node.child = rects;
                    }
                }

                return node;
            }
            const r0 = { x: 0, y: 0, z: 0, w: 0 };
            const r1 = { x: 0, y: 0, z: 0, w: 0 };
            const dw = node.aabb.z - aabb.z;
            const dh = node.aabb.w - aabb.w;
            if (dw > dh) {
                r0.x = node.aabb.x;
                r0.y = node.aabb.y;
                r0.z = aabb.z;
                r0.w = node.aabb.w;

                r1.x = node.aabb.x + aabb.z;
                r1.y = node.aabb.y;
                r1.z = node.aabb.z - aabb.z;
                r1.w = node.aabb.w;
            } else {
                r0.x = node.aabb.x;
                r0.y = node.aabb.y;
                r0.z = node.aabb.z;
                r0.w = aabb.w;

                r1.x = node.aabb.x;
                r1.y = node.aabb.y + aabb.w;
                r1.z = node.aabb.z;
                r1.w = node.aabb.w - aabb.w;
            }
            node.leaf = false;
            node.child = [];
            node.child[0] = { aabb: r0, id: -1, child: [], leaf: true, test: false };
            node.child[1] = { aabb: r1, id: -1, child: [], leaf: true, test: false };
            return this.insertToAtlas(node.child[0], id, aabb, uv, charts, ib, aabbs, scale);
        }
        for (let i = 0; i < node.child.length; i++) {
            const result = this.insertToAtlas(node.child[i], id, aabb, uv, charts, ib, aabbs, scale);
            if (result) {
                return result;
            }
        }
        return null;

    }

    transformUv(uv, tform) {
        uv.x = uv.x * tform.x + tform.z;
        uv.y = uv.y * tform.y + tform.w;
    }


    packCharts(ib, charts, aabbs, areasObj, uv, scales, globalScale) {
        let i;
        const root = { aabb: { x: 0, y: 0, z: 1, w: 1 }, id: -1, child: [], leaf: true, test: false };
        const packedAabbs = [];

        const sortedChartIndices = [];
        for (i = 0; i < charts.length; i++) {
            sortedChartIndices[i] = i;
        }
        sortedChartIndices.sort((a, b) => { // sort from larger to smaller
            const sizeA = Math.max(aabbs[a].z * scales[a], aabbs[a].w * scales[a]);
            const sizeB = Math.max(aabbs[b].z * scales[b], aabbs[b].w * scales[b]);
            return sizeB - sizeA;
        });

        let unfittableArea = 0;
        let usedArea = 0;
        let maxWidth = 0;
        let maxHeight = 0;
        let minWidth = 99999;
        let scaledAabb;
        for (let chart = 0; chart < aabbs.length; chart++) {
            i = sortedChartIndices[chart];

            scaledAabb = { x: aabbs[i].x, y: aabbs[i].y, z: aabbs[i].z, w: aabbs[i].w };
            scaledAabb.x *= scales[i] * globalScale;
            scaledAabb.y *= scales[i] * globalScale;
            scaledAabb.z *= scales[i] * globalScale;
            scaledAabb.w *= scales[i] * globalScale;
            scaledAabb.z += this.paddingUv * 2;
            scaledAabb.w += this.paddingUv * 2;

            const node = this.insertToAtlas(root, i, scaledAabb, uv, charts, ib, aabbs, scales[i] * globalScale);
            if (node) {
                packedAabbs[i] = node.aabb;
                if (!node.insideHole) {
                    usedArea += packedAabbs[i].z * packedAabbs[i].w;
                }
            } else {
                unfittableArea += scaledAabb.z * scaledAabb.w;
                // if (unfittableArea > 100) {
                // return false;
                // }
            }
            maxWidth = Math.max(maxWidth, scaledAabb.z);
            maxHeight = Math.max(maxHeight, scaledAabb.w);
            minWidth = Math.min(minWidth, scaledAabb.z);
        }
        areasObj.usedArea = usedArea;
        areasObj.maxWidth = maxWidth;
        areasObj.maxHeight = maxHeight;
        areasObj.minWidth = minWidth;

        if (unfittableArea > 0) {
            areasObj.notFitted = unfittableArea;
            return { scaleOffset: [], packedAabbs: [], fit: false };
        }

        for (i = 0; i < packedAabbs.length; i++) {
            if (packedAabbs[i].z > this.paddingUv * 2 && packedAabbs[i].w > this.paddingUv * 2) {
                packedAabbs[i].x += this.paddingUv;
                packedAabbs[i].y += this.paddingUv;
                packedAabbs[i].z -= this.paddingUv * 2;
                packedAabbs[i].w -= this.paddingUv * 2;
            }
        }

        const scaleOffset = [];
        for (i = 0; i < aabbs.length; i++) {

            scaledAabb = { x: aabbs[i].x, y: aabbs[i].y, z: aabbs[i].z, w: aabbs[i].w };
            scaledAabb.x *= scales[i] * globalScale;
            scaledAabb.y *= scales[i] * globalScale;
            scaledAabb.z *= scales[i] * globalScale;
            scaledAabb.w *= scales[i] * globalScale;

            const scaleX = packedAabbs[i].z / scaledAabb.z;
            const scaleY = packedAabbs[i].w / scaledAabb.w;
            const offsetX = packedAabbs[i].x - scaledAabb.x * scaleX;
            const offsetY = packedAabbs[i].y - scaledAabb.y * scaleY;
            scaleOffset.push({ x: scaleX, y: scaleY, z: offsetX, w: offsetY });
        }

        return { scaleOffset: scaleOffset, packedAabbs: packedAabbs, fit: true };
    }

    transformUv2(p, scale, scale2, scaleOffset) {
        p.x *= scale * scale2;
        p.y *= scale * scale2;
        return this.transformUv(p, scaleOffset);
    }

    finalTransformUv(ib, charts, uv, scales, globalScale, packedScaleOffset) {
        let i, j, tri, v0, v1, v2;
        const p0 = { x: 0, y: 0 };
        const p1 = { x: 0, y: 0 };
        const p2 = { x: 0, y: 0 };
        let offset = 0;
        const scaled = [];
        for (i = 0; i < charts.length; i++) {
            const chartTris = charts[i];
            for (j = 0; j < chartTris; j++) {
                tri = offset + j;
                v0 = ib[tri * 3];
                v1 = ib[tri * 3 + 1];
                v2 = ib[tri * 3 + 2];

                p0.x = uv[v0 * 2];
                p0.y = uv[v0 * 2 + 1];

                p1.x = uv[v1 * 2];
                p1.y = uv[v1 * 2 + 1];

                p2.x = uv[v2 * 2];
                p2.y = uv[v2 * 2 + 1];

                if (!scaled[v0]) {
                    this.transformUv2(p0, scales[i], globalScale, packedScaleOffset[i]);
                }
                if (!scaled[v1]) {
                    this.transformUv2(p1, scales[i], globalScale, packedScaleOffset[i]);
                }
                if (!scaled[v2]) {
                    this.transformUv2(p2, scales[i], globalScale, packedScaleOffset[i]);
                }

                uv[v0 * 2] = p0.x;
                uv[v0 * 2 + 1] = p0.y;

                uv[v1 * 2] = p1.x;
                uv[v1 * 2 + 1] = p1.y;

                uv[v2 * 2] = p2.x;
                uv[v2 * 2 + 1] = p2.y;

                scaled[v0] = true;
                scaled[v1] = true;
                scaled[v2] = true;
            }
            offset += chartTris;
        }
    }

    totalObjectScale(model, nodeId) {
        const scale = model.nodes[nodeId].scale;
        let sx = scale[0];
        let sy = scale[1];
        let sz = scale[2];
        let parent = model.parents[nodeId];
        let parentScale;
        while (parent >= 0) {
            parentScale = model.nodes[parent].scale;
            sx *= parentScale[0];
            sy *= parentScale[1];
            sz *= parentScale[2];
            parent = model.parents[parent];
        }
        return [sx, sy, sz];
    }


    unwrapJsonModel(data, forceFromScratch, padding, fillHoles) {

        this.resolution = 1024;
        this.padding = padding;
        this.paddingUv = this.padding / this.resolution;
        this.fillHoles = fillHoles;

        let i;
        let j, k, _ib, _positions, _uv;
        const ib = [];
        const positions = [];
        const uv = [];
        const firstIndex = [];
        const vertCount = [];
        let ibOffset = 0;
        let objectScale;
        const self = this;
        let meshId, nodeId, vbId, attribs;
        const _uvs = [];
        const _scales = [];

        let globalScale;
        let packedScaleOffset;
        let packResult;
        let step = 0.025;

        const instances = [];
        const INSTANCE_NONE = -1;
        const INSTANCE_SRC = 0;
        const INSTANCE_REF = 1;
        for (i = 0; i < data.model.meshInstances.length; i++) {
            if (instances[i] !== undefined) {
                continue;
            }
            instances[i] = INSTANCE_NONE;
            for (j = i + 1; j < data.model.meshInstances.length; j++) {
                if (data.model.meshInstances[i].mesh === data.model.meshInstances[j].mesh) {
                    instances[i] = INSTANCE_SRC;
                    instances[j] = INSTANCE_REF;
                }
            }
        }

        for (i = 0; i < data.model.meshInstances.length; i++) {

            if (this.progress) {
                this.progress((i / data.model.meshInstances.length) * 30); // assume the whole loop takes about 30%
            }
            if (this.cancel) {
                return;
            }

            meshId = data.model.meshInstances[i].mesh;
            nodeId = data.model.meshInstances[i].node;
            vbId = data.model.meshes[meshId].vertices;

            _ib = data.model.meshes[meshId].indices;
            attribs = data.model.vertices[vbId];
            _positions = attribs.position.data;
            _uv = attribs.texCoord0 ? attribs.texCoord0.data : null;
            objectScale = this.totalObjectScale(data.model, nodeId);

            if (forceFromScratch) {
                _uv = null;
            }

            // have to do sanity check for existing UVs here

            let unwrappedData = { uv: _uv, append: [] };
            if (!_uv) {
                unwrappedData = self.boxUnwrap(_ib, _positions);
                _uv = unwrappedData.uv;
            }
            const append = unwrappedData.append;

            for (const attrib in attribs) {
                if (attrib === 'position') {
                    continue;
                } // already patched
                if (attribs.hasOwnProperty(attrib)) {
                    const arr = attribs[attrib].data;
                    const components = attribs[attrib].components;
                    for (k = 0; k < append.length; k++) {
                        for (j = 0; j < components; j++) {
                            arr.push(arr[append[k] * components + j]);
                        }
                    }
                }
            }

            if (!_uvs[vbId]) {
                _uvs[vbId] = _uv;
            } else {
                for (const index in _uv) {
                    _uvs[vbId][index] = _uv[index];
                }
            }
            _scales[vbId] = objectScale;
        }


        for (i = 0; i < data.model.vertices.length; i++) {

            attribs = data.model.vertices[i];
            _positions = attribs.position.data;
            _uv = _uvs[i];
            objectScale = _scales[i];

            vertCount[i] = _positions.length / 3;

            for (j = 0; j < _positions.length / 3; j++) {
                positions.push(_positions[j * 3] * objectScale[0]);
                positions.push(_positions[j * 3 + 1] * objectScale[1]);
                positions.push(_positions[j * 3 + 2] * objectScale[2]);
            }
            for (j = 0; j < _uv.length; j++) {
                uv.push(_uv[j]);
            }
            firstIndex[i] = ibOffset;
            ibOffset += _positions.length / 3;
        }


        for (i = 0; i < data.model.meshInstances.length; i++) {
            meshId = data.model.meshInstances[i].mesh;
            vbId = data.model.meshes[meshId].vertices;
            _ib = data.model.meshes[meshId].indices;
            for (j = 0; j < _ib.length; j++) {
                ib.push(_ib[j] + firstIndex[vbId]);
            }
        }


        const charts = self.findCharts(ib);
        const areasObj = self.calculateChartArea(ib, charts, positions, uv);
        const scales = self.normalizeCharts(ib, charts, areasObj, uv);
        globalScale = 1;

        if (this.cancel) {
            return;
        }
        packResult = self.packCharts(ib, charts, areasObj.aabbs, areasObj, uv, scales, globalScale);

        if (this.progress) {
            this.progress(30);
        }

        while (!packResult.fit) {
            if (this.cancel) {
                return;
            }
            globalScale /= 1 + areasObj.notFitted;
            packResult = self.packCharts(ib, charts, areasObj.aabbs, areasObj, uv, scales, globalScale);
        }
        packedScaleOffset = packResult.scaleOffset;

        if (this.progress) {
            this.progress(50);
        }

        while (true) {
            if (this.cancel) {
                return;
            }
            step = (1 - areasObj.usedArea) / 5;

            const prevScale = globalScale;
            globalScale += step;
            if (globalScale === prevScale) {
                break;
            } // float precision

            packResult = self.packCharts(ib, charts, areasObj.aabbs, areasObj, uv, scales, globalScale);
            if (!packResult.fit) {
                break;
            }
        }

        if (this.progress) {
            this.progress(90);
        }

        globalScale -= step;
        packResult = self.packCharts(ib, charts, areasObj.aabbs, areasObj, uv, scales, globalScale);
        packedScaleOffset = packResult.scaleOffset;

        self.finalTransformUv(ib, charts, uv, scales, globalScale, packedScaleOffset);


        for (i = 0; i < data.model.vertices.length; i++) {
            _uv = [];
            for (j = 0; j < vertCount[i] * 2; j++) {
                _uv.push(uv[firstIndex[i] * 2 + j]);
            }
            attribs = data.model.vertices[i];
            attribs.texCoord1 = { data: _uv, components: 2, type: 'float32' };
        }

        if (this.progress) {
            this.progress(100);
        }

        return { packedAabbs: packResult.packedAabbs, totalArea: areasObj.totalArea };
    }

    calculateAreaOfJsonModel(data) {
        let i, j, tri;
        let meshId, nodeId, vbId, ib, attribs, positions, _positions, objectScale, numTris, numVerts;
        let v0, v1, v2;
        let p0x, p0y, p0z;
        let p1x, p1y, p1z;
        let p2x, p2y, p2z;
        let totalArea = 0;
        for (i = 0; i < data.model.meshInstances.length; i++) {
            meshId = data.model.meshInstances[i].mesh;
            nodeId = data.model.meshInstances[i].node;
            vbId = data.model.meshes[meshId].vertices;

            ib = data.model.meshes[meshId].indices;
            attribs = data.model.vertices[vbId];
            positions = attribs.position.data;
            objectScale = this.totalObjectScale(data.model, nodeId);

            _positions = new Float32Array(positions.length);
            numVerts = positions.length / 3;

            for (j = 0; j < numVerts; j++) {
                _positions[j * 3] = positions[j * 3] * objectScale[0];
                _positions[j * 3 + 1] = positions[j * 3 + 1] * objectScale[1];
                _positions[j * 3 + 2] = positions[j * 3 + 2] * objectScale[2];
            }

            numTris = ib.length / 3;

            for (tri = 0; tri < numTris; tri++) {
                v0 = ib[tri * 3];
                v1 = ib[tri * 3 + 1];
                v2 = ib[tri * 3 + 2];

                p0x = _positions[v0 * 3];
                p0y = _positions[v0 * 3 + 1];
                p0z = _positions[v0 * 3 + 2];

                p1x = _positions[v1 * 3];
                p1y = _positions[v1 * 3 + 1];
                p1z = _positions[v1 * 3 + 2];

                p2x = _positions[v2 * 3];
                p2y = _positions[v2 * 3 + 1];
                p2z = _positions[v2 * 3 + 2];

                totalArea += this.triangleArea(p0x, p0y, p0z, p1x, p1y, p1z, p2x, p2y, p2z);
            }
        }
        return totalArea;
    }

    calculateUv1AreaOfJsonModel(data) {
        let i, tri;
        let meshId, vbId, ib, attribs, _positions, numTris;
        let v0, v1, v2;
        let p0x, p0y;
        let p1x, p1y;
        let p2x, p2y;
        let totalArea = 0;
        for (i = 0; i < data.model.meshInstances.length; i++) {
            meshId = data.model.meshInstances[i].mesh;
            vbId = data.model.meshes[meshId].vertices;

            ib = data.model.meshes[meshId].indices;
            attribs = data.model.vertices[vbId];
            _positions = attribs.texCoord1.data;

            numTris = ib.length / 3;

            for (tri = 0; tri < numTris; tri++) {
                v0 = ib[tri * 3];
                v1 = ib[tri * 3 + 1];
                v2 = ib[tri * 3 + 2];

                p0x = _positions[v0 * 2];
                p0y = _positions[v0 * 2 + 1];

                p1x = _positions[v1 * 2];
                p1y = _positions[v1 * 2 + 1];

                p2x = _positions[v2 * 2];
                p2y = _positions[v2 * 2 + 1];

                totalArea += this.triangleArea(p0x, p0y, 0, p1x, p1y, 0, p2x, p2y, 0);
            }
        }
        return totalArea;
    }

    calculateMultiAreaOfJsonModel(data) {
        let i, j, tri;
        let meshId, nodeId, vbId, ib, attribs, positions, _positions, objectScale, numTris, numVerts;
        let v0, v1, v2;
        let p0x, p0y, p0z;
        let p1x, p1y, p1z;
        let p2x, p2y, p2z;
        const totalArea = { x: 0, y: 0, z: 0 };
        let area;
        let normal;
        for (i = 0; i < data.model.meshInstances.length; i++) {
            meshId = data.model.meshInstances[i].mesh;
            nodeId = data.model.meshInstances[i].node;
            vbId = data.model.meshes[meshId].vertices;

            ib = data.model.meshes[meshId].indices;
            attribs = data.model.vertices[vbId];
            positions = attribs.position.data;
            objectScale = this.totalObjectScale(data.model, nodeId);

            _positions = new Float32Array(positions.length);
            numVerts = positions.length / 3;

            for (j = 0; j < numVerts; j++) {
                _positions[j * 3] = positions[j * 3] * objectScale[0];
                _positions[j * 3 + 1] = positions[j * 3 + 1] * objectScale[1];
                _positions[j * 3 + 2] = positions[j * 3 + 2] * objectScale[2];
            }

            numTris = ib.length / 3;

            for (tri = 0; tri < numTris; tri++) {
                v0 = ib[tri * 3];
                v1 = ib[tri * 3 + 1];
                v2 = ib[tri * 3 + 2];

                p0x = _positions[v0 * 3];
                p0y = _positions[v0 * 3 + 1];
                p0z = _positions[v0 * 3 + 2];

                p1x = _positions[v1 * 3];
                p1y = _positions[v1 * 3 + 1];
                p1z = _positions[v1 * 3 + 2];

                p2x = _positions[v2 * 3];
                p2y = _positions[v2 * 3 + 1];
                p2z = _positions[v2 * 3 + 2];

                normal = this.triNormal(p0x, p0y, p0z, p1x, p1y, p1z, p2x, p2y, p2z);
                area = this.triangleArea(p0x, p0y, p0z, p1x, p1y, p1z, p2x, p2y, p2z);
                if (area > 0) {
                    totalArea.x += area * Math.abs(normal.x);
                    totalArea.y += area * Math.abs(normal.y);
                    totalArea.z += area * Math.abs(normal.z);
                }
            }
        }
        return totalArea;
    }
}

export { Unwrap };
