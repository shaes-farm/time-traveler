'use client';
import React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Unstable_Grid2';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

interface DateRangePickerProps {
    beginDate: string;
    endDate: string;
    onChangeBeginDate: (beginDate: string) => void;
    onChangeEndDate: (endDate: string) => void;
}

export function DateRangePicker({
    beginDate,
    endDate,
    onChangeBeginDate,
    onChangeEndDate
}: DateRangePickerProps): JSX.Element {
    const handleChangeBeginDate: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (e) => {
        onChangeBeginDate(e.target.value);
    };

    const handleChangeEndDate: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (e) => {
        onChangeEndDate(e.target.value);
    };

    return (
        <Card variant="outlined">
            <CardHeader
                sx={{ px: 2, py: 1 }}
                title={
                    <Typography sx={{ my: 1 }} variant="h3">
                        Date Range
                    </Typography>
                }
            />
            <Divider />
            <CardContent>
                <Grid container spacing={2}>
                    <Grid mb={2} sm={6} xs={12}>
                        <TextField
                            fullWidth
                            id="begin-date"
                            label="Begin Date"
                            name="beginDate"
                            onChange={handleChangeBeginDate}
                            required
                            value={beginDate}
                        />
                    </Grid>
                    <Grid mb={2} sm={6} xs={12}>
                        <TextField
                            fullWidth
                            id="end-date"
                            label="End Date"
                            name="endDate"
                            onChange={handleChangeEndDate}
                            value={endDate}
                        />
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}
