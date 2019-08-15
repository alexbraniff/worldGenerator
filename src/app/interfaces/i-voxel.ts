import { Vector3 } from "three";
import { VoxelFace } from "../enums/voxel-face";

export interface IVoxel {
    localCoords: Vector3;
    absoluteCoords: Vector3;
    bounds: Vector3;
    noise: number;
    faceVisibility: Map<VoxelFace, boolean>;
}
