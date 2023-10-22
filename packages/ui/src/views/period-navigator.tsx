'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {Box, Stack} from '@mui/material';
import type {Period} from 'service';
import {HorizontalStepper} from '../components/horizontal-stepper';
import {PeriodTimeline} from './period-timeline';

export interface PeriodNavigatorProps {
  periods: Period[];
  timelineRoute: string;
}

export function PeriodNavigator(props: PeriodNavigatorProps): JSX.Element {
  const {periods, timelineRoute} = props;
  const router = useRouter()
  const [step, setStep] = useState<number>(1);

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
        {periods.length ?
          <PeriodTimeline
            onSelect={(slug: string) => {
              router.push(`${timelineRoute}/${slug}`)
            }}
            period={periods[step - 1]}
          />
        : null}
      </Box>
    </Stack>
  );
};
