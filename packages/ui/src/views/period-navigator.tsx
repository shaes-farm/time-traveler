import {useState} from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import type {Period} from 'service';
import {HorizontalStepper} from '../components/horizontal-stepper';
import {PeriodTimeline} from './period-timeline';

interface PeriodNavigatorProps {
  periods: Period[];
}

export function PeriodNavigator(props: PeriodNavigatorProps): JSX.Element {
  const {periods} = props;
  const [step, setStep] = useState<number>(periods.length ? 1 : 0);

  return (
    <Stack>
      <Box sx={{ py: '1em' }}>
        <HorizontalStepper activeStep={step} steps={
          periods.map((period, index) => ({
            label: period.title,
            onClick: () => {setStep(index + 1)},
          }))
        } />
      </Box>
      <Box sx={{ px: '4em' }}>
        <PeriodTimeline alternate period={periods[step - 1]} reverse />
      </Box>
    </Stack>
  );
};
