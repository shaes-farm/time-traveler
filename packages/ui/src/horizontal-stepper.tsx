'use client'
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import type { StepIconProps } from '@mui/material/StepIcon';

const Connector = styled(StepConnector)(({theme}) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: 'calc(-50% + 16px)',
    right: 'calc(50% + 16px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#784af4',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#784af4',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderTopWidth: 3,
    borderRadius: 1,
  },
}));

const StepIconRoot = styled('div')<{ ownerState: { active?: boolean } }>(
  ({ theme, ownerState }) => ({
    color: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#eaeaf0',
    display: 'flex',
    height: 22,
    alignItems: 'center',
    ...(ownerState.active && {
      color: '#784af4',
    }),
    '& .StepIcon-completedIcon': {
      color: '#784af4',
      zIndex: 1,
      fontSize: 18,
    },
    '& .StepIcon-circle': {
      width: 8,
      height: 8,
      borderRadius: '50%',
      backgroundColor: 'currentColor',
    },
  }),
);

function StepIcon(props: StepIconProps): JSX.Element {
  const { active, completed, className } = props;

  return (
    <StepIconRoot className={className} ownerState={{ active }}>
      {completed ? (
        <RadioButtonCheckedIcon className="StepIcon-completedIcon" />
      ) : (
        <div className="StepIcon-circle" />
      )}
    </StepIconRoot>
  );
}

interface HorizontalStep {
  label: string;
  link: string;
}

interface HorizontalStepperProps {
  steps: HorizontalStep[];
}

export function HorizontalStepper(props: HorizontalStepperProps): JSX.Element {
  const {steps} = props;
  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={-1} alternativeLabel connector={<Connector />}>
        {steps.map((step) => (
          <Step key={step.label}>
            <StepLabel StepIconComponent={StepIcon}>
              <Link
                color="inherit"
                href={step.link}
                underline="hover"
              >
                {step.label}
              </Link>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
