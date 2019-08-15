import { Vector3 } from 'three';
import { SortedMap } from 'collections/sorted-map';
import { IChunk } from './i-chunk';

export interface IWorld {
	chunks: SortedMap<Vector3, IChunk>;
	seed: string;
	bounds: Vector3;
}
