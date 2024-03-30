'use client';
// import React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
// import Grid from '@mui/material/Unstable_Grid2';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';

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
                {/* <Grid container spacing={2}>
                    <Grid mb={2} sm={6} xs={12}> */}
                <Slider
                    aria-labelledby="importance-slider"
                    getAriaValueText={(value: number) => value.toString()}
                    marks
                    max={10}
                    min={1}
                    onChange={handleChange}
                    step={1}
                    value={importance}
                    valueLabelDisplay="auto"
                />
                {/* </Grid>
                </Grid> */}
            </CardContent>
        </Card>
    );
}
