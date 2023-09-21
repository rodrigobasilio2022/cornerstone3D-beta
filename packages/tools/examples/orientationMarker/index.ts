import {
  metaData,
  RenderingEngine,
  Types,
  Enums,
  volumeLoader,
  setVolumesForViewports,
} from '@cornerstonejs/core';
import {
  initDemo,
  createImageIdsAndCacheMetaData,
  setCtTransferFunctionForVolumeActor,
  setTitleAndDescription,
} from '../../../../utils/demo/helpers';
import * as cornerstoneTools from '@cornerstonejs/tools';
import { sortImageIdsAndGetSpacing } from '../../../streaming-image-volume-loader/src/helpers';
import { vec3 } from 'gl-matrix';

/**
 * Calculates the plane normal given the image orientation vector
 * @param imageOrientation
 * @returns
 */
function calculatePlaneNormal(imageOrientation) {
  const rowCosineVec = vec3.fromValues(
    imageOrientation[0],
    imageOrientation[1],
    imageOrientation[2]
  );
  const colCosineVec = vec3.fromValues(
    imageOrientation[3],
    imageOrientation[4],
    imageOrientation[5]
  );
  return vec3.cross(vec3.create(), rowCosineVec, colCosineVec);
}

function sortImageIds(imageIds) {
  const { imageOrientationPatient } = metaData.get(
    'imagePlaneModule',
    imageIds[0]
  );
  const scanAxisNormal = calculatePlaneNormal(imageOrientationPatient);
  const { sortedImageIds } = sortImageIdsAndGetSpacing(
    imageIds,
    scanAxisNormal
  );
  return sortedImageIds;
}

async function getImageStacks() {
  // Get Cornerstone imageIds for the source data and fetch metadata into RAM
  const wadoRsRoot = 'https://d33do7qe4w26qo.cloudfront.net/dicomweb';
  const studyInstanceUID =
    '1.3.6.1.4.1.25403.345050719074.3824.20170125095258.1';
  const seriesInstanceUIDs = [
    '1.3.6.1.4.1.25403.345050719074.3824.20170125095258.7',
    '1.3.6.1.4.1.25403.345050719074.3824.20170125095319.5',
    '1.3.6.1.4.1.25403.345050719074.3824.20170125095312.3',
  ];
  const axialImageIds = await createImageIdsAndCacheMetaData({
    StudyInstanceUID: studyInstanceUID,
    SeriesInstanceUID: seriesInstanceUIDs[0],
    wadoRsRoot,
  });

  const sagittalImageIds = await createImageIdsAndCacheMetaData({
    StudyInstanceUID: studyInstanceUID,
    SeriesInstanceUID: seriesInstanceUIDs[1],
    wadoRsRoot,
  });

  const coronalImageIds = await createImageIdsAndCacheMetaData({
    StudyInstanceUID: studyInstanceUID,
    SeriesInstanceUID: seriesInstanceUIDs[2],
    wadoRsRoot,
  });

  const imageStacks = [
    sortImageIds(axialImageIds),
    sortImageIds(sagittalImageIds),
    sortImageIds(coronalImageIds),
  ];
  return imageStacks;
}
// This is for debugging purposes
console.warn(
  'Click on index.ts to open source code for this example --------->'
);

const {
  ToolGroupManager,
  Enums: csToolsEnums,
  OrientationMarkerTool,
  ReferenceLines,
  ZoomTool,
  PanTool,
  StackScrollMouseWheelTool,
  TrackballRotateTool,
} = cornerstoneTools;

const { MouseBindings } = csToolsEnums;
const { ViewportType } = Enums;

// Define a unique id for the volume
const volumeName = 'CT_VOLUME_ID'; // Id of the volume less loader prefix
const volumeLoaderScheme = 'cornerstoneStreamingImageVolume'; // Loader id which defines which volume loader to use
const volumeId = `${volumeLoaderScheme}:${volumeName}`; // VolumeId with loader id + volume id
const toolGroupId = 'MY_TOOLGROUP_ID';

// ======== Set up page ======== //
setTitleAndDescription(
  'OverlayGrid',
  'Here we demonstrate overlay grid tool working. The reference lines for all the images in axial series is displayed in the sagittal and coronal series.'
);

const size = '500px';
const content = document.getElementById('content');
const viewportGrid = document.createElement('div');

viewportGrid.style.display = 'flex';
viewportGrid.style.display = 'flex';
viewportGrid.style.flexDirection = 'row';

const element1 = document.createElement('div');
const element2 = document.createElement('div');
const element3 = document.createElement('div');
const elements = [element1, element2, element3];

for (let i = 0; i < elements.length; i++) {
  elements[i].style.width = size;
  elements[i].style.height = size;
  // Disable right click context menu so we can have right click tools
  elements[i].oncontextmenu = (e) => e.preventDefault();
  viewportGrid.appendChild(elements[i]);
}

content.appendChild(viewportGrid);

const instructions = document.createElement('p');
instructions.innerText = `
  `;

content.append(instructions);

// ============================= //

const viewportIds = ['CT_AXIAL', 'CT_SAGITTAL', 'CT_CORONAL'];

/**
 * Runs the demo
 */
async function run() {
  // Init Cornerstone and related libraries
  await initDemo();

  // Add tools to Cornerstone3D
  cornerstoneTools.addTool(StackScrollMouseWheelTool);
  cornerstoneTools.addTool(OrientationMarkerTool);
  cornerstoneTools.addTool(ReferenceLines);
  cornerstoneTools.addTool(PanTool);
  cornerstoneTools.addTool(ZoomTool);
  cornerstoneTools.addTool(TrackballRotateTool);

  // Instantiate a rendering engine
  const renderingEngineId = 'myRenderingEngine';
  const renderingEngine = new RenderingEngine(renderingEngineId);
  const orientations = [
    Enums.OrientationAxis.AXIAL,
    Enums.OrientationAxis.SAGITTAL,
    Enums.OrientationAxis.CORONAL,
  ];

  // this variable controls if the viewport is a VolumeViewport or StackViewport
  const useVolume = true;
  // Create the viewports
  const viewportInputArray = [];
  for (let i = 0; i < elements.length; i++) {
    viewportInputArray[i] = {
      viewportId: viewportIds[i],
      type: useVolume ? ViewportType.ORTHOGRAPHIC : ViewportType.STACK,
      element: elements[i],
      defaultOptions: {
        orientation: orientations[i],
        background: <Types.Point3>[0, 0, 0],
      },
    };
  }
  renderingEngine.setViewports(viewportInputArray);

  const imageStacks = await getImageStacks();

  // Define tool groups to add the segmentation display tool to
  const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

  let volume;
  if (useVolume) {
    // Define a volume in memory
    volume = await volumeLoader.createAndCacheVolume(volumeId, {
      imageIds: imageStacks[0],
    });
    volume.load();
  }

  const viewports = [];
  for (let i = 0; i < viewportIds.length; i++) {
    toolGroup.addViewport(viewportIds[i], renderingEngineId);
    viewports[i] = <Types.IStackViewport>(
      renderingEngine.getViewport(viewportIds[i])
    );

    if (!useVolume) {
      await viewports[i].setStack(
        imageStacks[i],
        Math.floor(imageStacks[i].length / 2)
      );
    }
  }

  if (useVolume) {
    await setVolumesForViewports(
      renderingEngine,
      [
        {
          volumeId,
          callback: setCtTransferFunctionForVolumeActor,
          blendMode: Enums.BlendModes.MAXIMUM_INTENSITY_BLEND,
          slabThickness: 10000,
        },
      ],
      viewportIds
    );
  }

  const idSelected = 0;
  // Manipulation Tools
  toolGroup.addTool(ReferenceLines.toolName, {
    sourceViewportId: viewportIds[idSelected],
  });
  toolGroup.addTool(StackScrollMouseWheelTool.toolName);
  // Add Crosshairs tool and configure it to link the three viewports
  // These viewports could use different tool groups. See the PET-CT example
  // for a more complicated used case.
  toolGroup.addTool(OrientationMarkerTool.toolName);
  toolGroup.addTool(ZoomTool.toolName);
  toolGroup.addTool(PanTool.toolName);
  toolGroup.addTool(TrackballRotateTool.toolName);

  toolGroup.setToolActive(OrientationMarkerTool.toolName);
  toolGroup.setToolActive(StackScrollMouseWheelTool.toolName);
  toolGroup.setToolEnabled(ReferenceLines.toolName);
  toolGroup.setToolActive(TrackballRotateTool.toolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Primary, // Left Click
      },
    ],
  });
  toolGroup.setToolActive(PanTool.toolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Auxiliary, // Middle Click
      },
    ],
  });
  toolGroup.setToolActive(ZoomTool.toolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Secondary, // Right Click
      },
    ],
  });

  // Render the image
  renderingEngine.renderViewports(viewportIds);
}

run();
