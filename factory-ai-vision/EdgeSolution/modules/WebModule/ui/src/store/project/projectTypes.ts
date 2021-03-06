import { ThunkAction, Action } from '@reduxjs/toolkit';
import { State } from 'RootStateType';

export type Project = {
  isLoading: boolean;
  trainingLog: string;
  data: ProjectData;
  originData: ProjectData;
  progress: number;
  trainingMetrics: TrainingMetrics;
  status: Status;
  error: Error;
};

export type TrainingMetrics = {
  prevConsequence: Consequence;
  curConsequence: Consequence;
};

export enum Status {
  None = 'none',
  WaitTraining = 'waitTraining',
  FinishTraining = 'finishTraining',
  TrainingFailed = 'trainingFailed',
  StartInference = 'startInference',
}

export const TrainingStatus = {
  'finding project': 10,
  'uploading project': 20,
  'uploading parts': 30,
  'uploading images': 40,
  'preparing training task': 50,
  'preparing custom vision environment': 60,
  training: 70,
  exporting: 80,
  deploying: 90,
};

export type Consequence = {
  precision: number;
  recall: number;
  mAP: number;
};

export enum InferenceMode {
  PartDetection = 'PD',
  PartCounting = 'PC',
  EmployeeSafety = 'ES',
  DefectDetection = 'DD',
}

export enum InferenceProtocol {
  Http = 'http',
  GRPC = 'grpc',
}

export enum InferenceSource {
  LVA = 'lva',
  CaptureModule = 'capture_module',
}

export type ProjectData = {
  id: number;
  cameras: number[];
  location: number;
  parts: number[];
  trainingProject: number;
  needRetraining: boolean;
  accuracyRangeMin: number;
  accuracyRangeMax: number;
  maxImages: number;
  sendMessageToCloud: boolean;
  framesPerMin: number;
  modelUrl: string;
  // use text input brings a better UX, so we set it to string here
  probThreshold: string;
  name: string;
  sendVideoToCloud: boolean;
  // TODO
  cameraToBeRecord: number[];
  inferenceMode: InferenceMode;
  deployTimeStamp: string;
  setFpsManually: boolean;
  fps: number;
  totalRecomendedFps: number;
  recomendedFps: number;
  inferenceProtocol: InferenceProtocol;
  inferenceSource: InferenceSource;
};

// Describing the different ACTION NAMES available
type ProjectAction = {
  isDemo: boolean;
};
// FIXME Replace constant with string
export const GET_PROJECT_REQUEST = 'GET_PROJECT_REQUEST';
export type GetProjectRequestAction = ProjectAction & {
  type: typeof GET_PROJECT_REQUEST;
};

export const GET_PROJECT_SUCCESS = 'GET_PROJECT_SUCCESS';
export type GetProjectSuccessAction = ProjectAction & {
  type: typeof GET_PROJECT_SUCCESS;
  payload: {
    project: ProjectData;
    hasConfigured: boolean;
  };
};

export const GET_PROJECT_FAILED = 'GET_PROJECT_FAILED';
export type GetProjectFailedAction = ProjectAction & {
  type: typeof GET_PROJECT_FAILED;
  error: Error;
};

export const GET_TRAINING_LOG_REQUEST = 'GET_TRAINING_LOG_REQUEST';
export type GetTrainingLogRequesAction = ProjectAction & {
  type: typeof GET_TRAINING_LOG_REQUEST;
};

export const GET_TRAINING_LOG_SUCCESS = 'GET_TRAINING_LOG_SUCCESS';
export type GetTrainingLogSuccessAction = ProjectAction & {
  type: typeof GET_TRAINING_LOG_SUCCESS;
  payload: {
    trainingLog: string;
    newStatus: Status;
    progress: number;
  };
};

export const GET_TRAINING_LOG_FAILED = 'GET_TRAINING_LOG_FAILED';
export type GetTrainingLogFailedAction = ProjectAction & {
  type: typeof GET_TRAINING_LOG_FAILED;
  error: Error;
};

export const GET_TRAINING_METRICS_REQUEST = 'GET_TRAINING_METRICS_REQUEST';
export type GetTrainingMetricsRequestAction = ProjectAction & {
  type: typeof GET_TRAINING_METRICS_REQUEST;
};

export const GET_TRAINING_METRICS_SUCCESS = 'GET_TRAINING_METRICS_SUCCESS';
export type GetTrainingMetricsSuccessAction = ProjectAction & {
  type: typeof GET_TRAINING_METRICS_SUCCESS;
  payload: {
    prevConsequence: Consequence;
    curConsequence: Consequence;
  };
};

export const GET_TRAINING_METRICS_FAILED = 'GET_TRAINING_METRICS_FAILED';
export type GetTrainingMetricsFailedAction = ProjectAction & {
  type: typeof GET_TRAINING_METRICS_FAILED;
  error: Error;
};

export const POST_PROJECT_REQUEST = 'POST_PROJECT_REQUEST';
export type PostProjectRequestAction = ProjectAction & {
  type: typeof POST_PROJECT_REQUEST;
};

export const POST_PROJECT_SUCCESS = 'POST_PROJECT_SUCCESS';
export type PostProjectSuccessAction = ProjectAction & {
  type: typeof POST_PROJECT_SUCCESS;
  data: ProjectData;
};

export const POST_PROJECT_FALIED = 'POST_PROJECT_FALIED';
export type PostProjectFaliedAction = ProjectAction & {
  type: typeof POST_PROJECT_FALIED;
  error: Error;
};

export const UPDATE_PROJECT_DATA = 'UPDATE_PROJECT_DATA';
export type UpdateProjectDataAction = ProjectAction & {
  type: typeof UPDATE_PROJECT_DATA;
  payload: Partial<ProjectData>;
};

export const START_INFERENCE = 'START_INFERENCE';
export type StartInferenceAction = ProjectAction & {
  type: typeof START_INFERENCE;
};

export const STOP_INFERENCE = 'STOP_INFERENCE';
export type StopInferenceAction = ProjectAction & {
  type: typeof STOP_INFERENCE;
};

export type ChangeStatusAction = ProjectAction & {
  type: 'CHANGE_STATUS';
  status: Status;
};

export type ProjectActionTypes =
  | GetProjectRequestAction
  | GetProjectSuccessAction
  | GetProjectFailedAction
  | GetTrainingLogRequesAction
  | GetTrainingLogSuccessAction
  | GetTrainingLogFailedAction
  | PostProjectRequestAction
  | PostProjectSuccessAction
  | PostProjectFaliedAction
  | UpdateProjectDataAction
  | GetTrainingMetricsRequestAction
  | GetTrainingMetricsSuccessAction
  | GetTrainingMetricsFailedAction
  | StartInferenceAction
  | StopInferenceAction
  | ChangeStatusAction;

// Describing the different THUNK ACTION NAMES available
export type ProjectThunk<ReturnType = void> = ThunkAction<ReturnType, State, unknown, Action<string>>;
