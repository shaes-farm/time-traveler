'use client';
// import React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Unstable_Grid2';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';

const IMPORTANCE_DESCRIPTIONS = [
    '1 - Least important',
    '2 - Less important',
    '3 - Less important',
    '4 - Less important',
    '5 - Moderatly important',
    '6 - Moderatly important',
    '7 - More important',
    '8 - More important',
    '9 - More important',
    '10 - Most important',
];

function getValueText(value: number): string {
    return value >= 1 && value <= 10 ? IMPORTANCE_DESCRIPTIONS[value - 1] : `${value}`;
}

interface ImportanceMeterProps {
    importance: number;
    onChange: (importance: number) => void;
}

export function ImportanceMeter({ importance, onChange }: ImportanceMeterProps): JSX.Element {
    const handleChange = (event: Event, newValue: number | number[]): void => {
        if (typeof newValue === 'number') {
            onChange(newValue);
        }
    };

    return (
        <Card variant="outlined">
            <CardHeader
                sx={{ px: 2, py: 1 }}
                title={
                    <Typography id="importance-slider" sx={{ my: 1 }} variant="h3">
                        Importance
                    </Typography>
                }
            />
            <Divider />
            <CardContent>
                <Grid container spacing={0}>
                    <Grid xs={12}>
                        <Slider
                            aria-labelledby="importance-slider"
                            getAriaValueText={getValueText}
                            marks
                            max={10}
                            min={1}
                            onChange={handleChange}
                            step={1}
                            value={importance}
                            valueLabelDisplay="auto"
                        />
                    </Grid>
                    <Grid textAlign="center" xs={12}>
                        <Typography variant="caption">
                            {/* select a value between 1 and 10 */}
                            {getValueText(importance)}
                        </Typography>
                    </Grid>
                    <Grid textAlign="center" xs={12}>
                        <Typography variant="caption">
                            1 is least important, 10 is most important
                        </Typography>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}
