import ControlTable from '../components/PodTemperatures';
import { Grid, Paper, Box, Skeleton, styled } from '@mui/material';

const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  }));


function ControlGrid() {


    return (
        <div>
            <Grid container rowSpacing={1} columnSpacing={{ xs: 1, md: 2 }} sx={{ margin: "1%"}}>
                <Grid item xs={12} md={12}>
                </Grid>
                <Grid item xs={6} md={8}>
                    <Item sx={{ width: "100%", height: "300px"}}>
                        xs=6 md=8
                    </Item>
                </Grid>
                <Grid item xs={6} md={4}>
                    <Item sx={{ width: "100%", height: "300px"}}>
                        xs=6 md=8
                    </Item>
                </Grid>
                <Grid item xs={6} md={4}>
                <Item sx={{ width: "100%", height: "300px"}}>
                        xs=6 md=8
                    </Item>
                </Grid>
                <Grid item xs={6} md={8}>
                <Item sx={{ width: "100%", height: "300px"}}>
                        xs=6 md=8
                    </Item>
                </Grid>
                <Grid item xs={6} md={4}>
                <Item sx={{ width: "100%", height: "300px"}}>
                        xs=6 md=8
                    </Item>
                </Grid>
                <Grid item xs={12} md={12}>
                <Item sx={{ width: "100%", height: "300px"}}>
                        xs=6 md=8
                    </Item>
                </Grid>
            </Grid>
        </div>
    );
}

export default ControlGrid;