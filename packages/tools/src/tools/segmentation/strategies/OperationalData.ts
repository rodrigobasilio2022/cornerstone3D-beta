import type { Types } from '@cornerstonejs/core';

type EditDataStack = {
  type: 'stack';
  imageIds: Array<string>;
  segmentationImageIds: Array<string>;
  currentImageId: string;
  currentSegmentationImageId: string;
  zSpacing: number;
  origin: number[];
};

type EditDataVolume = {
  type: 'volume';
  segmentation: Types.IImageVolume;
  imageVolume: Types.IImageVolume; //
};

type EditData = EditDataStack | EditDataVolume;

type OperationData = {
  segmentationId: string;
  editData: EditData;
  points: any; // Todo:fix
  segmentIndex: number;
  segmentsLocked: number[];
  viewPlaneNormal: number[];
  viewUp: number[];
  strategySpecificConfiguration: any;
  constraintFn: () => boolean;
};

export { OperationData, EditData, EditDataStack, EditDataVolume };
