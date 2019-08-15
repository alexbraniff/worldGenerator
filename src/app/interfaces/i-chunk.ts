import { Vector3, Mesh, Group } from 'three';
import { IVoxel } from './i-voxel';

export interface IChunk {
	coords: Vector3;
	bounds: Vector3;
	noise: number;
	voxels: Map<Vector3, IVoxel>;
	meshGroup: Group;
}
