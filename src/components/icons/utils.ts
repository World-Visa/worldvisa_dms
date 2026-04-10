import { IconType } from 'react-icons/lib';
import {
  RiCellphoneFill,
  RiChatThreadFill,
} from 'react-icons/ri';
import { StepTypeEnum } from '@/lib/enums';
import { Mail3Fill } from './mail-3-fill';
import { Notification5Fill } from './notification-5-fill';
import { Sms } from './sms';

export const STEP_TYPE_TO_ICON: Record<StepTypeEnum, IconType> = {
  [StepTypeEnum.CHAT]: RiChatThreadFill,
  [StepTypeEnum.EMAIL]: Mail3Fill as IconType,
  [StepTypeEnum.IN_APP]: Notification5Fill as IconType,
  [StepTypeEnum.PUSH]: RiCellphoneFill,
  [StepTypeEnum.CALL]: Sms as IconType,
};
