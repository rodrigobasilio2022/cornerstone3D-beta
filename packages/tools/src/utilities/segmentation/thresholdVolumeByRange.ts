import type { Types } from '@cornerstonejs/core';

import { pointInShapeCallback } from '../../utilities';
import { triggerSegmentationDataModified } from '../../stateManagement/segmentation/triggerSegmentationEvents';
import { BoundsIJK } from '../../types';

export type ThresholdRangeOptions = {
  overwrite: boolean;
  boundsIJK: BoundsIJK;
};

export type ThresholdInformation = {
  volume: Types.IImageVolume;
  lower: number;
  upper: number;
};

/**
 * It thresholds a segmentation volume based on a set of threshold values with
 * respect to reference volumes.
 * @param segmentationVolume - the segmentation volume to be modified
 * @param referenceVolumes - the reference volumes to be used for thresholding
 * @param options - the options for thresholding
 * @returns segmented volume
 */
function thresholdVolumeByRange(
  segmentationVolume: Types.IImageVolume,
  thresholdVolumeInformation: ThresholdInformation[],
  options: ThresholdRangeOptions
): Types.IImageVolume {
  const { scalarData, imageData: segmentationImageData } = segmentationVolume;

  const { overwrite, boundsIJK } = options;

  // set the segmentation to all zeros
  if (overwrite) {
    for (let i = 0; i < scalarData.length; i++) {
      scalarData[i] = 0;
    }
  }

  const volumeInfoList = [];
  for (let i = 0; i < thresholdVolumeInformation.length; i++) {
    const { imageData } = thresholdVolumeInformation[i].volume;
    const referenceValues = imageData.getPointData().getScalars().getData();
    const lower = thresholdVolumeInformation[i].lower;
    const upper = thresholdVolumeInformation[i].upper;
    volumeInfoList.push({
      imageData,
      referenceValues,
      lower,
      upper,
    });
  }

  const callback = ({ index, pointLPS }) => {
    let insert = volumeInfoList.length > 0;
    for (let i = 0; i < volumeInfoList.length; i++) {
      const { imageData, referenceValues, lower, upper } = volumeInfoList[i];
      const pointIJK = imageData.worldToIndex(pointLPS);
      const offset = imageData.computeOffsetIndex(pointIJK);

      const value = referenceValues[offset];
      if (value <= lower || value >= upper) insert = false;
      if (!insert) {
        break;
      }
    }

    // Todo: make the segmentIndex a parameter
    if (insert) scalarData[index] = 1;
  };

  pointInShapeCallback(segmentationImageData, () => true, callback, boundsIJK);

  triggerSegmentationDataModified(segmentationVolume.volumeId);

  return segmentationVolume;
}

export default thresholdVolumeByRange;
